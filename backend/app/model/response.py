from pydantic import BaseModel
from typing import Optional, Any

class SuccessResponse(BaseModel):
    status: int = 200
    success: bool = True
    data: Optional[Any] = None

class FailureResponse(BaseModel):
    status: int = 500
    error: bool = True
    message: str = "An error occurred"