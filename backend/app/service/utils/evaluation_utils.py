"""
Fairness preprocessing utilities — implemented locally to avoid aequitas.flow's
broken dependency chain (hpt / omegaconf / hydra are not on PyPI).
"""

import numpy as np
import pandas as pd
from themis_ml.preprocessing.relabelling import Relabeller


def run_label_flipping(X_train, y_train, s_train):
    """Flip labels to equalise positive rates across groups (Kamiran & Calders 2012)."""
    X = X_train.copy()
    y = y_train.copy()
    s = s_train.cat.codes if hasattr(s_train, "cat") else s_train.astype(int)

    overall_pos_rate = y.mean()
    rng = np.random.default_rng(42)

    for g in s.unique():
        mask = s == g
        group_pos_rate = y[mask].mean()

        if group_pos_rate > overall_pos_rate + 1e-6:
            pos_idx = y.index[mask & (y == 1)]
            n_flip = int(round(len(pos_idx) * (1 - overall_pos_rate / group_pos_rate)))
            n_flip = min(n_flip, len(pos_idx))
            if n_flip > 0:
                y.loc[rng.choice(pos_idx, size=n_flip, replace=False)] = 0

        elif group_pos_rate < overall_pos_rate - 1e-6:
            neg_idx = y.index[mask & (y == 0)]
            n_flip = int(round(len(neg_idx) * (overall_pos_rate - group_pos_rate) /
                               (1 - group_pos_rate + 1e-9)))
            n_flip = min(n_flip, len(neg_idx))
            if n_flip > 0:
                y.loc[rng.choice(neg_idx, size=n_flip, replace=False)] = 1

    return X, y


def run_data_repairer(X_train, y_train, s_train):
    """
    Rank-based data repair: make numerical feature distributions group-independent
    (simplified Feldman et al. 2015, repair_level=1.0).
    """
    X = X_train.copy()
    s = s_train.cat.codes if hasattr(s_train, "cat") else s_train.astype(int)

    num_cols = X.select_dtypes(include=np.number).columns.tolist()

    for col in num_cols:
        overall_sorted = np.sort(X[col].dropna().values)
        n = len(overall_sorted)
        if n == 0:
            continue

        for g in s.unique():
            g_idx = X.index[s == g]
            vals = X.loc[g_idx, col]
            ranks = vals.rank(pct=True, method="average")
            mapped = np.interp(ranks, np.linspace(0, 1, n), overall_sorted)
            X.loc[g_idx, col] = mapped

    return X, y_train.copy()


def run_prevalence_sampling(X_train, y_train, s_train):
    """Resample so positive rate equals overall rate within each group."""
    X = X_train.copy()
    y = y_train.copy()
    s = s_train.cat.codes if hasattr(s_train, "cat") else s_train.astype(int)

    overall_pos_rate = float(y.mean())
    rng = np.random.default_rng(42)
    keep = []

    for g in s.unique():
        g_mask = (s == g).values
        g_positions = np.where(g_mask)[0]
        g_labels = y.iloc[g_positions].values

        pos_positions = g_positions[g_labels == 1]
        neg_positions = g_positions[g_labels == 0]

        n_total = len(g_positions)
        n_pos_target = int(round(n_total * overall_pos_rate))
        n_neg_target = n_total - n_pos_target

        sampled_pos = rng.choice(pos_positions,
                                 size=min(n_pos_target, len(pos_positions)),
                                 replace=False)
        sampled_neg = rng.choice(neg_positions,
                                 size=min(n_neg_target, len(neg_positions)),
                                 replace=False)
        keep.extend(sampled_pos.tolist())
        keep.extend(sampled_neg.tolist())

    keep = sorted(keep)
    return X.iloc[keep].reset_index(drop=True), y.iloc[keep].reset_index(drop=True)


def run_relabeller(X_train, y_train, s_train):
    relabeller = Relabeller()
    relabeller.fit(X_train, y_train, s_train)
    y_transformed = relabeller.transform(X_train)
    return X_train, y_transformed


def run_ftu(X_train, y_train, s_train, sensitive_column=None):
    """Fairness Through Unawareness: drop the sensitive column from features."""
    X = X_train.copy()
    if sensitive_column and sensitive_column in X.columns:
        X = X.drop(columns=[sensitive_column])
    return X, y_train.copy()


def run_exponentiated_gradient(X_train_scaled, y_train, s_train, model):
    """
    Exponentiated Gradient (Agarwal et al. 2018): trains the given estimator
    subject to Demographic Parity constraints via iterative reweighting.
    Returns the fitted mitigated model.
    """
    from fairlearn.reductions import ExponentiatedGradient, DemographicParity
    from sklearn.base import clone

    s = s_train.cat.codes if hasattr(s_train, "cat") else s_train.astype(int)
    mitigator = ExponentiatedGradient(
        estimator=clone(model),
        constraints=DemographicParity(),
    )
    mitigator.fit(X_train_scaled, y_train, sensitive_features=s)
    return mitigator


def run_grid_search(X_train_scaled, y_train, s_train, model):
    """
    Grid Search (fairlearn): enumerates over a grid of Lagrange multipliers
    to find a model satisfying Demographic Parity constraints.
    """
    from fairlearn.reductions import GridSearch, DemographicParity
    from sklearn.base import clone

    s = s_train.cat.codes if hasattr(s_train, "cat") else s_train.astype(int)
    mitigator = GridSearch(
        estimator=clone(model),
        constraints=DemographicParity(),
        grid_size=20,
    )
    mitigator.fit(X_train_scaled, y_train, sensitive_features=s)
    return mitigator


def run_reject_option(model, X_train_scaled, y_train, X_test_scaled, s_test):
    """
    Reject Option Classification (Kamiran et al. 2012): adjusts predictions
    near the decision boundary to favor the unprivileged group.
    """
    s = s_test.cat.codes.values if hasattr(s_test, "cat") else np.asarray(s_test, dtype=int)

    model.fit(X_train_scaled, y_train)

    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(X_test_scaled)[:, 1]
    elif hasattr(model, 'decision_function'):
        raw = model.decision_function(X_test_scaled)
        proba = 1.0 / (1.0 + np.exp(-raw))
    else:
        return model.predict(X_test_scaled)

    y_pred = (proba >= 0.5).astype(int)
    theta = 0.15  # uncertainty band around 0.5

    uncertain = (proba >= 0.5 - theta) & (proba <= 0.5 + theta)
    # Unprivileged group (s==0): give favorable outcome
    y_pred[uncertain & (s == 0)] = 1
    # Privileged group (s==1): give unfavorable outcome
    y_pred[uncertain & (s == 1)] = 0

    return y_pred


def run_equalized_odds(model, X_train_scaled, y_train, s_train, X_test_scaled, s_test):
    """
    Equalized Odds Postprocessing (Hardt et al. 2016): uses fairlearn's
    ThresholdOptimizer to find group-specific thresholds that satisfy
    equalized odds constraints.
    """
    from fairlearn.postprocessing import ThresholdOptimizer
    from sklearn.base import clone

    s_tr = s_train.cat.codes.values if hasattr(s_train, "cat") else np.asarray(s_train, dtype=int)
    s_te = s_test.cat.codes.values if hasattr(s_test, "cat") else np.asarray(s_test, dtype=int)

    model.fit(X_train_scaled, y_train)

    postprocessor = ThresholdOptimizer(
        estimator=model,
        constraints="equalized_odds",
        prefit=True,
    )
    postprocessor.fit(X_train_scaled, y_train, sensitive_features=s_tr)
    y_pred = postprocessor.predict(X_test_scaled, sensitive_features=s_te)

    return np.asarray(y_pred, dtype=int)
