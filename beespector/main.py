from typing import List, Dict, Any, Tuple, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import cloudpickle
import logging
import hashlib
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import roc_curve, precision_recall_curve, confusion_matrix, roc_auc_score, f1_score, accuracy_score
from sklearn.inspection import partial_dependence
from ucimlrepo import fetch_ucirepo
from sklearn.impute import SimpleImputer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class InitializeContextRequest(BaseModel):
    dataset_name: str
    base_classifier: str
    classifier_params: Dict[str, Any] = {}
    mitigation_method: str
    mitigation_params: Dict[str, Any] = {}
    sensitive_feature: str

class InitialDataPoint(BaseModel):
    id: int; x1: float; x2: float; true_label: int; features: Dict[str, Any]
    pred_label: int; pred_prob: float; mitigated_pred_label: int; mitigated_pred_prob: float

class EvaluatedPointPrediction(BaseModel):
    pred_label: int; pred_prob: float

class EvaluatedPointData(BaseModel):
    id: int; x1: float; x2: float; features: Dict[str, Any]; true_label: int
    base_model_prediction: EvaluatedPointPrediction; mitigated_model_prediction: EvaluatedPointPrediction

class FeatureStats(BaseModel):
    featureName: str; count: int; missing: int; mean: float; min: float; max: float
    median: float; std: float; histogram: List[Dict[str, Any]]

# --- Global Context ---
class BeespectorContext:
    def __init__(self):
        self.dataset_df: Optional[pd.DataFrame] = None
        self.X_train: Optional[pd.DataFrame] = None
        self.X_test: Optional[pd.DataFrame] = None
        self.y_train: Optional[pd.Series] = None
        self.y_test: Optional[pd.Series] = None
        self.base_model: Optional[Any] = None
        self.mitigated_model: Optional[Any] = None
        self.feature_columns: List[str] = []
        self.categorical_features: List[str] = []
        self.numerical_features: List[str] = []
        self.target_column: str = ""
        self.dataset_name: str = ""
        self.base_classifier_type: str = ""
        self.mitigation_method: str = ""
        self.sensitive_feature_conceptual: str = ""
        self.sensitive_feature_actual: str = ""
        self.x1_feature: str = ""
        self.x2_feature: str = ""
        self.preprocessor: Optional[Any] = None
        self.is_initialized: bool = False

context = BeespectorContext()
app = FastAPI(title="Beespector API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

CACHE_DIR = "model_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# --- Helper Functions ---

def load_dataset(dataset_name: str) -> pd.DataFrame:
    dataset_map = {"adult": 20, "german": 144}
    if dataset_name not in dataset_map: 
        raise ValueError(f"Unsupported dataset: {dataset_name}")
    
    logger.info(f"Fetching {dataset_name} dataset...")
    dataset = fetch_ucirepo(id=dataset_map[dataset_name])
    df = pd.concat([dataset.data.features, dataset.data.targets], axis=1)
    df.columns = [c.strip().replace('-', '_').lower() for c in df.columns]
    
    if dataset_name == "adult":
        def is_positive_income(x): 
            return '>50' in str(x).lower().strip()
        df['target'] = df['income'].apply(is_positive_income).astype(int)
        df = df.drop(columns=['income'])
        df.replace('?', np.nan, inplace=True)
        
    elif dataset_name == "german":
        
        df['target'] = df['class'].apply(lambda x: 1 if x == 1 else 0)
        df = df.drop(columns=['class'])
        
        
        categorical_mappings = {
            'attribute1': {1: 'A11', 2: 'A12', 3: 'A13', 4: 'A14'},
            'attribute3': {0: 'A30', 1: 'A31', 2: 'A32', 3: 'A33', 4: 'A34'},
            'attribute4': {0: 'A40', 1: 'A41', 2: 'A42', 3: 'A43', 4: 'A44', 5: 'A45', 6: 'A46', 8: 'A48', 9: 'A49', 10: 'A410'},
            'attribute6': {1: 'A61', 2: 'A62', 3: 'A63', 4: 'A64', 5: 'A65'},
            'attribute7': {1: 'A71', 2: 'A72', 3: 'A73', 4: 'A74', 5: 'A75'},
            'attribute9': {1: 'A91', 2: 'A92', 3: 'A93', 4: 'A94', 5: 'A95'},
            'attribute10': {1: 'A101', 2: 'A102', 3: 'A103'},
            'attribute12': {1: 'A121', 2: 'A122', 3: 'A123', 4: 'A124'},
            'attribute14': {1: 'A141', 2: 'A142', 3: 'A143'},
            'attribute15': {1: 'A151', 2: 'A152', 3: 'A153'},
            'attribute17': {1: 'A171', 2: 'A172', 3: 'A173', 4: 'A174'},
            'attribute19': {1: 'A191', 2: 'A192'},
            'attribute20': {1: 'A201', 2: 'A202'},
        }
        
        
        for col, mapping in categorical_mappings.items():
            if col in df.columns:
                # Check if already in string format
                sample_val = df[col].dropna().iloc[0] if len(df[col].dropna()) > 0 else None
                if sample_val is not None and isinstance(sample_val, str) and sample_val.startswith('A'):
                    logger.info(f"{col} already in string format")
                    continue
                
                # Apply mapping
                original_count = len(df[col].dropna())
                df[col] = df[col].map(mapping)
                mapped_count = len(df[col].dropna())
                
                if mapped_count < original_count:
                    logger.warning(f"{col}: Lost {original_count - mapped_count} values during mapping")
                
                logger.info(f"{col} mapped successfully")
        
        logger.info(f"German dataset categorical encoding completed")
    
    df = df.dropna(subset=['target'])
    df.reset_index(drop=True, inplace=True)
    df['id'] = df.index
    
    logger.info(f"Target distribution for {dataset_name}: \n{df['target'].value_counts()}")
    return df

def get_feature_types(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    features = [c for c in df.columns if c not in ['target', 'id']]
    numerical = df[features].select_dtypes(include=np.number).columns.tolist()
    categorical = df[features].select_dtypes(exclude=np.number).columns.tolist()
    
    for col in numerical[:]:
        if df[col].nunique() < 15 and col not in ['age', 'attribute13']:
            numerical.remove(col)
            categorical.append(col)
    
    logger.info(f"Numerical features: {numerical}")
    logger.info(f"Categorical features: {categorical}")
    return categorical, numerical

def create_preprocessor(cat_feats: List[str], num_feats: List[str], dataset_name: str):
    ordinal_features = []
    ordinal_categories = []
    
    if dataset_name == 'german':
        german_ordinal_map = {
            'attribute3': ['A30', 'A31', 'A32', 'A33', 'A34'],
            'attribute6': ['A65', 'A61', 'A62', 'A63', 'A64'],
            'attribute7': ['A71', 'A72', 'A73', 'A74', 'A75']
        }
        for feature in list(cat_feats):
            if feature in german_ordinal_map:
                ordinal_features.append(feature)
                ordinal_categories.append(german_ordinal_map[feature])
                cat_feats.remove(feature)
    
    numerical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')), 
        ('scaler', StandardScaler())
    ])
    
    categorical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')), 
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    ordinal_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ordinal', OrdinalEncoder(categories=ordinal_categories)),
        ('scaler', StandardScaler())
    ])
    
    return ColumnTransformer(
        transformers=[
            ('num', numerical_pipeline, num_feats),
            ('cat', categorical_pipeline, cat_feats),
            ('ord', ordinal_pipeline, ordinal_features)
        ],
        remainder='passthrough'
    )

def train_model(X_train: pd.DataFrame, y_train: pd.Series, classifier_type: str, params: Dict[str, Any], preprocessor: Any, sample_weight: Optional[np.ndarray] = None) -> Pipeline:
    clf_map = {
        'xgbclassifier': XGBClassifier, 
        'random_forest': RandomForestClassifier, 
        'random_forest_classifier': RandomForestClassifier,
        'svc': SVC, 
        'support_vector_classification': SVC, 
        'logistic_regression': LogisticRegression
    }
    
    clf_key = classifier_type.lower().replace(' ', '_').replace('_(svc)', '')
    if clf_key not in clf_map: 
        raise ValueError(f"Unsupported classifier: {classifier_type}")
    
    ClassifierClass = clf_map[clf_key]
    
    
    default_params = {'random_state': 150200729}  
    
    if 'svc' in clf_key or 'support_vector_classification' in clf_key:
        default_params.update({
            'probability': True,
            'class_weight': 'balanced'  # Handle class imbalance
        })
    elif 'random_forest' in clf_key:
        default_params.update({
            'class_weight': 'balanced',  # Handle class imbalance
            'n_estimators': 100,
            'max_depth': 15,  # Prevent overfitting
            'min_samples_split': 5,
            'min_samples_leaf': 2
        })
    elif 'xgbclassifier' in clf_key:
        # Calculate scale_pos_weight for XGBoost class balancing
        neg_count = (y_train == 0).sum()
        pos_count = (y_train == 1).sum()
        scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0
        
        default_params.update({
            'use_label_encoder': False,
            'eval_metric': 'logloss',
            'scale_pos_weight': scale_pos_weight,  # Handle class imbalance
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100
        })
    elif 'logistic_regression' in clf_key:
        default_params.update({
            'class_weight': 'balanced',  # Handle class imbalance
            'max_iter': 1000  # Ensure convergence
        })
    
    final_params = {**default_params, **{k: v for k, v in params.items() if v is not None and v != ''}}
    classifier = ClassifierClass(**final_params)
    
    logger.info(f"Creating classifier {ClassifierClass.__name__} with params: {final_params}")
    
    pipeline = Pipeline([('preprocessor', preprocessor), ('classifier', classifier)])
    
    if sample_weight is not None:
        try:
            pipeline.fit(X_train, y_train, classifier__sample_weight=sample_weight)
            logger.info("Successfully fitted model with sample weights.")
        except TypeError:
            logger.warning(f"Classifier {clf_key} doesn't support sample weights. Fitting without them.")
            pipeline.fit(X_train, y_train)
    else:
        pipeline.fit(X_train, y_train)
    
    return pipeline

def get_mitigation_weights(X_train: pd.DataFrame, y_train: pd.Series, sensitive_col: str):
    X_train_copy = X_train.copy()
    
    if sensitive_col == 'age' or sensitive_col == 'attribute13':
        age_threshold = 30
        sensitive_values = np.where(X_train_copy[sensitive_col] <= age_threshold, 'Young', 'Old')
    else:
        sensitive_values = X_train_copy[sensitive_col]
    
    y_and_sensitive = pd.DataFrame({'y': y_train, 'sensitive': sensitive_values})
    overall_positive_rate = y_train.mean()
    group_positive_rates = y_and_sensitive.groupby('sensitive')['y'].mean()
    
    logger.info(f"Overall positive rate: {overall_positive_rate:.3f}")
    logger.info(f"Group positive rates for '{sensitive_col}':\n{group_positive_rates}")
    
    weights = np.ones(len(y_train))
    
    for group_val, group_rate in group_positive_rates.items():
        if pd.isna(group_val): 
            continue
        if group_rate > 0 and overall_positive_rate > 0:
            # Cap extreme weights to prevent bias ***
            raw_weight_factor = overall_positive_rate / group_rate
            # Cap weights between 0.2 and 5.0 to prevent extreme bias
            weight_factor = np.clip(raw_weight_factor, 0.2, 5.0)
            
            weights[y_and_sensitive['sensitive'] == group_val] = weight_factor
            logger.info(f"Group '{group_val}': raw_weight={raw_weight_factor:.3f}, capped_weight={weight_factor:.3f}")
    
    # Log weight distribution for debugging
    logger.info(f"Weight distribution: min={weights.min():.3f}, max={weights.max():.3f}, mean={weights.mean():.3f}")
    
    return weights

@app.post("/api/initialize_context")
async def initialize_context_endpoint(request: InitializeContextRequest):
    global context
    try:
        logger.info(f"Initializing context: {request.model_dump_json(indent=2)}")
        context = BeespectorContext()
        context.dataset_name = request.dataset_name
        df = load_dataset(context.dataset_name)
        context.dataset_df = df
        
        if df['target'].nunique() < 2:
            raise ValueError(f"Dataset '{context.dataset_name}' loaded with only one class.")

        clf_key = request.base_classifier.lower().replace(' ', '_').replace('_(svc)', '')
        is_svc_scenario = "svc" in clf_key or "support_vector_classification" in clf_key
        
        if context.dataset_name == "adult" and is_svc_scenario:
            logger.warning("Adult+SVC scenario detected. Loading pre-trained models.")
            
            base_model_path = os.path.join(CACHE_DIR, "pretrained_adult_svc_default.pkl")
            if not os.path.exists(base_model_path):
                raise HTTPException(status_code=501, detail="Base pre-trained model not found. Please run pretrain_svc.py.")
            with open(base_model_path, 'rb') as f:
                context.base_model = cloudpickle.load(f)
            logger.info("Loaded pre-trained BASE model.")

            mitigation_method_key = request.mitigation_method.lower().replace(' ', '_')
            if mitigation_method_key == 'none':
                context.mitigated_model = context.base_model
                logger.info("No mitigation selected, using base model as mitigated model.")
            else:
                mitigated_model_path = os.path.join(CACHE_DIR, f"mitigated_adult_svc_{mitigation_method_key}.pkl")
                if not os.path.exists(mitigated_model_path):
                     raise HTTPException(status_code=501, detail=f"Required pre-trained mitigated model for '{mitigation_method_key}' not found. Please run pretrain_svc.py.")
                with open(mitigated_model_path, 'rb') as f:
                    context.mitigated_model = cloudpickle.load(f)
                logger.info(f"Loaded pre-trained MITIGATED model for '{mitigation_method_key}'.")
            
            context.is_initialized = True
            context.base_classifier_type = request.base_classifier
            context.mitigation_method = request.mitigation_method
            context.feature_columns = [c for c in df.columns if c not in ['target', 'id']]
            context.x1_feature, context.x2_feature = "age", "hours_per_week"
            # Use stratified split with fixed random state ***
            _, context.X_test, _, context.y_test = train_test_split(
                df[context.feature_columns], df['target'], 
                test_size=0.2, random_state=150200729, stratify=df['target']
            )

        else:
            logger.info("Training live model...")
            context.target_column = 'target'
            context.feature_columns = [c for c in df.columns if c not in ['target', 'id']]
            
            if context.dataset_name == "adult":
                context.x1_feature, context.x2_feature, age_col, sex_col = "age", "hours_per_week", "age", "sex"
            elif context.dataset_name == "german":
                context.x1_feature, context.x2_feature, age_col, sex_col = "attribute13", "attribute5", "attribute13", "sex"
            
            context.sensitive_feature_conceptual = request.sensitive_feature
            if request.sensitive_feature == 'age': 
                context.sensitive_feature_actual = age_col
            elif request.sensitive_feature == 'sex': 
                context.sensitive_feature_actual = sex_col
            else: 
                context.sensitive_feature_actual = request.sensitive_feature
            
            X, y = df[context.feature_columns], df[context.target_column]
            
            #Use fixed random state and stratified split ***
            context.X_train, context.X_test, context.y_train, context.y_test = train_test_split(
                X, y, test_size=0.2, random_state=150200729, stratify=y
            )
            
            context.categorical_features, context.numerical_features = get_feature_types(df)
            context.preprocessor = create_preprocessor(context.categorical_features, context.numerical_features, context.dataset_name)
            
            context.base_classifier_type = request.base_classifier
            context.mitigation_method = request.mitigation_method
            
            # Train base model
            context.base_model = train_model(
                context.X_train, context.y_train, 
                request.base_classifier, request.classifier_params, 
                context.preprocessor
            )
            
            # Train mitigated model
            if context.mitigation_method.lower() != 'none':
                weights = get_mitigation_weights(context.X_train, context.y_train, context.sensitive_feature_actual)
                context.mitigated_model = train_model(
                    context.X_train, context.y_train, 
                    request.base_classifier, request.classifier_params, 
                    context.preprocessor, sample_weight=weights
                )
            else:
                context.mitigated_model = context.base_model
            
            context.is_initialized = True
        
        return {
            "status": "success", 
            "message": "Context initialized", 
            "dataset": context.dataset_name, 
            "base_classifier": request.base_classifier, 
            "mitigation_method": request.mitigation_method, 
            "n_samples": len(df)
        }

    except Exception as e:
        logger.error(f"Error initializing context: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")

@app.get("/api/datapoints", response_model=Dict[str, List[InitialDataPoint]])
async def get_all_datapoints():
    if not context.is_initialized: 
        raise HTTPException(status_code=400, detail="Context not initialized.")
    
    #Use stratified sampling to ensure balanced visualization
    sample_size = min(100, len(context.X_test))
    
    # Get stratified sample to ensure balanced representation
    if len(context.y_test.unique()) > 1:
        try:
            X_sample, _, y_sample, _ = train_test_split(
                context.X_test, context.y_test, 
                train_size=sample_size, 
                random_state=150200729,  
                stratify=context.y_test
            )
        except ValueError:
            # Fallback if stratification fails
            logger.warning("Stratified sampling failed, using random sampling")
            X_sample = context.X_test.sample(n=sample_size, random_state=150200729)
            y_sample = context.y_test.loc[X_sample.index]
    else:
        X_sample = context.X_test.sample(n=sample_size, random_state=150200729)
        y_sample = context.y_test.loc[X_sample.index]
    
    # Log the sample distribution for debugging
    logger.info(f"Sample class distribution: {y_sample.value_counts().to_dict()}")
    
    base_labels, base_probs = context.base_model.predict(X_sample), context.base_model.predict_proba(X_sample)[:, 1]
    mit_labels, mit_probs = context.mitigated_model.predict(X_sample), context.mitigated_model.predict_proba(X_sample)[:, 1]
    
    # Log prediction distributions for debugging
    logger.info(f"Base model predictions: {np.bincount(base_labels)}")
    logger.info(f"Mitigated model predictions: {np.bincount(mit_labels)}")
    
    datapoints = []
    for i, (idx, row) in enumerate(X_sample.iterrows()):
        x1_val = row.get(context.x1_feature)
        x2_val = row.get(context.x2_feature)
        datapoints.append(InitialDataPoint(
            id=int(idx),
            x1=float(x1_val) if x1_val is not None else 0.0,
            x2=float(x2_val) if x2_val is not None else 0.0,
            true_label=int(y_sample.loc[idx]),
            features={k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()},
            pred_label=int(base_labels[i]),
            pred_prob=float(base_probs[i]),
            mitigated_pred_label=int(mit_labels[i]),
            mitigated_pred_prob=float(mit_probs[i])
        ))
    
    return {"data": datapoints}

@app.get("/api/context_info")
async def get_context_info():
    if not context.is_initialized:
        raise HTTPException(status_code=400, detail="Context not initialized.")
    return {
        "dataset": context.dataset_name, 
        "x1_feature": context.x1_feature,
        "x2_feature": context.x2_feature, 
        "sensitive_feature": context.sensitive_feature_conceptual,
        "base_classifier": context.base_classifier_type, 
        "mitigation_method": context.mitigation_method,
        "features": context.feature_columns, 
        "n_samples": len(context.dataset_df) if context.dataset_df is not None else 0
    }

@app.put("/api/datapoints/{point_id}/evaluate", response_model=EvaluatedPointData)
async def evaluate_modified_point(point_id: int, payload: Dict[str, Any]):
    if not context.is_initialized: 
        raise HTTPException(status_code=400, detail="Context not initialized.")
    
    features = payload.get('features', {})
    feature_data = {}
    for col in context.feature_columns:
        feature_data[col] = features.get(col)
    
    X_point = pd.DataFrame([feature_data], columns=context.feature_columns)
    
    base_labels, base_probs = context.base_model.predict(X_point), context.base_model.predict_proba(X_point)[:, 1]
    mit_labels, mit_probs = context.mitigated_model.predict(X_point), context.mitigated_model.predict_proba(X_point)[:, 1]
    
    true_label = int(context.dataset_df.loc[point_id, 'target']) if point_id in context.dataset_df.index else 0
    
    return EvaluatedPointData(
        id=point_id,
        x1=float(np.nan_to_num(X_point.iloc[0].get(context.x1_feature))),
        x2=float(np.nan_to_num(X_point.iloc[0].get(context.x2_feature))),
        features=X_point.iloc[0].to_dict(),
        true_label=true_label,
        base_model_prediction={"pred_label": int(base_labels[0]), "pred_prob": float(base_probs[0])},
        mitigated_model_prediction={"pred_label": int(mit_labels[0]), "pred_prob": float(mit_probs[0])}
    )

@app.get("/api/features")
async def get_features():
    if not context.is_initialized: 
        raise HTTPException(status_code=400, detail="Context not initialized.")
    
    features_list = []
    numerical_features = list(context.numerical_features) if hasattr(context, 'numerical_features') else []
    
    for col in numerical_features:
        if col not in context.dataset_df.columns: 
            continue
        
        series = context.dataset_df[col].dropna().astype(float)
        if len(series) == 0: 
            continue
        
        hist, bins = np.histogram(series, bins=10)
        histogram = [{"bin": f"{bins[i]:.1f}-{bins[i+1]:.1f}", "value": int(hist[i])} for i in range(len(hist))]
        
        features_list.append(FeatureStats(
            featureName=col, 
            count=int(series.count()), 
            missing=int(context.dataset_df[col].isna().sum()),
            mean=float(np.nan_to_num(series.mean())), 
            min=float(np.nan_to_num(series.min())),
            max=float(np.nan_to_num(series.max())), 
            median=float(np.nan_to_num(series.median())),
            std=float(np.nan_to_num(series.std())), 
            histogram=histogram
        ))
    
    return {"features": features_list}

@app.get("/api/performance_fairness")
async def get_performance_fairness():
    if not context.is_initialized: 
        raise HTTPException(status_code=400, detail="Context not initialized.")
    
    base_labels, base_probs = context.base_model.predict(context.X_test), context.base_model.predict_proba(context.X_test)[:, 1]
    y_true = context.y_test
    
    fpr, tpr, _ = roc_curve(y_true, base_probs)
    precision, recall, _ = precision_recall_curve(y_true, base_probs)
    cm = confusion_matrix(y_true, base_labels)
    
    stat_parity, disparate_impact, eq_opp = 0.0, 1.0, 0.0
    
    # Use sensitive_feature_actual if available
    sensitive_col_name = getattr(context, 'sensitive_feature_actual', None)
    if sensitive_col_name and sensitive_col_name in context.X_test.columns:
        sensitive_col = context.X_test[sensitive_col_name]
        groups = sensitive_col.dropna().unique()
        if len(groups) >= 2:
            g1_mask, g2_mask = (sensitive_col == groups[0]), (sensitive_col == groups[1])
            p_g1, p_g2 = base_labels[g1_mask].mean(), base_labels[g2_mask].mean()
            stat_parity = p_g1 - p_g2
            disparate_impact = p_g1 / (p_g2 + 1e-6)
            tpr_g1, tpr_g2 = base_labels[(g1_mask) & (y_true == 1)].mean(), base_labels[(g2_mask) & (y_true == 1)].mean()
            eq_opp = tpr_g1 - tpr_g2

    return {
        "roc_curve": [{"fpr": f, "tpr": t} for f, t in zip(fpr, tpr)],
        "pr_curve": [{"recall": r, "precision": p} for r, p in zip(recall, precision)],
        "confusion_matrix": {"tn": int(cm[0, 0]), "fp": int(cm[0, 1]), "fn": int(cm[1, 0]), "tp": int(cm[1, 1])},
        "fairness_metrics": {
            "StatisticalParityDiff": float(np.nan_to_num(stat_parity)), 
            "DisparateImpact": float(np.nan_to_num(disparate_impact, nan=1.0)), 
            "EqualOpportunityDiff": float(np.nan_to_num(eq_opp))
        },
        "performance_metrics": {
            "Accuracy": float(accuracy_score(y_true, base_labels)), 
            "F1Score": float(f1_score(y_true, base_labels)), 
            "AUC": float(roc_auc_score(y_true, base_probs))
        }
    }

@app.get("/api/partial_dependence")
async def get_partial_dependence():
    if not context.is_initialized: 
        raise HTTPException(status_code=400, detail="Context not initialized.")
    
    
    X_sample = context.X_test.sample(n=min(200, len(context.X_test)), random_state=150200729)
    features_to_plot = [context.x1_feature, context.x2_feature]
    pd_results = {}
    
    for feature_name in features_to_plot:
        if not feature_name or feature_name not in X_sample.columns: 
            continue
        try:
            base_pd = partial_dependence(context.base_model, X_sample, features=[feature_name], grid_resolution=20)
            mitigated_pd = partial_dependence(context.mitigated_model, X_sample, features=[feature_name], grid_resolution=20)
            grid_vals, base_avg, mit_avg = base_pd['grid_values'][0], base_pd['average'][0], mitigated_pd['average'][0]
            pd_results[feature_name] = [{"x": float(x), "base": float(b), "mitigated": float(m)} for x, b, m in zip(grid_vals, base_avg, mit_avg)]
        except Exception as e:
            logger.warning(f"Could not calculate PDP for '{feature_name}': {e}")
    
    return {"partial_dependence_data": pd_results}