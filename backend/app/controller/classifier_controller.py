# app/controller/item_controller.py
from model.response import SuccessResponse
from service.classifier_service import ClassifierService
from fastapi import APIRouter

router = APIRouter(
    prefix="/classifiers",
    tags=["Classifiers"],
)

@router.get("/", response_model=SuccessResponse)
def get_classifiers():
    service = ClassifierService()
    classifiers = service.get_classifiers()

    return SuccessResponse(data=classifiers)