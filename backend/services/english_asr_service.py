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
    """Transcribe English audio using a local Whisper model."""
    global _model
    if _model is None:
        load_model()

    if _model is None:
        logger.error("English ASR model is not loaded.")
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "en",
            "status": "model_not_loaded",
            "error": "Local Whisper ASR model is unavailable.",
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
