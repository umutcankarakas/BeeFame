# app/service/item_service.py
from repository.classifier_repository import ClassifierRepository
from model.classifier import ClassifierInfo
from typing import List

class ClassifierService:
    def __init__(self):
        pass
    
    def get_classifiers(self) -> List[ClassifierInfo]:
        return ClassifierRepository.get_classifiers()
