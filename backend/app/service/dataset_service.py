# app/service/dataset_service.py
from repository.dataset_repository import DatasetRepository
from model.dataset import DatasetAnalysis, DatasetInfo
from service.utils.dataset_utils import initial_dataset_analysis
from typing import List

class DatasetService:
    def __init__(self):
        pass

    def get_datasets(self) -> List[DatasetInfo]:
        return DatasetRepository.get_datasets()
    
    def get_initial_dataset_analysis(self, dataset_id) -> List[DatasetAnalysis]:
        return initial_dataset_analysis(dataset_id)

    