from typing import List, Dict, Any, Optional, Tuple
from fairlearn.metrics import (
    MetricFrame,
    selection_rate,
    true_positive_rate,
    false_positive_rate
)
import pandas as pd
from model.classifier import ClassifierName
from model.dataset import DatasetName
pd.set_option('future.no_silent_downcasting', True)
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, precision_score
from ucimlrepo import fetch_ucirepo

# ─────────────────────────────────────────────
# Label map'leri
# ─────────────────────────────────────────────

COLUMN_VALUE_LABELS: Dict[str, Dict[str, str]] = {
    "age_binary":     {"0": "Young", "1": "Old", "False": "Young", "True": "Old"},
    "sex_Female":     {"0": "Male",  "1": "Female", "False": "Male", "True": "Female"},
    "Attribute9_A91": {"0": "Female","1": "Male",   "False": "Female","True": "Male"},
    "race_binary":    {"0": "Non-white", "1": "White", "False": "Non-white", "True": "White"},
}

COLUMN_DISPLAY: Dict[str, str] = {
    "age_binary":     "Age",
    "sex_Female":     "Gender",
    "Attribute9_A91": "Gender",
    "race_binary":    "Race",
}

def make_readable_group_label(cols: List[str], vals: List[str]) -> str:
    parts = []
    for col, val in zip(cols, vals):
        display = COLUMN_DISPLAY.get(col, col)
        label = COLUMN_VALUE_LABELS.get(col, {}).get(val, val)
        parts.append(f"{display}={label}")
    return " × ".join(parts)

def create_subgroup_column(X: pd.DataFrame, cols: List[str]) -> pd.Series:
    result = X[cols[0]].astype(str)
    for col in cols[1:]:
        result = result + "_x_" + X[col].astype(str)
    return result

# ─────────────────────────────────────────────
# Mevcut metrik fonksiyonları
# ─────────────────────────────────────────────

def calculate_statistical_parity_difference(X, y_true, y_pred, sensitive_column):
    sr = lambda y_true, y_pred: selection_rate(y_true, y_pred)
    mf = MetricFrame(metrics=sr, y_true=y_true, y_pred=y_pred, sensitive_features=X[sensitive_column])
    return mf.difference(method='between_groups')

def calculate_equal_opportunity_difference(X, y_true, y_pred, sensitive_column, pos_label=1):
    tpr = lambda y_true, y_pred: true_positive_rate(y_true, y_pred, pos_label=pos_label)
    mf = MetricFrame(metrics=tpr, y_true=y_true, y_pred=y_pred, sensitive_features=X[sensitive_column])
    return mf.difference(method='between_groups')

def calculate_average_odds_difference(X, y_true, y_pred, sensitive_column):
    unique_labels = np.unique(y_true)
    if len(unique_labels) == 2:
        pos_label = unique_labels[1]
    else:
        raise ValueError("y_true should have exactly two unique values")
    tpr = lambda y_true, y_pred: true_positive_rate(y_true, y_pred, pos_label=pos_label)
    fpr = lambda y_true, y_pred: false_positive_rate(y_true, y_pred, pos_label=pos_label)
    average_odds = lambda y_true, y_pred: (tpr(y_true, y_pred) + fpr(y_true, y_pred)) / 2
    mf = MetricFrame(metrics=average_odds, y_true=y_true, y_pred=y_pred, sensitive_features=X[sensitive_column])
    return mf.difference(method='between_groups')

def calculate_disparate_impact(X, y_true, y_pred, sensitive_column):
    sr = lambda y_true, y_pred: selection_rate(y_true, y_pred)
    mf = MetricFrame(metrics=sr, y_true=y_true, y_pred=y_pred, sensitive_features=X[sensitive_column])
    return mf.ratio(method='between_groups')

def calculate_theil_index(y_true, y_pred):
    actual_pos = np.mean(y_true == 1)
    pred_pos = np.mean(y_pred == 1)
    epsilon = 1e-10
    actual_entropy = -(actual_pos * np.log2(actual_pos + epsilon) + (1 - actual_pos) * np.log2(1 - actual_pos + epsilon))
    pred_entropy = -(pred_pos * np.log2(pred_pos + epsilon) + (1 - pred_pos) * np.log2(1 - pred_pos + epsilon))
    return pred_entropy - actual_entropy

# ─────────────────────────────────────────────
# Per-group metrics
# ─────────────────────────────────────────────

def calculate_per_group_metrics(
    y_true,
    y_pred,
    y_prob,
    subgroup_series: pd.Series,
    cols: List[str],
) -> Tuple[Dict[str, Dict[str, Any]], float, float]:
    """
    Her subgroup'u overall'a karşı ölçer.
    Returns (per_group_dict, fairness_index, weighted_accuracy).
    privilege_status: 'privileged' | 'unprivileged' | 'neutral'
    """
    y_true_arr = np.array(y_true).flatten()
    y_pred_arr = np.array(y_pred).flatten()
    sg_arr = pd.Series(subgroup_series.values, index=range(len(subgroup_series)))
    n_total = len(y_true_arr)

    epsilon = 1e-10

    overall_sr = np.mean(y_pred_arr == 1)
    pos_mask_all = y_true_arr == 1
    neg_mask_all = y_true_arr == 0
    overall_tpr = np.mean(y_pred_arr[pos_mask_all] == 1) if pos_mask_all.sum() > 0 else 0.0
    overall_fpr = np.mean(y_pred_arr[neg_mask_all] == 1) if neg_mask_all.sum() > 0 else 0.0
    overall_fnr = 1.0 - overall_tpr

    results = {}
    group_weighted_scores: Dict[str, float] = {}
    group_supports: Dict[str, float] = {}
    group_sizes: Dict[str, int] = {}

    for group in sg_arr.unique():
        mask = (sg_arr == group).values
        n_g = int(mask.sum())

        sg_true = y_true_arr[mask]
        sg_pred = y_pred_arr[mask]

        sg_sr = np.mean(sg_pred == 1)
        spd = float(sg_sr - overall_sr)

        sg_pos = (sg_true == 1)
        sg_tpr = float(np.mean(sg_pred[sg_pos] == 1)) if sg_pos.sum() > 0 else 0.0
        eod = float(sg_tpr - overall_tpr)

        sg_neg = (sg_true == 0)
        sg_fpr = float(np.mean(sg_pred[sg_neg] == 1)) if sg_neg.sum() > 0 else 0.0
        aod = float(((sg_tpr - overall_tpr) + (sg_fpr - overall_fpr)) / 2)

        sg_fnr = 1.0 - sg_tpr
        fpr_div = float(abs(sg_fpr - overall_fpr))
        fnr_div = float(abs(sg_fnr - overall_fnr))

        di = float(sg_sr / (overall_sr + epsilon))

        actual_pos_sg = np.mean(sg_true == 1)
        pred_pos_sg = np.mean(sg_pred == 1)
        act_ent = -(actual_pos_sg * np.log2(actual_pos_sg + epsilon) + (1 - actual_pos_sg) * np.log2(1 - actual_pos_sg + epsilon))
        pred_ent = -(pred_pos_sg * np.log2(pred_pos_sg + epsilon) + (1 - pred_pos_sg) * np.log2(1 - pred_pos_sg + epsilon))
        theil = float(pred_ent - act_ent)

        ppv: Optional[float] = None
        try:
            if np.sum(sg_pred == 1) > 0:
                ppv = float(precision_score(sg_true, sg_pred, zero_division=0))
        except Exception:
            pass

        sg_auc = None
        bpsn_auc = None
        bnsp_auc = None
        pinned_auc = None

        if y_prob is not None:
            y_prob_arr = np.array(y_prob).flatten()
            sg_prob = y_prob_arr[mask]

            if len(np.unique(sg_true)) == 2:
                try:
                    sg_auc = float(roc_auc_score(sg_true, sg_prob))
                except Exception:
                    pass

            bg_pos_mask = (y_true_arr == 1) & ~mask
            sg_neg_mask_auc = (y_true_arr == 0) & mask
            bpsn_mask = bg_pos_mask | sg_neg_mask_auc
            if bpsn_mask.sum() >= 2 and len(np.unique(y_true_arr[bpsn_mask])) == 2:
                try:
                    bpsn_auc = float(roc_auc_score(y_true_arr[bpsn_mask], y_prob_arr[bpsn_mask]))
                except Exception:
                    pass

            bg_neg_mask = (y_true_arr == 0) & ~mask
            sg_pos_mask_auc = (y_true_arr == 1) & mask
            bnsp_mask = bg_neg_mask | sg_pos_mask_auc
            if bnsp_mask.sum() >= 2 and len(np.unique(y_true_arr[bnsp_mask])) == 2:
                try:
                    bnsp_auc = float(roc_auc_score(y_true_arr[bnsp_mask], y_prob_arr[bnsp_mask]))
                except Exception:
                    pass

            if bpsn_auc is not None and bnsp_auc is not None:
                pinned_auc = (bpsn_auc + bnsp_auc) / 2

        sg_accuracy = float(accuracy_score(sg_true, sg_pred)) if len(sg_true) > 0 else None

        parts = str(group).split("_x_")
        readable = make_readable_group_label(cols, parts) if len(parts) == len(cols) else str(group)

        support_g = n_g / n_total
        max_div = max(abs(spd), fpr_div, fnr_div)
        group_weighted_scores[readable] = support_g * max_div
        group_supports[readable] = support_g
        group_sizes[readable] = n_g

        results[readable] = {
            "SPD": spd,
            "EOD": eod,
            "AOD": aod,
            "DI": di,
            "Theil": theil,
            "FPR_div": fpr_div,
            "FNR_div": fnr_div,
            "PPV": ppv,
            "tpr": sg_tpr,
            "fpr": sg_fpr,
            "Subgroup AUC": sg_auc,
            "BPSN AUC": bpsn_auc,
            "BNSP AUC": bnsp_auc,
            "Pinned AUC": pinned_auc,
            "accuracy": sg_accuracy,
        }

    # Lin 2024: Fairness Index — weighted divergence sum for groups with support > 0.1
    fairness_index = float(sum(
        score for label, score in group_weighted_scores.items()
        if group_supports.get(label, 0) > 0.1
    )) if group_weighted_scores else 0.0

    # Weighted average accuracy across subgroups (weight = group size / total)
    weighted_accuracy = float(sum(
        results[g]["accuracy"] * group_sizes[g]
        for g in results
        if results[g]["accuracy"] is not None
    ) / n_total) if results and n_total > 0 else 0.0

    return results, fairness_index, weighted_accuracy

# ─────────────────────────────────────────────
# initial_dataset_analysis
# ─────────────────────────────────────────────

def initial_dataset_analysis(
    dataset_names: List[str],
    classifiers: List[Dict[str, Any]],
    test_size: float = 0.2,
    subgroup_pairs: Optional[List[Dict]] = None,
):
    all_results = []
    dataset_dict = {"german": 144, "adult": 2}
    requested_pairs = subgroup_pairs or []

    for dataset_name in dataset_names:
        dataset_name = dataset_name.value
        dataset = fetch_ucirepo(id=dataset_dict[dataset_name])

        X = dataset.data.features
        y = dataset.data.targets

        if isinstance(y, pd.DataFrame):
            y = y.squeeze()

        if dataset_name == "adult":
            y = y.replace({'<=50K': 0, '<=50K.': 0, '>50K': 1, '>50K.': 1}).astype(int)
            if 'age' in X.columns:
                X['age_binary'] = (X['age'] >= 50).astype(int)
                X.drop('age', axis=1, inplace=True)
            if 'race' in X.columns:
                X['race_binary'] = (X['race'] == 'White').astype(int)
                X.drop('race', axis=1, inplace=True)
            sensitive_columns = ['sex_Female', 'age_binary', 'race_binary']
            sensitive_columns_display = {'sex_Female': 'Gender', 'age_binary': "Age", 'race_binary': "Race"}
        elif dataset_name == "german":
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

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42,
        )

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        for classifier_obj in classifiers:
            classifier_name = classifier_obj.name
            params = classifier_obj.params or {}

            if classifier_name == ClassifierName.SVC.value:
                model = SVC(probability=True, **params)
            elif classifier_name == ClassifierName.RFC.value:
                model = RandomForestClassifier(random_state=42, **params)
            elif classifier_name == ClassifierName.XGB.value:
                model = XGBClassifier(random_state=42, **params)
            else:
                model = LogisticRegression(random_state=42, **params)

            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            accuracy = accuracy_score(y_test, y_pred)

            # Normal sensitive column metrikleri
            for sensitive_column in sensitive_columns:
                if sensitive_column in X.columns:
                    all_results.append({
                        "Dataset": dataset_name,
                        "Classifier": classifier_name,
                        "Sensitive Column": sensitive_columns_display[sensitive_column],
                        "Model Accuracy": accuracy,
                        "Is Subgroup": False,
                        "Per Group Metrics": None,
                        "Fairness Index": None,
                        "Statistical Parity Difference": calculate_statistical_parity_difference(X_test, y_test, y_pred, sensitive_column),
                        "Equal Opportunity Difference": calculate_equal_opportunity_difference(X_test, y_test, y_pred, sensitive_column),
                        "Average Odds Difference": calculate_average_odds_difference(X_test, y_test, y_pred, sensitive_column),
                        "Disparate Impact": calculate_disparate_impact(X_test, y_test, y_pred, sensitive_column),
                        "Theil Index": calculate_theil_index(y_test, y_pred),
                    })

            # Subgroup metrikleri
            if requested_pairs:
                try:
                    y_prob = model.predict_proba(X_test_scaled)[:, 1]
                    y_prob_series = pd.Series(y_prob, index=y_test.index)
                    has_proba = True
                except Exception:
                    has_proba = False
                    y_prob_series = None

                for pair in requested_pairs:
                    col1 = pair["col1"]
                    col2 = pair["col2"]
                    col3 = pair.get("col3")
                    label = pair["label"]

                    cols = [col1, col2] + ([col3] if col3 else [])

                    if any(c not in X_test.columns for c in cols):
                        continue

                    subgroup_series = create_subgroup_column(X_test, cols)

                    per_group, fairness_index, sg_accuracy = calculate_per_group_metrics(
                        y_test, y_pred,
                        y_prob_series if has_proba else None,
                        subgroup_series, cols
                    )

                    all_results.append({
                        "Dataset": dataset_name,
                        "Classifier": classifier_name,
                        "Sensitive Column": label,
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

    return all_results