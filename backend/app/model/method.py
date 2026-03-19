# app/model/method.py

from pydantic import BaseModel, HttpUrl
from enum import Enum

class MethodInfo(BaseModel):
    id: int
    name: str
    type: str
    url: HttpUrl
    description: str

class MethodName(Enum):
    DataRepairer = "Data Repairer"
    PrevalanceSampling = "Prevalence Sampling"
    Relabeller = "Relabeller"

