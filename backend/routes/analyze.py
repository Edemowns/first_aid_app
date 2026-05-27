from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services import gemini_service
import logging

router = APIRouter()

logger = logging.getLogger("aida.routes.analyze")


# ─────────────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────────────

class ProbeRequest(BaseModel):
    description: Optional[str] = ""
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = "image/jpeg"


class Answer(BaseModel):
    question: str
    answer: str


class DiagnoseRequest(BaseModel):
    description: Optional[str] = ""
    answers: List[Answer]
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = "image/jpeg"


class FollowUpRequest(BaseModel):
    description: Optional[str] = ""
    answers: List[Answer]
    previous_diagnosis: Dict[str, Any]
    follow_up_message: str
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = "image/jpeg"


# ─────────────────────────────────────────────────────
# STAGE 1 — PROBING
# ─────────────────────────────────────────────────────

@router.post("/probe")
async def probe_emergency(request: ProbeRequest):
    try:
        # ✅ Validate that at least text OR image exists
        has_description = bool(request.description and request.description.strip())
        has_image = bool(request.image_base64)

        if not has_description and not has_image:
            raise HTTPException(
                status_code=400,
                detail="Either description or image is required"
            )

        logger.info("PROBE REQUEST RECEIVED")
        logger.info(f"Language: {request.language}")
        logger.info(f"Has description: {has_description}")
        logger.info(f"Has image: {has_image}")

        if has_image:
            logger.info(f"Image size: {len(request.image_base64)} chars")
            logger.info(f"Media type: {request.media_type}")

        result = await gemini_service.probe(
            request.description or "",
            request.language,
            request.image_base64,
            request.media_type,
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Probe route error")
        raise HTTPException(
            status_code=500,
            detail=f"Probe error: {str(e)}"
        )


# ─────────────────────────────────────────────────────
# STAGE 2 — FINAL DIAGNOSIS
# ─────────────────────────────────────────────────────

@router.post("/diagnose")
async def diagnose_emergency(request: DiagnoseRequest):
    try:
        logger.info("DIAGNOSIS REQUEST RECEIVED")

        result = await gemini_service.diagnose(
            request.description or "",
            [a.dict() for a in request.answers],
            request.language,
            request.image_base64,
            request.media_type,
        )

        return result

    except Exception as e:
        logger.exception("Diagnosis route error")
        raise HTTPException(
            status_code=500,
            detail=f"Diagnosis error: {str(e)}"
        )


# ─────────────────────────────────────────────────────
# STAGE 3 — DYNAMIC FOLLOW-UP
# ─────────────────────────────────────────────────────

@router.post("/follow-up")
async def follow_up_emergency(request: FollowUpRequest):
    try:
        logger.info("FOLLOW-UP REQUEST RECEIVED")
        logger.info(f"Language: {request.language}")
        logger.info(f"User's Follow-up Message: '{request.follow_up_message}'")
        logger.info(f"Original Description: '{request.description or ''}'")
        logger.info(f"Previous Diagnosis: {request.previous_diagnosis}")
        logger.info(f"Answers: {[a.dict() for a in request.answers]}")

        result = await gemini_service.follow_up(
            text=request.description or "",
            answers=[a.dict() for a in request.answers],
            previous_diagnosis=request.previous_diagnosis,
            follow_up_message=request.follow_up_message,
            language=request.language,
            image=request.image_base64,
            media_type=request.media_type,
        )

        logger.info("FOLLOW-UP RESPONSE GENERATED")
        logger.info(f"AI Message response: '{result.get('message', '')}'")
        logger.info(f"Updated steps: {result.get('updated_steps', [])}")
        logger.info(f"Updated warnings: {result.get('updated_warnings', [])}")
        logger.info(f"Call immediately flag: {result.get('call_immediately', False)}")

        return result

    except Exception as e:
        logger.exception("Follow-up route error")
        raise HTTPException(
            status_code=500,
            detail=f"Follow-up error: {str(e)}"
        )