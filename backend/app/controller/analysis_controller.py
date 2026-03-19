# app/controller/analysis_controller.py
from model.analysis import AnalyseRequest
from model.response import SuccessResponse
from service.analysis_service import AnalysisService
from fastapi import APIRouter

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


@router.post("/", response_model=SuccessResponse)
def analyse_dataset(request: AnalyseRequest):
    service = AnalysisService()
    analysis_result = service.analyse(request.dataset_names, request.classifiers, test_size=request.test_size)

    return SuccessResponse(data=analysis_result)
