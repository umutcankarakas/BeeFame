# app/repository/dataset_repository.py
import json
from pathlib import Path
from typing import List, Optional
from model.classifier import ClassifierInfo, ClassifierParam

class ClassifierRepository:
    @staticmethod
    def get_classifiers() -> List[ClassifierInfo]:
        file_path = Path(__file__).parent.parent / "data" / "classifier.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Classifier file not found at {file_path}")

        with file_path.open("r", encoding="utf-8") as file:
            raw_data = json.load(file)

        classifiers = []
        for classifier in raw_data:
            params = [
                ClassifierParam(**param) for param in classifier.get("params", [])
            ]

            classifier_info = ClassifierInfo(
                id=classifier["id"],
                name=classifier["name"],
                url=classifier["url"],
                params=params
            )

            classifiers.append(classifier_info)

        return classifiers
