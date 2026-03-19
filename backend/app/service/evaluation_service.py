# app/service/evaluation_service.py
from service.utils.dataset_utils import calculate_average_odds_difference, calculate_disparate_impact, calculate_equal_opportunity_difference, calculate_statistical_parity_difference, calculate_theil_index
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
from .utils.evaluation_utils import run_data_repairer, run_label_flipping, run_prevalence_sampling, run_relabeller
from ucimlrepo import fetch_ucirepo
import warnings
import logging
import json
import re
import unicodedata
from service.redis_client import get_redis_client

class EvaluationService:
    def __init__(self): 
        self.redis_client = get_redis_client()
    
    def _get_cache_key(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float) -> str:
        return f"{self._slugify(dataset_name)}:{self._slugify(classifier_name)}:{self._slugify(method_name)}:{test_size:.4f}"

    def _slugify(self,text: str) -> str:
        # Unicode karakterleri ASCII'ye çevir
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        # Küçük harfe çevir
        text = text.lower()
        # Harf ve rakam dışındakileri tire ile değiştir
        text = re.sub(r'[^a-z0-9]+', '-', text)
        # Baş ve sondaki tireleri sil
        text = text.strip('-')
        return text
    
    def _get_cached_result(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float):
        """Cache'den sonuç getir"""
        try:
            cache_key = self._get_cache_key(dataset_name, classifier_name, method_name, test_size)
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            logging.warning(f"Cache read error: {str(e)}")
            return None

    def _set_cached_result(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float, result_data: list):
        """Sonucu cache'e kaydet"""
        try:
            cache_key = self._get_cache_key(dataset_name, classifier_name, method_name, test_size)
            # 24 saat (86400 saniye) TTL ile cache'e kaydet
            self.redis_client.setex(cache_key, 86400, json.dumps(result_data))
        except Exception as e:
            logging.warning(f"Cache write error: {str(e)}")

    def evaluate(self, dataset_list, classifier_list, method_list, test_size: float = 0.2):
        try:
            # Suppress all warnings during evaluation
            warnings.filterwarnings('ignore')
            
            random_state = 42
            datasets = {144: "german", 2: "adult"}

            classifiers = {
                "Logistic Regression": LogisticRegression(max_iter=2000, random_state=random_state),
                "Support Vector Classification (SVC)": SVC(probability=True),
                "Random Forest Classifier": RandomForestClassifier(random_state=random_state),
                "XGBClassifier": XGBClassifier(random_state=random_state)
            }

            methods = {
                "Label Flipping": run_label_flipping,
                "Data Repairer": run_data_repairer,
                "Prevalence Sampling": run_prevalence_sampling,
                "Relabeller": run_relabeller
            }

            dataset_names = [d.value for d in dataset_list]
            classifier_names = [c.value for c in classifier_list]
            method_names = [m.value for m in method_list]

            # Filter datasets, classifiers, and methods
            datasets = {k: v for k, v in datasets.items() if v in dataset_names}
            classifiers = {k: v for k, v in classifiers.items() if k in classifier_names}
            methods = {k: v for k, v in methods.items() if k in method_names}

            final_metrics = []

            # Her dataset, classifier, method kombinasyonu için önce cache'e bak
            for dataset_id, dataset_name in datasets.items():
                for method_name in methods.keys():
                    for model_name in classifiers.keys():
                        # Cache'den kontrol et
                        cached_result = self._get_cached_result(dataset_name, model_name, method_name, test_size)
                        if cached_result:
                            logging.info(f"Cache hit for {dataset_name}-{model_name}-{method_name}")
                            final_metrics.extend(cached_result)
                            continue
                        
                        # Cache'de yoksa hesapla
                        logging.info(f"Cache miss for {dataset_name}-{model_name}-{method_name}, computing...")
                        
                        # Dataset'i yükle ve hazırla
                        dataset = fetch_ucirepo(id=dataset_id)
                        X = dataset.data.features
                        y = dataset.data.targets

                        if isinstance(y, pd.DataFrame):
                            y = y.squeeze()  # Convert DataFrame to Series if necessary
                        
                        if dataset_id == 2:
                            y = y.replace({'<=50K': 0, '<=50K.': 0, '>50K': 1, '>50K.': 1}).astype(int)
                            if 'age' in X.columns:
                                age_threshold = 50
                                X['age_binary'] = (X['age'] >= age_threshold).astype(int)
                                X.drop('age', axis=1, inplace=True)  # Remove the original 'age' column
                            if 'race' in X.columns:
                                X['race_binary'] = (X['race'] == 'White').astype(int)
                                X.drop('race', axis=1, inplace=True)  # Optionally remove the original 'race' column
                            sensitive_columns = ['sex_Female', 'age_binary', 'race_binary']
                            sensitive_columns_display = {'sex_Female': 'Gender', 'age_binary': "Age", 'race_binary': "Race"}
                        elif dataset_id == 144:
                            if 'Attribute13' in X.columns:
                                age_threshold = 50
                                X['age_binary'] = (X['Attribute13'] >= age_threshold).astype(int)
                                X.drop('Attribute13', axis=1, inplace=True)  # Remove the original 'age' column
                            sensitive_columns = ['Attribute9_A91', 'age_binary']
                            sensitive_columns_display = {'Attribute9_A91': 'Gender', 'age_binary': 'Age'}

                        # Handling potential SettingWithCopyWarning correctly
                        X = X.copy().replace('?', np.nan).dropna()
                        y = y.loc[X.index]
                        
                        # Ensure y is binary (0 and 1)
                        if y.nunique() == 2 and set(y.unique()).issubset({1, 2}):
                            # Map 1 -> 0 and 2 -> 1
                            y = y.replace({1: 0, 2: 1}).astype(int)
                        
                        # One-hot encode categorical variables
                        X = pd.get_dummies(X)

                        # Bu spesifik kombinasyon için sonuçları sakla
                        combination_results = []

                        # Train and evaluate models for each sensitive attribute
                        for sensitive_column in sensitive_columns:
                            protected_attribute = pd.Series(X[sensitive_column].values, index=X.index, dtype=int)

                            # Split data once and reuse across methods
                            X_train, X_test, y_train, y_test, s_train, s_test = train_test_split(
                                X, y, protected_attribute, test_size=test_size, random_state=random_state)

                            # Ensure all feature names are strings
                            X_train.columns = X_train.columns.astype(str)
                            X_test.columns = X_test.columns.astype(str)

                            s_train = s_train.astype('category')
                            s_test = s_test.astype('category')

                            # Standardize Data
                            scaler = StandardScaler()
                            X_train_scaled = scaler.fit_transform(X_train)
                            X_test_scaled = scaler.transform(X_test)

                            # Apply fairness mitigation
                            method_func = methods[method_name]
                            X_train_transformed, y_train_transformed = method_func(X_train, y_train, s_train)
                            X_train_transformed_scaled = scaler.transform(X_train_transformed)

                            # Explicitly add column names to y_test and s_test
                            y_test_df = pd.DataFrame(y_test.values, columns=['class'])  # Ensure y_test has a 'class' column
                            s_test_df = pd.DataFrame(s_test.values, columns=[sensitive_column])

                            # Train and evaluate the specific model
                            model = classifiers[model_name]
                            model.fit(X_train_transformed_scaled, y_train_transformed)
                            y_pred = model.predict(X_test_scaled)

                            accuracy = accuracy_score(y_test, y_pred)

                            result = {
                                "Sensitive Column": sensitive_columns_display[sensitive_column],
                                "Dataset Name": dataset_name,
                                "Method Name": method_name,
                                "Model Name": model_name,
                                "Model Accuracy": accuracy,
                                "Statistical Parity Difference": calculate_statistical_parity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Equal Opportunity Difference": calculate_equal_opportunity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Average Odds Difference": calculate_average_odds_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Disparate Impact": calculate_disparate_impact(X_test, y_test_df, y_pred, sensitive_column),
                                "Theil Index": calculate_theil_index(y_test_df, y_pred)
                            }
                            
                            combination_results.append(result)

                        # Bu kombinasyonun sonuçlarını cache'e kaydet
                        self._set_cached_result(dataset_name, model_name, method_name, test_size, combination_results)
                        
                        # Final metrics'e ekle
                        final_metrics.extend(combination_results)

            return final_metrics

        except Exception as e:
            logging.error(f"Error during evaluation: {str(e)}")
            raise

    """ def evaluate(self, dataset_list, classifier_list, method_list):
        try:
            # Suppress all warnings during evaluation
            warnings.filterwarnings('ignore')
            
            test_size = 0.2
            random_state = 42
            datasets = {144: "german", 2: "adult"}

            classifiers = {
                "Logistic Regression": LogisticRegression(max_iter=2000, random_state=random_state),
                "Support Vector Classification (SVC)": SVC(probability=True),
                "Random Forest Classifier": RandomForestClassifier(random_state=random_state),
                "XGBClassifier": XGBClassifier(random_state=random_state)
            }

            methods = {
                "Label Flipping": run_label_flipping,
                "Data Repairer": run_data_repairer,
                "Prevalence Sampling": run_prevalence_sampling,
                "Relabeller": run_relabeller
            }

            dataset_names = [d.value for d in dataset_list]
            classifier_names = [c.value for c in classifier_list]
            method_names = [m.value for m in method_list]

            # Filter datasets, classifiers, and methods
            datasets = {k: v for k, v in datasets.items() if v in dataset_names}
            classifiers = {k: v for k, v in classifiers.items() if k in classifier_names}
            methods = {k: v for k, v in methods.items() if k in method_names}

            final_metrics = []

            for dataset_id, dataset_name in datasets.items():
                dataset = fetch_ucirepo(id=dataset_id)
                X = dataset.data.features
                y = dataset.data.targets

                if isinstance(y, pd.DataFrame):
                    y = y.squeeze()  # Convert DataFrame to Series if necessary
                
                if dataset_id == 2:
                    y = y.replace({'<=50K': 0, '<=50K.': 0, '>50K': 1, '>50K.': 1}).astype(int)
                    if 'age' in X.columns:
                        age_threshold = 50
                        X['age_binary'] = (X['age'] >= age_threshold).astype(int)
                        X.drop('age', axis=1, inplace=True)  # Remove the original 'age' column
                    if 'race' in X.columns:
                        X['race_binary'] = (X['race'] == 'White').astype(int)
                        X.drop('race', axis=1, inplace=True)  # Optionally remove the original 'race' column
                    sensitive_columns = ['sex_Female', 'age_binary', 'race_binary']
                    sensitive_columns_display = {'sex_Female': 'Gender', 'age_binary': "Age", 'race_binary': "Race"}
                elif dataset_id == 144:
                    if 'Attribute13' in X.columns:
                        age_threshold = 50
                        X['age_binary'] = (X['Attribute13'] >= age_threshold).astype(int)
                        X.drop('Attribute13', axis=1, inplace=True)  # Remove the original 'age' column
                    sensitive_columns = ['Attribute9_A91', 'age_binary']
                    sensitive_columns_display = {'Attribute9_A91': 'Gender', 'age_binary': 'Age'}

                # Handling potential SettingWithCopyWarning correctly
                X = X.copy().replace('?', np.nan).dropna()
                y = y.loc[X.index]
                
                # Ensure y is binary (0 and 1)
                if y.nunique() == 2 and set(y.unique()).issubset({1, 2}):
                    # Map 1 -> 0 and 2 -> 1
                    y = y.replace({1: 0, 2: 1}).astype(int)
                
                # One-hot encode categorical variables
                X = pd.get_dummies(X)

                # Train and evaluate models for each method and classifier
                for sensitive_column in sensitive_columns:
                    protected_attribute = pd.Series(X[sensitive_columns[0]].values, index=X.index, dtype=int)

                    # Split data once and reuse across methods
                    X_train, X_test, y_train, y_test, s_train, s_test = train_test_split(
                        X, y, protected_attribute, test_size=test_size, random_state=random_state)

                    # Ensure all feature names are strings
                    X_train.columns = X_train.columns.astype(str)
                    X_test.columns = X_test.columns.astype(str)

                    s_train = s_train.astype('category')
                    s_test = s_test.astype('category')

                    # Standardize Data
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    X_test_scaled = scaler.transform(X_test)

                    for method_name, method in methods.items():
                        # Apply fairness mitigation
                        X_train_transformed, y_train_transformed = method(X_train, y_train, s_train)
                        X_train_transformed_scaled = scaler.transform(X_train_transformed)

                        # Explicitly add column names to y_test and s_test
                        y_test_df = pd.DataFrame(y_test.values, columns=['class'])  # Ensure y_test has a 'class' column
                        s_test_df = pd.DataFrame(s_test.values, columns=[sensitive_column])

                        for model_name, model in classifiers.items():
                            model.fit(X_train_transformed_scaled, y_train_transformed)
                            y_pred = model.predict(X_test_scaled)

                            accuracy = accuracy_score(y_test, y_pred)

                            final_metrics.append({
                                "Sensitive Column": sensitive_columns_display[sensitive_column],
                                "Dataset Name": dataset_name,
                                "Method Name": method_name,
                                "Model Name": model_name,
                                "Model Accuracy": accuracy,
                                "Statistical Parity Difference": calculate_statistical_parity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Equal Opportunity Difference": calculate_equal_opportunity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Average Odds Difference": calculate_average_odds_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Disparate Impact": calculate_disparate_impact(X_test, y_test_df, y_pred, sensitive_column),
                                "Theil Index": calculate_theil_index(y_test_df, y_pred)
                            })

            return final_metrics

        except Exception as e:
            logging.error(f"Error during evaluation: {str(e)}")
            raise """