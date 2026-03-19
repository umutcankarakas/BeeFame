from typing import List, Dict, Any
from pydantic import BaseModel, validator
from model.dataset import DatasetName

class ClassifierRequest(BaseModel):
    name: str
    params: Dict[str, Any] = {}

class AnalyseRequest(BaseModel):
    dataset_names: List[DatasetName]
    classifiers: List[ClassifierRequest]
    test_size: float = 0.2

    @validator("test_size")
    def validate_test_size(cls, value):
        if value <= 0 or value >= 1:
            raise ValueError("test_size must be between 0 and 1")
        return value
