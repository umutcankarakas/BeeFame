# app/service/evaluation_service.py
from typing import List, Optional
from service.utils.dataset_utils import (
    calculate_average_odds_difference, calculate_disparate_impact,
    calculate_equal_opportunity_difference, calculate_statistical_parity_difference,
    calculate_theil_index,
    create_subgroup_column,
    make_readable_group_label,
    calculate_per_group_metrics,
)
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.base import clone as sk_clone
from .utils.evaluation_utils import (
    run_data_repairer, run_label_flipping, run_prevalence_sampling,
    run_relabeller, run_ftu, run_exponentiated_gradient,
    run_grid_search, run_reject_option, run_equalized_odds,
    run_threshold_optimizer_dp,
)
from ucimlrepo import fetch_ucirepo
import warnings
import logging
import json
import re
import time
import unicodedata
from service.redis_client import get_redis_client


class EvaluationService:
    def __init__(self):
        self.redis_client = get_redis_client()

    METHOD_VERSIONS = {
        "Label Flipping":                "v1",
        "Data Repairer":                 "v1",
        "Prevalence Sampling":           "v1",
        "Relabeller":                    "v1",
        "Fairness Through Unawareness":  "v1",
        "Exponentiated Gradient":        "v1",
        "Grid Search":                   "v1",
        "Reject Option Classification":  "v1",
        "Equalized Odds Postprocessing": "v1",
        "Threshold Optimizer DP":        "v1",
        "None":                          "v1",
    }

    def _get_cache_key(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float, pairs: Optional[List] = None, target_subgroup=None) -> str:
        version = self.METHOD_VERSIONS.get(method_name, "v1")
        base = f"{version}:{self._slugify(dataset_name)}:{self._slugify(classifier_name)}:{self._slugify(method_name)}:{test_size:.4f}"
        if pairs:
            pair_str = "_".join(sorted(f"{p['col1']}-{p['col2']}-{p.get('col3') or ''}" for p in pairs))
            base += f":sg_{pair_str}"
        if target_subgroup:
            c3 = (target_subgroup.col3 or '') if hasattr(target_subgroup, 'col3') else ''
            base += f":tsg_{self._slugify(target_subgroup.col1)}_{self._slugify(target_subgroup.col2)}_{c3}_{self._slugify(target_subgroup.group_label)}"
        return base

    def _slugify(self, text: str) -> str:
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = text.lower()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        text = text.strip('-')
        return text

    def _get_cached_result(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float, pairs: Optional[List] = None, target_subgroup=None):
        try:
            cache_key = self._get_cache_key(dataset_name, classifier_name, method_name, test_size, pairs, target_subgroup)
            raw = self.redis_client.get(cache_key)
            if not raw:
                return None
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and "data" in parsed:
                return parsed["data"]
            return parsed
        except Exception as e:
            logging.warning(f"Cache read error: {str(e)}")
            return None

    def _set_cached_result(self, dataset_name: str, classifier_name: str, method_name: str, test_size: float, result_data: list, pairs: Optional[List] = None, target_subgroup=None):
        try:
            cache_key = self._get_cache_key(dataset_name, classifier_name, method_name, test_size, pairs, target_subgroup)
            version = self.METHOD_VERSIONS.get(method_name, "v1")
            wrapped = {"_v": version, "_ts": int(time.time()), "data": result_data}
            self.redis_client.setex(cache_key, 86400, json.dumps(wrapped))
        except Exception as e:
            logging.warning(f"Cache write error: {str(e)}")

    def evaluate(
        self,
        dataset_list,
        classifier_list,
        method_list,
        test_size: float = 0.2,
        subgroup_pairs: Optional[List] = None,
        target_subgroup=None,
    ):
        try:
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
                "Relabeller": run_relabeller,
                "Fairness Through Unawareness": run_ftu,
                "Exponentiated Gradient": run_exponentiated_gradient,
                "Grid Search": run_grid_search,
                "Reject Option Classification": run_reject_option,
                "Equalized Odds Postprocessing": run_equalized_odds,
                "Threshold Optimizer DP": run_threshold_optimizer_dp,
            }

            INPROCESSING_METHODS = {"Exponentiated Gradient", "Grid Search"}
            POSTPROCESSING_METHODS = {"Reject Option Classification", "Equalized Odds Postprocessing", "Threshold Optimizer DP"}
            FTU_METHOD = "Fairness Through Unawareness"

            dataset_names = [d.value for d in dataset_list]
            classifier_names = [c.value for c in classifier_list]
            method_names = [m.value for m in method_list]

            datasets = {k: v for k, v in datasets.items() if v in dataset_names}
            classifiers = {k: v for k, v in classifiers.items() if k in classifier_names}
            methods = {k: v for k, v in methods.items() if k in method_names}

            requested_pairs = []
            if subgroup_pairs:
                for p in subgroup_pairs:
                    requested_pairs.append({
                        "col1": p.col1,
                        "col2": p.col2,
                        "col3": p.col3 if hasattr(p, 'col3') else None,
                        "label": p.label,
                    })

            final_metrics = []

            for dataset_id, dataset_name in datasets.items():
                for method_name in methods.keys():
                    for model_name in classifiers.keys():
                        # Cache'e bak
                        cached_result = self._get_cached_result(
                            dataset_name, model_name, method_name, test_size,
                            requested_pairs if requested_pairs else None,
                            target_subgroup,
                        )
                        if cached_result:
                            logging.info(f"Cache hit for {dataset_name}-{model_name}-{method_name}")
                            final_metrics.extend(cached_result)
                            continue

                        logging.info(f"Computing {dataset_name}-{model_name}-{method_name}...")

                        dataset = fetch_ucirepo(id=dataset_id)
                        X = dataset.data.features
                        y = dataset.data.targets

                        if isinstance(y, pd.DataFrame):
                            y = y.squeeze()

                        if dataset_id == 2:
                            y = y.replace({'<=50K': 0, '<=50K.': 0, '>50K': 1, '>50K.': 1}).astype(int)
                            if 'age' in X.columns:
                                X['age_binary'] = (X['age'] >= 50).astype(int)
                                X.drop('age', axis=1, inplace=True)
                            if 'race' in X.columns:
                                X['race_binary'] = (X['race'] == 'White').astype(int)
                                X.drop('race', axis=1, inplace=True)
                            sensitive_columns = ['sex_Female', 'age_binary', 'race_binary']
                            sensitive_columns_display = {'sex_Female': 'Gender', 'age_binary': 'Age', 'race_binary': 'Race'}
                        elif dataset_id == 144:
                            if 'Attribute13' in X.columns:
                                X['age_binary'] = (X['Attribute13'] >= 50).astype(int)
                                X.drop('Attribute13', axis=1, inplace=True)
                            sensitive_columns = ['Attribute9_A91', 'age_binary']
                            sensitive_columns_display = {'Attribute9_A91': 'Gender', 'age_binary': 'Age'}

                        X = X.copy().replace('?', np.nan).dropna()
                        y = y.loc[X.index]

                        if y.nunique() == 2 and set(y.unique()).issubset({1, 2}):
                            y = y.replace({1: 0, 2: 1}).astype(int)

                        X = pd.get_dummies(X)

                        # ── Target subgroup binary column ──
                        # When target_subgroup is provided, build a binary column
                        # (1 = target group, 0 = all others) and use it as the
                        # sensitive attribute for the mitigation algorithm.
                        # Metrics are still computed with the original sensitive columns.
                        binary_mit_col = None
                        if target_subgroup:
                            tsg_cols = [target_subgroup.col1, target_subgroup.col2]
                            if hasattr(target_subgroup, 'col3') and target_subgroup.col3:
                                tsg_cols.append(target_subgroup.col3)
                            if all(c in X.columns for c in tsg_cols):
                                sg_series_full = create_subgroup_column(X, tsg_cols)
                                target_raw_value = None
                                for raw_val in sg_series_full.unique():
                                    parts = str(raw_val).split("_x_")
                                    if len(parts) == len(tsg_cols):
                                        readable = make_readable_group_label(tsg_cols, parts)
                                        if readable == target_subgroup.group_label:
                                            target_raw_value = raw_val
                                            break
                                if target_raw_value is not None:
                                    binary_mit_col = '__target_sg__'
                                    X[binary_mit_col] = (sg_series_full == target_raw_value).astype(int)
                                    logging.info(
                                        f"Target subgroup '{target_subgroup.group_label}' binary col: "
                                        f"n_target={X[binary_mit_col].sum()}, n_total={len(X)}"
                                    )
                                else:
                                    logging.warning(f"Could not find raw value for '{target_subgroup.group_label}' in columns {tsg_cols}")
                            else:
                                logging.warning(f"Target subgroup cols {tsg_cols} not found in X")

                        combination_results = []
                        # sensitive_column -> (X_test, y_test, y_pred, y_prob_series)
                        mitigated_preds_per_col: dict = {}

                        # ── Normal sensitive column metrikleri ──
                        for sensitive_column in sensitive_columns:
                            # Use binary target subgroup col for mitigation (if provided),
                            # but compute fairness metrics against the original sensitive col.
                            mit_col = binary_mit_col if binary_mit_col else sensitive_column
                            protected_attribute = pd.Series(X[mit_col].values, index=X.index, dtype=int)

                            X_train, X_test, y_train, y_test, s_train, s_test = train_test_split(
                                X, y, protected_attribute, test_size=test_size, random_state=random_state)

                            X_train.columns = X_train.columns.astype(str)
                            X_test.columns = X_test.columns.astype(str)

                            s_train = s_train.astype('category')
                            s_test = s_test.astype('category')

                            scaler = StandardScaler()
                            X_train_scaled = scaler.fit_transform(X_train)
                            X_test_scaled = scaler.transform(X_test)

                            y_test_df = pd.DataFrame(y_test.values, columns=['class'])
                            method_func = methods[method_name]

                            if method_name == FTU_METHOD:
                                X_train_transformed, y_train_transformed = method_func(X_train, y_train, s_train, sensitive_column=mit_col)
                                X_test_ftu = X_test.drop(columns=[mit_col]) if mit_col in X_test.columns else X_test
                                ftu_scaler = StandardScaler()
                                X_train_transformed_scaled = ftu_scaler.fit_transform(X_train_transformed)
                                X_test_eval_scaled = ftu_scaler.transform(X_test_ftu)
                                model = sk_clone(classifiers[model_name])
                                model.fit(X_train_transformed_scaled, y_train_transformed)
                                y_pred = model.predict(X_test_eval_scaled)
                            elif method_name in INPROCESSING_METHODS:
                                mitigated_model = method_func(X_train_scaled, y_train, s_train, classifiers[model_name])
                                y_pred = mitigated_model.predict(X_test_scaled)
                                model = mitigated_model
                            elif method_name in POSTPROCESSING_METHODS:
                                model = sk_clone(classifiers[model_name])
                                if method_name == "Equalized Odds Postprocessing":
                                    y_pred = method_func(model, X_train_scaled, y_train, s_train, X_test_scaled, s_test)
                                else:
                                    # When a binary target subgroup col is used, 1 = unprivileged (user's choice).
                                    unprivileged_val = 1 if binary_mit_col else None
                                    y_pred = method_func(model, X_train_scaled, y_train, s_train, X_test_scaled, s_test, unprivileged_val=unprivileged_val)
                            else:
                                X_train_transformed, y_train_transformed = method_func(X_train, y_train, s_train)
                                X_train_transformed_scaled = scaler.transform(X_train_transformed)
                                model = sk_clone(classifiers[model_name])
                                model.fit(X_train_transformed_scaled, y_train_transformed)
                                y_pred = model.predict(X_test_scaled)

                            accuracy = accuracy_score(y_test, y_pred)

                            # Store mitigated predictions for subgroup metrics below
                            try:
                                if method_name == FTU_METHOD:
                                    y_prob_mit = model.predict_proba(X_test_eval_scaled)[:, 1]
                                else:
                                    y_prob_mit = model.predict_proba(X_test_scaled)[:, 1]
                                y_prob_mit_series = pd.Series(y_prob_mit, index=y_test.index)
                            except Exception:
                                y_prob_mit_series = None
                            mitigated_preds_per_col[sensitive_column] = (X_test, y_test, y_pred, y_prob_mit_series)

                            combination_results.append({
                                "Sensitive Column": sensitive_columns_display[sensitive_column],
                                "Dataset Name": dataset_name,
                                "Method Name": method_name,
                                "Model Name": model_name,
                                "Model Accuracy": accuracy,
                                "Is Subgroup": False,
                                "Per Group Metrics": None,
                                "Fairness Index": None,
                                "Statistical Parity Difference": calculate_statistical_parity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Equal Opportunity Difference": calculate_equal_opportunity_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Average Odds Difference": calculate_average_odds_difference(X_test, y_test_df, y_pred, sensitive_column),
                                "Disparate Impact": calculate_disparate_impact(X_test, y_test_df, y_pred, sensitive_column),
                                "Theil Index": calculate_theil_index(y_test_df, y_pred),
                            })

                        # ── Subgroup metrikleri (mitigated model predictions kullanılır) ──
                        if requested_pairs and mitigated_preds_per_col:
                            # All sensitive_column splits use same random_state → same X_test/y_test
                            first_col = next(iter(mitigated_preds_per_col))
                            ref_X_test = mitigated_preds_per_col[first_col][0]
                            ref_y_test = mitigated_preds_per_col[first_col][1]

                            for pair in requested_pairs:
                                col1 = pair["col1"]
                                col2 = pair["col2"]
                                col3 = pair.get("col3")
                                label = pair["label"]
                                cols = [col1, col2] + ([col3] if col3 else [])

                                if any(c not in ref_X_test.columns for c in cols):
                                    continue

                                # Use mitigation from col1 if available, else first column
                                ref_col = col1 if col1 in mitigated_preds_per_col else first_col
                                _, _, y_pred_sg, y_prob_sg = mitigated_preds_per_col[ref_col]

                                subgroup_series = create_subgroup_column(ref_X_test, cols)

                                per_group, fairness_index, sg_accuracy = calculate_per_group_metrics(
                                    ref_y_test, y_pred_sg, y_prob_sg,
                                    subgroup_series, cols
                                )

                                combination_results.append({
                                    "Sensitive Column": label,
                                    "Dataset Name": dataset_name,
                                    "Method Name": method_name,
                                    "Model Name": model_name,
                                    "Model Accuracy": sg_accuracy,
                                    "Is Subgroup": True,
                                    "Per Group Metrics": per_group,
                                    "Fairness Index": fairness_index,
                                    "Statistical Parity Difference": None,
                                    "Equal Opportunity Difference": None,
                                    "Average Odds Difference": None,
                                    "Disparate Impact": None,
                                    "Theil Index": None,
                                })

                        # Cache'e yaz
                        self._set_cached_result(
                            dataset_name, model_name, method_name, test_size,
                            combination_results,
                            requested_pairs if requested_pairs else None,
                            target_subgroup,
                        )
                        final_metrics.extend(combination_results)

            return final_metrics

        except Exception as e:
            logging.error(f"Error during evaluation: {str(e)}")
            raise