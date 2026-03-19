# app/model/classifier.py

from pydantic import BaseModel, HttpUrl, Field
from enum import Enum
from typing import List, Literal, Union, Optional

class ClassifierParam(BaseModel):
    title: str
    type: Literal["int", "float", "str", "bool"]
    default: Optional[Union[int, float, str, bool]] = None

class ClassifierInfo(BaseModel):
    id: int
    name: str
    url: HttpUrl
    params: List[ClassifierParam] = Field(default_factory=list)

class ClassifierName(Enum):
    XGB = "XGBClassifier"
    SVC = "Support Vector Classification (SVC)"
    RFC = "Random Forest Classifier"
    LR = "Logistic Regression"