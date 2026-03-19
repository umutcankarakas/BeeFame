# app/model/dataset.py

from pydantic import BaseModel, HttpUrl
from typing import List
from enum import Enum

class DatasetName(Enum):
    GERMAN = "german"
    ADULT = "adult"

class SensitiveFeatures(BaseModel):
    name: str
    unprivileged: str
    privileged: str
class DatasetInfo(BaseModel):
    id: int
    name: str
    slug: str
    url: HttpUrl
    instances: int
    description: str
    sensitive_features: List[SensitiveFeatures]

class DatasetSelectionRequest(BaseModel):
    names: List[str]

class DatasetAnalysis(BaseModel):
    sensitive_column : str
    model_accuracy : float
    statistical_parity_difference : float
    equal_opportunity_difference : float
    average_odds_difference : float
    disparate_impact : float
    theil_index : float