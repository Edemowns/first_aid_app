from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from services import gemini_service

router = APIRouter()

class AnalyzeRequest(BaseModel):
    description: str
    language: str = "en"

@router.post("/analyze")
async def analyze_emergency(request: AnalyzeRequest) -> Dict[str, Any]:
    """
    Analyze an emergency situation and return first aid guidance.
    """
    try:
        # Call the async analyze function
        result = await gemini_service.analyze(request.description, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")