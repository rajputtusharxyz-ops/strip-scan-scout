from enum import Enum
from typing import Optional
from pydantic import BaseModel


class Status(str, Enum):
    complete = "complete"
    retake_required = "retake_required"
    invalid_image = "invalid_image"
    analysis_unavailable = "analysis_unavailable"
    error = "error"


class DetectionConfidence(BaseModel):
    albumin: Optional[float] = None
    creatinine: Optional[float] = None


class AnalyzeResponse(BaseModel):
    status: Status
    albuminMgL: Optional[float] = None
    creatinineMgL: Optional[float] = None
    acr: Optional[float] = None
    detectionConfidence: DetectionConfidence = DetectionConfidence()
    capturedAt: str
    analysisBuild: Optional[str] = None
    errorCode: Optional[str] = None
    message: Optional[str] = None
