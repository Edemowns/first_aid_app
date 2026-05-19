# backend/routes/transcribe.py
# POST /transcribe — voice transcription endpoint for English and Twi

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import logging

from services import twi_asr_service, english_asr_service

router = APIRouter()
logger = logging.getLogger("aida.routes.transcribe")


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Query("en", description="Language of the audio: en or twi"),
):
    """
    Transcribe a voice recording using the configured ASR backend.
    Supports English via OpenAI Whisper and Twi via the local Twi ASR service.
    """
    logger.info(f"POST /transcribe | file={audio.filename} size={audio.size} language={language}")

    if audio.content_type and "audio" not in audio.content_type:
        raise HTTPException(status_code=400, detail="File must be an audio file.")

    try:
        audio_bytes = await audio.read()

        if language.lower() == "twi":
            result = twi_asr_service.transcribe(audio_bytes)
        else:
            result = await english_asr_service.transcribe(audio_bytes)

        # Fail loudly when transcription did not actually produce text.
        if not result.get("transcript") or result.get("status", "").startswith("error"):
            err_msg = result.get("error") or result.get("status") or "Transcription failed"
            logger.error(f"Transcription result invalid: {result}")
            raise HTTPException(status_code=500, detail=err_msg)

        return result

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/transcribe-twi")
async def transcribe_twi(audio: UploadFile = File(...)):
    """
    Backwards-compatible Twi transcription endpoint.
    """
    return await transcribe_audio(audio, language="twi")
