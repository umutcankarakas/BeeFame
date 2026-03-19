# app/service/item_service.py
from repository.method_repository import MethodRepository
from model.method import MethodInfo
from typing import List

class MethodService:
    def __init__(self):
        pass

    def get_methods(self) -> List[MethodInfo]:
        return MethodRepository.get_methods()
    
    