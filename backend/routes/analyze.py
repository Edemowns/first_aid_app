from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from services import gemini_service

router = APIRouter()

# ─────────────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────────────

class ProbeRequest(BaseModel):
    description: str
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = None


class Answer(BaseModel):
    question: str
    answer: str


class DiagnoseRequest(BaseModel):
    description: str
    answers: List[Answer]
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = None


# ─────────────────────────────────────────────────────
# STAGE 1 — PROBING
# ─────────────────────────────────────────────────────

@router.post("/probe")
async def probe_emergency(request: ProbeRequest):

    try:
        result = await gemini_service.probe(
            request.description,
            request.language,
            request.image_base64,
            request.media_type,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Probe error: {str(e)}")


@router.post("/diagnose")
async def diagnose_emergency(request: DiagnoseRequest):

    try:
        result = await gemini_service.diagnose(
            request.description,
            [a.dict() for a in request.answers],
            request.language,
            request.image_base64,
            request.media_type,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis error: {str(e)}")