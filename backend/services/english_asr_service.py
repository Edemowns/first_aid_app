import os
import logging
import tempfile

logger = logging.getLogger("aida.english_asr")

MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
_model = None


def load_model():
    """Load a local Whisper model for English transcription."""
    global _model
    try:
        import whisper
    except Exception as e:
        logger.error(
            "Local Whisper could not be imported. Install with: pip install torch whisper",
            exc_info=True,
        )
        logger.error(f"Whisper import error: {e}")
        _model = None
        return

    try:
        _model = whisper.load_model(MODEL_NAME, device="cpu")
        logger.info(f"Loaded local Whisper model: {MODEL_NAME}")
    except Exception as e:
        logger.error(f"Failed to load Whisper model '{MODEL_NAME}': {e}")
        _model = None


async def transcribe(audio_bytes: bytes) -> dict:
    """Transcribe English audio using Groq API as primary, and local Whisper as fallback."""
    global _model
    
    # Check if Groq API is available and we can use it as the primary option
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        try:
            import httpx
            logger.info("Using Groq API for English transcription.")
            
            # Use data for parameters and files for file in httpx multipart request
            files = {
                "file": ("recording.wav", audio_bytes, "audio/wav")
            }
            data = {
                "model": "whisper-large-v3",
                "language": "en"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {groq_api_key}"},
                    files=files,
                    data=data,
                    timeout=30.0
                )
                
            if response.status_code == 200:
                resp_json = response.json()
                transcript = resp_json.get("text", "").strip()
                logger.info(f"Groq API transcription successful: {transcript}")
                return {
                    "transcript": transcript,
                    "confidence": 1.0,
                    "language": "en",
                    "status": "ok",
                }
            else:
                err_detail = f"Groq API Error {response.status_code}: {response.text}"
                logger.error(err_detail)
                return {
                    "transcript": "",
                    "confidence": 0.0,
                    "language": "en",
                    "status": "groq_error",
                    "error": err_detail,
                }
        except Exception as e:
            err_detail = f"Groq transcription exception: {str(e)}"
            logger.error(err_detail)
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": "en",
                "status": "groq_exception",
                "error": err_detail,
            }

    if _model is None:
        load_model()

    if _model is None:
        logger.error("English ASR model is not loaded and Groq transcription key is missing.")
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "en",
            "status": "model_not_loaded",
            "error": "Local Whisper ASR model is unavailable, and no GROQ_API_KEY is set.",
        }

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            tf.write(audio_bytes)
            temp_path = tf.name

        result = _model.transcribe(temp_path, language="en", fp16=False)
        transcript = (result.get("text") or "").strip()
        confidence = float(result.get("confidence", 0.0) or 0.0)

        if not transcript:
            logger.warning("Whisper transcribed audio but returned no text.")
            return {
                "transcript": "",
                "confidence": confidence,
                "language": "en",
                "status": "empty_transcript",
                "error": "Whisper returned no transcript for the audio.",
            }

        return {
            "transcript": transcript,
            "confidence": confidence,
            "language": "en",
            "status": "ok",
        }

    except Exception as e:
        logger.error(f"English ASR transcription failed: {e}")
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "en",
            "status": f"error: {str(e)}",
            "error": str(e),
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
