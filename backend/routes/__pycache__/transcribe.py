# backend/routes/transcribe.py
# POST /transcribe-twi — Twi voice transcription endpoint

from fastapi import APIRouter, UploadFile, File, HTTPException
import logging

from services import twi_asr_service

router = APIRouter()
logger = logging.getLogger("aida.routes.transcribe")


@router.post("/transcribe-twi")
async def transcribe_twi(audio: UploadFile = File(...)):
    """
    Transcribe a Twi audio recording using the UG department's ASR model.
    The React Native app records audio via expo-av and POSTs it here as form-data.
    """
    logger.info(f"POST /transcribe-twi | file={audio.filename} size={audio.size}")

    if audio.content_type and "audio" not in audio.content_type:
        raise HTTPException(status_code=400, detail="File must be an audio file.")

    try:
        audio_bytes = await audio.read()
        result = twi_asr_service.transcribe(audio_bytes)
        return result

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
