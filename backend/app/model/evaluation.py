# app/model/evaluation.py
from pydantic import BaseModel, model_validator
from typing import Dict, Any, List, Optional

from model.classifier import ClassifierName
from model.dataset import DatasetName
from model.method import MethodName

class ClassificationReport(BaseModel):
    precision: Dict[str, float]
    recall: Dict[str, float]
    f1_score: Dict[str, float]
    support: Dict[str, float]

class EvaluationResult(BaseModel):
    name: str
    accuracy: float
    balanced_accuracy: float
    auc_roc: float
    classification_report: ClassificationReport
    disparate_impact: float
    statistical_parity_difference: float
    equal_opportunity_difference: float
    average_odds_difference: float
    theil_index: float

class EvaluationRequest(BaseModel):
    dataset_names: List[DatasetName]
    classifier_names: List[ClassifierName]
    method_names: List[MethodName]
    test_size: Optional[float] = 0.2
    train_size: Optional[float] = None

    @model_validator(mode="after")
    def validate_split_sizes(self):
        test_size = self.test_size
        train_size = self.train_size

        if test_size is None and train_size is None:
            self.test_size = 0.2
            self.train_size = None
            return self

        if test_size is not None and (test_size <= 0 or test_size >= 1):
            raise ValueError("test_size must be between 0 and 1")

        if train_size is not None and (train_size <= 0 or train_size >= 1):
            raise ValueError("train_size must be between 0 and 1")

        if test_size is None and train_size is not None:
            self.test_size = 1 - train_size
            return self

        if train_size is None and test_size is not None:
            return self

        if abs((test_size + train_size) - 1.0) > 1e-6:
            raise ValueError("test_size and train_size must sum to 1.0")

        return self
