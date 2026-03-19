import os
import cloudpickle
import logging
import pandas as pd
import numpy as np
from ucimlrepo import fetch_ucirepo
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.impute import SimpleImputer
from typing import List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CACHE_DIR = "model_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# --- Standalone Helper Functions ---

def load_and_clean_dataset(dataset_name: str):
    logger.info(f"Fetching and cleaning {dataset_name} dataset...")
    dataset_map = {"adult": 20, "german": 144}
    dataset = fetch_ucirepo(id=dataset_map[dataset_name])
    df = pd.concat([dataset.data.features, dataset.data.targets], axis=1)
    df.columns = [c.strip().replace('-', '_').lower() for c in df.columns]

    if dataset_name == "adult":
        def is_positive_income(x): return '>50' in str(x).lower().strip()
        df['target'] = df['income'].apply(is_positive_income).astype(int)
        df = df.drop(columns=['income'])
        df.replace('?', np.nan, inplace=True)
    elif dataset_name == "german":
        df['target'] = df['class'].apply(lambda x: 1 if x == 1 else 0)
        df = df.drop(columns=['class'])
        
    return df.dropna(subset=['target'])

def get_feature_types(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    features = [c for c in df.columns if c not in ['target', 'id']]
    numerical = df[features].select_dtypes(include=np.number).columns.tolist()
    categorical = df[features].select_dtypes(exclude=np.number).columns.tolist()
    for col in numerical[:]:
        if df[col].nunique() < 15 and col not in ['age', 'attribute13']:
            numerical.remove(col)
            categorical.append(col)
    return categorical, numerical

def create_preprocessor(cat_feats: List[str], num_feats: List[str], dataset_name: str):
    ordinal_features, ordinal_categories = [], []
    if dataset_name == 'german':
        german_ordinal_map = {
            'attribute3': ['A34', 'A33', 'A32', 'A31', 'A30'],
            'attribute6': ['A65', 'A61', 'A62', 'A63', 'A64'],
            'attribute7': ['A71', 'A72', 'A73', 'A74', 'A75']
        }
        for feature in list(cat_feats):
            if feature in german_ordinal_map:
                ordinal_features.append(feature)
                ordinal_categories.append(german_ordinal_map[feature])
                cat_feats.remove(feature)
    
    num_pipe = Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())])
    cat_pipe = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))])
    ord_pipe = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('ordinal', OrdinalEncoder(categories=ordinal_categories)), ('scaler', StandardScaler())])
    
    return ColumnTransformer(transformers=[
        ('num', num_pipe, num_feats), ('cat', cat_pipe, cat_feats), ('ord', ord_pipe, ordinal_features)
    ], remainder='passthrough')

def get_mitigation_weights(X_data: pd.DataFrame, y_data: pd.Series, sensitive_col: str):
    y_and_sensitive = pd.DataFrame({'y': y_data, 'sensitive': X_data[sensitive_col]})
    overall_positive_rate = y_data.mean()
    group_positive_rates = y_and_sensitive.groupby('sensitive')['y'].mean()
    weights = np.ones(len(y_data))
    for group_val, group_rate in group_positive_rates.items():
        if pd.notna(group_rate) and group_rate > 0 and overall_positive_rate > 0:
            weights[y_and_sensitive['sensitive'] == group_val] = overall_positive_rate / group_rate
    return weights

def pretrain_svc_on_adult():
    DATASET_NAME = "adult"
    CLASSIFIER_NAME = "svc"
    MITIGATION_METHODS = ["relabeller", "prevalence_sampling", "data_repairer"]
    SENSITIVE_FEATURE = "sex"

    logger.info(f"--- Starting Pre-training for {DATASET_NAME} + {CLASSIFIER_NAME} ---")
    df = load_and_clean_dataset(DATASET_NAME)
    cat_feats, num_feats = get_feature_types(df)
    preprocessor = create_preprocessor(cat_feats, num_feats, DATASET_NAME)
    X = df[[c for c in df.columns if c != 'target']]
    y = df['target']

    base_model_path = os.path.join(CACHE_DIR, f"pretrained_{DATASET_NAME}_{CLASSIFIER_NAME}_default.pkl")
    if not os.path.exists(base_model_path):
        logger.info(f"Training BASE {CLASSIFIER_NAME} on {DATASET_NAME}. This will take several minutes...")
        base_pipeline = Pipeline([('preprocessor', preprocessor), ('classifier', SVC(probability=True, random_state=None))])
        base_pipeline.fit(X, y)
        with open(base_model_path, 'wb') as f: cloudpickle.dump(base_pipeline, f)
        logger.info(f"Saved BASE model to {base_model_path}")
    else:
        logger.info("Base SVC model already exists. Skipping.")

    weights = get_mitigation_weights(X, y, SENSITIVE_FEATURE)
    for method in MITIGATION_METHODS:
        mitigated_model_path = os.path.join(CACHE_DIR, f"mitigated_{DATASET_NAME}_{CLASSIFIER_NAME}_{method}.pkl")
        if not os.path.exists(mitigated_model_path):
            logger.info(f"Training MITIGATED {CLASSIFIER_NAME} for '{method}'. This will also take several minutes...")
            mit_pipeline = Pipeline([('preprocessor', preprocessor), ('classifier', SVC(probability=True, random_state=None))])
            mit_pipeline.fit(X, y, classifier__sample_weight=weights)
            with open(mitigated_model_path, 'wb') as f: cloudpickle.dump(mit_pipeline, f)
            logger.info(f"Saved MITIGATED model to {mitigated_model_path}")
        else:
            logger.info(f"Mitigated model for '{method}' already exists. Skipping.")

def main():
    # Cache both datasets
    for name in ["adult", "german"]:
        data_path = os.path.join(CACHE_DIR, f"cached_{name}_dataframe.pkl")
        if not os.path.exists(data_path):
            df = load_and_clean_dataset(name)
            with open(data_path, 'wb') as f:
                cloudpickle.dump(df, f)
            logger.info(f"Cached {name} dataframe to disk.")
        else:
            logger.info(f"{name} dataframe cache already exists.")
            
    # Pre-train the slow models
    pretrain_svc_on_adult()
    
    logger.info("--- Pre-training and caching complete. ---")

if __name__ == "__main__":
    main()