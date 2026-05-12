# app/repository/dataset_repository.py
import json
from itertools import combinations
from pathlib import Path
from typing import List
import numpy as np
import pandas as pd
from ucimlrepo import fetch_ucirepo

from model.dataset import DatasetInfo, SensitiveFeatures, SubgroupPair, SubgroupPairsResponse

DATASET_ID_MAP = {"german": 144, "adult": 2}

SENSITIVE_COLUMNS_MAP = {
    "german": {
        "Age": "age_binary",
        "Gender": "Attribute9_A91",
    },
    "adult": {
        "Age": "age_binary",
        "Race": "race_binary",
        "Gender": "sex_Female",
    },
}

COLUMN_PRIVILEGE_MAP = {
    "age_binary":     {"privileged": "1", "unprivileged": "0"},
    "sex_Female":     {"privileged": "0", "unprivileged": "1"},
    "Attribute9_A91": {"privileged": "1", "unprivileged": "0"},
    "race_binary":    {"privileged": "1", "unprivileged": "0"},
}

COLUMN_VALUE_LABELS = {
    "age_binary":     {"0": "Young", "1": "Old"},
    "sex_Female":     {"0": "Male",  "1": "Female"},
    "Attribute9_A91": {"0": "Female","1": "Male"},
    "race_binary":    {"0": "Non-white", "1": "White"},
}

# Dataset başına kaç'lı kombinasyon yapılacak
COMBINATION_SIZES = {
    "german": [2],
    "adult":  [2, 3],
}

class DatasetRepository:
    @staticmethod
    def get_datasets() -> List[DatasetInfo]:
        file_path = Path(__file__).parent.parent / "data" / "dataset.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Dataset file not found at {file_path}")

        with file_path.open("r", encoding="utf-8") as file:
            raw_data = json.load(file)

        datasets = []
        for dataset in raw_data:
            sensitive_features = [
                SensitiveFeatures(
                    name=sf["name"],
                    unprivileged=sf["unprivileged"],
                    privileged=sf["privileged"],
                )
                for sf in dataset.get("sensitive_features", [])
            ]
            dataset_info = DatasetInfo(
                id=dataset["id"],
                name=dataset["name"],
                slug=dataset["slug"],
                url=dataset["url"],
                instances=dataset["instances"],
                description=dataset["description"],
                sensitive_features=sensitive_features,
            )
            datasets.append(dataset_info)

        return datasets

    @staticmethod
    def get_subgroup_pairs(slug: str) -> SubgroupPairsResponse:
        dataset_id = DATASET_ID_MAP.get(slug)
        if dataset_id is None:
            raise ValueError(f"Unknown dataset slug: {slug}")

        sensitive_col_map = SENSITIVE_COLUMNS_MAP.get(slug, {})
        if len(sensitive_col_map) < 2:
            return SubgroupPairsResponse(dataset_slug=slug, pairs=[])

        dataset = fetch_ucirepo(id=dataset_id)
        X = dataset.data.features

        if slug == "adult":
            if "age" in X.columns:
                X["age_binary"] = (X["age"] >= 50).astype(int)
                X.drop("age", axis=1, inplace=True)
            if "race" in X.columns:
                X["race_binary"] = (X["race"] == "White").astype(int)
                X.drop("race", axis=1, inplace=True)
        elif slug == "german":
            if "Attribute13" in X.columns:
                X["age_binary"] = (X["Attribute13"] >= 50).astype(int)
                X.drop("Attribute13", axis=1, inplace=True)

        X = X.copy().replace("?", np.nan).dropna()
        X = pd.get_dummies(X)

        display_map = {v: k for k, v in sensitive_col_map.items()}
        internal_cols = list(sensitive_col_map.values())
        combo_sizes = COMBINATION_SIZES.get(slug, [2])

        pairs = []
        for size in combo_sizes:
            if len(internal_cols) < size:
                continue
            for cols in combinations(internal_cols, size):
                if any(c not in X.columns for c in cols):
                    continue

                # En küçük subgroup instance sayısı
                subgroup_counts = X.groupby(list(cols)).size().reset_index(name="count")
                min_count = int(subgroup_counts["count"].min())

                # Display label: "Age x Gender" veya "Age x Gender x Race"
                label = " x ".join(display_map.get(c, c) for c in cols)

                # Privileged label: her kolonda privileged değer
                priv_vals = [
                    COLUMN_VALUE_LABELS.get(c, {}).get(
                        COLUMN_PRIVILEGE_MAP.get(c, {}).get("privileged", "1"), "?"
                    ) for c in cols
                ]
                unpriv_vals = [
                    COLUMN_VALUE_LABELS.get(c, {}).get(
                        COLUMN_PRIVILEGE_MAP.get(c, {}).get("unprivileged", "0"), "?"
                    ) for c in cols
                ]

                pairs.append(
                    SubgroupPair(
                        col1=cols[0],
                        col2=cols[1],
                        col3=cols[2] if len(cols) > 2 else None,
                        label=label,
                        instance_count=min_count,
                        warning=min_count < 100,
                        privileged_label=" x ".join(priv_vals),
                        unprivileged_label=" x ".join(unpriv_vals),
                    )
                )

        return SubgroupPairsResponse(dataset_slug=slug, pairs=pairs)