# backend/services/twi_asr_service.py
# Wrapper for the University of Ghana Twi ASR model.
# When you get the model files from your department, integrate them here.
# The route (transcribe.py) will call transcribe() — nothing else changes.

import logging
import tempfile
import os

logger = logging.getLogger("aida.twi_asr")

# ── Phase 3: Plug in your UG model here ──────────────────────────────────────
#
# STEP 1: Copy your model files into backend/twi_model/
#         e.g. backend/twi_model/checkpoint.pt
#              backend/twi_model/vocab.json
#
# STEP 2: Install your model's dependencies in requirements.txt
#
# STEP 3: Import and load the model below.
#         Example (replace with your actual model's API):
#
#   from twi_model import TwiASR
#   _model = TwiASR.load("./twi_model/checkpoint.pt")
#
# STEP 4: Replace the placeholder in transcribe() with real inference.
#
# ─────────────────────────────────────────────────────────────────────────────

_model = None  # Will hold the loaded ASR model


def load_model():
    """
    Load the Twi ASR model into memory at startup.
    Call this once from main.py when the server starts.
    """
    global _model
    model_path = "./twi_model"

    if not os.path.exists(model_path):
        logger.warning(
            f"Twi ASR model not found at {model_path}. "
            "Transcription will return empty strings until model is added."
        )
        return

    try:
        # ── Replace this block with your actual model loading code ──
        # from twi_model import TwiASR
        # _model = TwiASR.load(f"{model_path}/checkpoint.pt")
        # logger.info("Twi ASR model loaded successfully")
        logger.info("Twi ASR model placeholder — awaiting UG model files")
    except Exception as e:
        logger.error(f"Failed to load Twi ASR model: {e}")


def transcribe(audio_bytes: bytes) -> dict:
    """
    Transcribe audio bytes to Twi text.

    Args:
        audio_bytes: Raw audio data (WAV format from expo-av)

    Returns:
        dict with keys: transcript (str), confidence (float), language (str)
    """
    if _model is None:
        logger.warning("Twi ASR model not loaded — returning empty transcript")
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "twi",
            "status": "model_not_loaded",
        }

    try:
        # ── Replace this block with your actual inference code ──
        # Save bytes to a temp file (most ASR models need a file path)
        # with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        #     f.write(audio_bytes)
        #     temp_path = f.name
        #
        # result = _model.transcribe(temp_path)
        # os.unlink(temp_path)  # Clean up temp file
        #
        # return {
        #     "transcript": result.text,
        #     "confidence": result.confidence,
        #     "language": "twi",
        #     "status": "ok",
        # }

        # Placeholder until model is integrated
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "twi",
            "status": "placeholder",
            "error": "Twi ASR model is not loaded yet.",
        }

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return {
            "transcript": "",
            "confidence": 0.0,
            "language": "twi",
            "status": f"error: {str(e)}",
            "error": str(e),
        }
