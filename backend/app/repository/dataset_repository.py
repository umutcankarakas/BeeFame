# app/repository/dataset_repository.py
import json
from pathlib import Path
from typing import List, Optional
from model.dataset import DatasetInfo, SensitiveFeatures

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
                    privileged=sf["privileged"]
                ) for sf in dataset.get("sensitive_features", [])
            ]

            dataset_info = DatasetInfo(
                id=dataset["id"],
                name=dataset["name"],
                slug=dataset["slug"],
                url=dataset["url"],
                instances=dataset["instances"],
                description=dataset["description"],
                sensitive_features=sensitive_features
            )

            datasets.append(dataset_info)

        return datasets
