"""
Pydantic schemas used by the API layer.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ---------- /upload ----------

class UploadResponse(BaseModel):
    text: str


# ---------- /extract ----------

class ExtractRequest(BaseModel):
    text: str


class ExtractedFields(BaseModel):
    site_plant: Optional[str] = ""
    date_of_occurrence: Optional[str] = ""
    title: Optional[str] = ""
    source: Optional[str] = ""
    related_product: Optional[str] = ""
    batch_number: Optional[str] = ""
    detailed_description: Optional[str] = ""


# ---------- /assess-risk ----------

class AssessRiskRequest(BaseModel):
    site_plant: Optional[str] = ""
    date_of_occurrence: Optional[str] = ""
    title: Optional[str] = ""
    source: Optional[str] = ""
    related_product: Optional[str] = ""
    batch_number: Optional[str] = ""
    detailed_description: Optional[str] = ""


class RiskAssessment(BaseModel):
    initial_impact: str
    initial_severity: str  # LOW / MEDIUM / HIGH
    reasoning: str


# ---------- /deviations ----------

class DeviationCreate(BaseModel):
    site_plant: Optional[str] = ""
    date_of_occurrence: Optional[str] = ""
    title: Optional[str] = ""
    source: Optional[str] = ""
    related_product: Optional[str] = ""
    batch_number: Optional[str] = ""
    detailed_description: Optional[str] = ""
    initial_impact: Optional[str] = ""
    initial_severity: Optional[str] = ""


class DeviationOut(DeviationCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
