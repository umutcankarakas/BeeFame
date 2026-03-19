# app/controller/evaluation_controller.py
from model.evaluation import EvaluationRequest
from model.response import SuccessResponse
from service.evaluation_service import EvaluationService
from fastapi import APIRouter

router = APIRouter(
    prefix="/evaluation",
    tags=["Evaluation"],
)

@router.post("/", response_model=SuccessResponse)
def get_evaluation(request: EvaluationRequest):
    service = EvaluationService()

    result = service.evaluate(
        request.dataset_names,
        request.classifier_names,
        request.method_names,
        test_size=request.test_size,
    )
    
    return SuccessResponse(data=result)