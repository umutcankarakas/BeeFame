# app/model/dataset.py

from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Tuple
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
    sensitive_column: str
    model_accuracy: float
    statistical_parity_difference: float
    equal_opportunity_difference: float
    average_odds_difference: float
    disparate_impact: float
    theil_index: float

class SubgroupPair(BaseModel):
    col1: str
    col2: str
    col3: Optional[str] = None       # 3'lü kombinasyon için
    label: str
    instance_count: int
    warning: bool
    privileged_label: str
    unprivileged_label: str

class SubgroupPairsResponse(BaseModel):
    dataset_slug: str
    pairs: List[SubgroupPair]