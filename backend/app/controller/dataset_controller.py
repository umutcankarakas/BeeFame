# app/controller/item_controller.py
from model.response import SuccessResponse
from service.dataset_service import DatasetService
from fastapi import APIRouter

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)

@router.get("/", response_model=SuccessResponse)
def get_datasets():
    service = DatasetService()
    datasets = service.get_datasets()

    return SuccessResponse(data=datasets)

