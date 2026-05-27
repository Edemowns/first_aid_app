# backend/main.py
# AIDA — AI First Aid Assistant
# Entry point: sets up FastAPI, loads services, registers routes.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import os
import time
import logging





# Load .env file (GROQ_API_KEY etc.)
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aida")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AIDA First Aid API",
    description="AI-powered first aid assistant for Ghana — powered by Google Gemini",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialise services ───────────────────────────────────────────────────────
from services import gemini_service, twi_asr_service, english_asr_service

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY is not set. Copy .env.example to .env and add your key.")
else:
    gemini_service.configure(GROQ_API_KEY)
    logger.info("Gemini API configured")

# Load Twi ASR placeholder/model if available. English Whisper is loaded lazily only when needed.
twi_asr_service.load_model()

# ── Register routes ───────────────────────────────────────────────────────────
from routes import analyze, transcribe, facilities

app.include_router(analyze.router)
app.include_router(transcribe.router)
app.include_router(facilities.router)

# ── Root + health ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "AIDA First Aid API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": [
            "POST /probe",
            "POST /diagnose",
            "POST /transcribe",
            "POST /transcribe-twi",
            "GET /nearby-facilities",
            "GET /health"
        ]
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "groq_key_set": bool(GROQ_API_KEY),
        "timestamp": int(time.time()),
    }


# Define the request model
class FollowUpRequest(BaseModel):
    description: Optional[str] = ""
    answers: List[Dict[str, Any]]
    previous_diagnosis: Dict[str, Any]
    follow_up_message: str
    language: str = "en"
    image_base64: Optional[str] = None
    media_type: Optional[str] = "image/jpeg"

# Register the route directly in main.py
@app.post("/follow-up")
async def follow_up_emergency(request: FollowUpRequest):
    try:
        logger.info("FOLLOW-UP REQUEST RECEIVED")
        
        # Call your existing service logic
        result = await gemini_service.follow_up(
            text=request.description or "",
            answers=request.answers,
            previous_diagnosis=request.previous_diagnosis,
            follow_up_message=request.follow_up_message,
            language=request.language,
            image=request.image_base64,
            media_type=request.media_type,
        )
        return result
        
    except Exception as e:
        logger.exception("Follow-up route error")
        raise HTTPException(status_code=500, detail=f"Follow-up error: {str(e)}")
# Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000