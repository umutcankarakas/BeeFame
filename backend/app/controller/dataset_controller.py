# app/controller/dataset_controller.py
from model.response import SuccessResponse
from service.dataset_service import DatasetService
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


@router.get("/", response_model=SuccessResponse)
def get_datasets():
    service = DatasetService()
    datasets = service.get_datasets()
    return SuccessResponse(data=datasets)


@router.get("/{slug}/subgroup-pairs", response_model=SuccessResponse)
def get_subgroup_pairs(slug: str):
    service = DatasetService()
    try:
        result = service.get_subgroup_pairs(slug)
        return SuccessResponse(data=result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))