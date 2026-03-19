# app/controller/item_controller.py
from model.response import SuccessResponse
from service.method_service import MethodService
from fastapi import APIRouter

router = APIRouter(
    prefix="/methods",
    tags=["Methods"],
)

@router.get("/", response_model=SuccessResponse)
def get_methods():
    service = MethodService()
    methods = service.get_methods()

    return SuccessResponse(data=methods)