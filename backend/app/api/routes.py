"""
API routes for the Deviation Management backend.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Deviation
from app.schemas.deviation import (
    UploadResponse,
    ExtractRequest,
    ExtractedFields,
    AssessRiskRequest,
    RiskAssessment,
    DeviationCreate,
    DeviationOut,
)
from app.services.pdf_service import extract_text_from_pdf
from app.ai.groq_service import extract_fields, assess_risk

router = APIRouter()


# ---------- 1. Upload PDF ----------

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    text = extract_text_from_pdf(file_bytes)
    return {"text": text}


# ---------- 2. Extract fields ----------

@router.post("/extract", response_model=ExtractedFields)
def extract(payload: ExtractRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Field 'text' cannot be empty.")

    fields = extract_fields(payload.text)
    return fields


# ---------- 3. Assess risk ----------

@router.post("/assess-risk", response_model=RiskAssessment)
def assess(payload: AssessRiskRequest):
    data = payload.model_dump()
    if not any(data.values()):
        raise HTTPException(
            status_code=400, detail="At least one deviation field must be provided."
        )

    result = assess_risk(data)
    return result


# ---------- 4. Save deviation ----------

@router.post("/deviations", response_model=DeviationOut)
def create_deviation(payload: DeviationCreate, db: Session = Depends(get_db)):
    deviation = Deviation(**payload.model_dump())
    db.add(deviation)
    db.commit()
    db.refresh(deviation)
    return deviation


# ---------- 5. List deviations ----------

@router.get("/deviations", response_model=list[DeviationOut])
def list_deviations(db: Session = Depends(get_db)):
    return db.query(Deviation).order_by(Deviation.created_at.desc()).all()
