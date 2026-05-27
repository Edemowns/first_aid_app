import os
import json
import time
import logging
from typing import List, Dict, Any
import httpx

logger = logging.getLogger("aida.gemini")

_client = httpx.AsyncClient(timeout=20.0, limits=httpx.Limits(max_keepalive_connections=10, max_connections=20))


def configure(groq_key: str, gemini_key: str = None):
    """Configure the service with API keys"""
    if groq_key:
        os.environ["GROQ_API_KEY"] = groq_key
    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key


# ─────────────────────────────────────────────
# INTERNAL GROQ CALL
# ─────────────────────────────────────────────

async def _call_groq(system_prompt: str, user_prompt: str):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    start = time.monotonic()
    logger.info("Gemini probe call started")

    try:
        response = await _client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "temperature": 0.2,
                "max_tokens": 900,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
            },
        )

        response.raise_for_status()

        data = response.json()

        raw = data["choices"][0]["message"]["content"].strip()

        # remove markdown fences if AI adds them
        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(raw)
        elapsed = time.monotonic() - start
        logger.info(f"Gemini probe call completed in {elapsed:.2f}s")

        return parsed

    except httpx.TimeoutException as e:
        elapsed = time.monotonic() - start
        logger.error(f"Gemini probe timeout after {elapsed:.2f}s: {e}")
        raise

    except Exception as e:
        elapsed = time.monotonic() - start
        logger.error(f"Gemini probe failed after {elapsed:.2f}s: {e}")
        raise


# ─────────────────────────────────────────────
# INTERNAL GEMINI CALL
# ─────────────────────────────────────────────

async def _call_gemini(
    system_prompt: str,
    user_prompt: str,
    image_base64: str,
    media_type: str,
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    start = time.monotonic()
    logger.info("Gemini vision call started")

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        # Build payload with system instructions segregated & JSON response mode enabled
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": user_prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": media_type or "image/jpeg",
                                "data": image_base64,
                            }
                        },
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {
                        "text": system_prompt
                    }
                ]
            },
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            },
        }

        response = await _client.post(
            url,
            headers={
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=40.0,
        )

        logger.info(f"Gemini raw status: {response.status_code}")
        logger.info(f"Gemini raw response preview: {response.text[:1000]}")

        response.raise_for_status()

        data = response.json()

        raw = (
            data["candidates"][0]["content"]["parts"][0]["text"]
            .strip()
        )

        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(raw)

        elapsed = time.monotonic() - start
        logger.info(f"Gemini vision call completed in {elapsed:.2f}s")

        return parsed

    except httpx.TimeoutException as e:
        elapsed = time.monotonic() - start
        logger.error(f"Gemini vision timeout after {elapsed:.2f}s: {e}")
        raise

    except Exception as e:
        elapsed = time.monotonic() - start
        logger.error(f"Gemini vision failed after {elapsed:.2f}s: {e}")
        raise


# ─────────────────────────────────────────────
# STAGE 1 — PROBING
# ─────────────────────────────────────────────

async def probe(
    text: str,
    language: str = "en",
    image: str = None,
    media_type: str = "image/jpeg"
) -> Dict[str, Any]:

    system_prompt = """
You are AIDA, an AI emergency first aid assistant designed to collect critical clinical data from highly distressed, panicked users.

Your task is to ask intelligent, highly context-relevant follow-up questions to understand the emergency before final diagnosis.

CRITICAL QUANTITY REQUIREMENT:
- You MUST generate EITHER 3 OR 4 questions. Never generate 1, 2, or more than 4.

SITUATIONAL & CLINICAL ACCURACY RULES:
- The questions MUST match the specific, physical context of the incident:
  * For Choking: Assess airway obstruction type, cough strength, consciousness. (Do NOT ask about bleeding/burns).
  * For Snake Bites: Assess bite location, physical symptoms (tingling, pain), snake description. (Do NOT ask about choking).
  * For Drowning: Assess where it happened (beach, pool), breathing state (coughing, gasping, none), consciousness.
  * For Cuts/Wounds: Assess cut location, bleeding rate, awake state, and timeline.
  * For Falls/Trauma: Assess head injury, movement capability, bleeding, timeline.
- Each question must explore a distinct clinical vector (e.g., Location, Severity/Symptom details, Consciousness, or Timeline).

DISTRESS-OPTIMIZED TRIAGE GUIDELINES (LOW COGNITIVE LOAD):
- "label": MUST be ultra-short (strictly 1 to 3 words maximum). Never leave a single hanging, incomplete word like "Just" or "Slow".
- "description": MUST be a single, simplified, non-technical sentence (under 8 words maximum) highlighting the key sign.
- Limit options to exactly 3 or 4 per question. Keep descriptions clean, friendly, and easy for panicked non-medical users to read.

CRITICAL TIMEFRAME/TIMELINE RULES:
- When asking questions about "How long" or "When did this happen?", your labels and descriptions must be highly logical and clinically sound:
  * BAD: "Just" (Description: "Just started") -> (Truncated/incomplete label)
  * BAD: "Hours" (Description: "More than 30 minutes") -> (Inaccurate timeline translation)
  * GOOD: 
    - Option 1: Label: "Just Now", Description: "Happened in the last few minutes"
    - Option 2: Label: "Minutes Ago", Description: "Between 10 to 30 minutes ago"
    - Option 3: Label: "Hours Ago", Description: "More than 1 hour ago"

DO NOT ask multiple questions in one sentence.
Return ONLY valid JSON matching this exact, clean structure.

FORMAT EXAMPLE (e.g., for Drowning):

{
  "stage": "probing",
  "summary": "Drowning emergency",
  "questions": [
    {
      "id": "q1",
      "question": "Where did it happen?",
      "type": "single_choice",
      "options": [
        {
          "label": "Pool",
          "description": "Swimming pool"
        },
        {
          "label": "Beach",
          "description": "Ocean or sea"
        },
        {
          "label": "Bathtub",
          "description": "Home bathtub"
        }
      ]
    },
    {
      "id": "q2",
      "question": "Is the person breathing?",
      "type": "single_choice",
      "options": [
        {
          "label": "Yes",
          "description": "Breathing normally"
        },
        {
          "label": "No",
          "description": "Not breathing"
        },
        {
          "label": "Gasping",
          "description": "Having trouble breathing"
        }
      ]
    },
    {
      "id": "q3",
      "question": "Is the person awake?",
      "type": "single_choice",
      "options": [
        {
          "label": "Yes",
          "description": "Fully awake"
        },
        {
          "label": "Dizzy",
          "description": "Feeling dizzy or faint"
        },
        {
          "label": "Unconscious",
          "description": "Not awake"
        }
      ]
    }
  ]
}

QUESTION TYPES:
- single_choice

RULES:
- Keep medical terminology to a 0% level. Use simple layperson terms only.
- Ensure options are highly distinct to make scanning effortless under stress.
- If language is Twi, everything (summary, questions, labels, descriptions) must be fully translated into natural, conversational Twi.
- Return raw JSON only.
"""

    user_prompt = f"""
Emergency description:
{text}

Language:
{language}
"""

    if image:
        result = await _call_gemini(system_prompt, user_prompt, image, media_type)
    else:
        result = await _call_groq(system_prompt, user_prompt)

    # NORMALIZE SCHEMA FOR THE FRONTEND:
    # Safely guarantees that both "text" (expected by Expo frontend) 
    # and "question" (returned by AI schema) coexist.
    if result and "questions" in result and isinstance(result["questions"], list):
        for q in result["questions"]:
            if "text" not in q and "question" in q:
                q["text"] = q["question"]
            if "question" not in q and "text" in q:
                q["question"] = q["text"]
            
            # Map Twi translation support to textTwi so the frontend exhibits the right translation
            if language == "twi":
                q["textTwi"] = q["text"]

    return result


# ─────────────────────────────────────────────
# STAGE 2 — FINAL DIAGNOSIS
# ─────────────────────────────────────────────

async def diagnose(
    text: str,
    answers: Dict[str, str],
    language: str = "en",
    image: str = None,
    media_type: str = "image/jpeg"
) -> Dict[str, Any]:
    system_prompt = """
You are an expert emergency first aid assistant.

You now have:
1. The original emergency description
2. Additional answers from probing questions

Use BOTH to make a proper assessment.

Return ONLY valid JSON.

Format:

{
  "condition": "",
  "severity": "critical | moderate | mild",
  "steps": [],
  "warnings": [],
  "call_immediately": true
}

Rules:
- Base response on actual evidence
- Do not over-diagnose
- Steps must be concise
- Warnings should explain dangerous mistakes
- Translate values if language is Twi
- Return raw JSON only
"""

    user_prompt = f"""
Original emergency:
{text}

User answers:
{json.dumps(answers)}

Language:
{language}
"""

    if image:
        result = await _call_gemini(system_prompt, user_prompt, image, media_type)
    else:
        result = await _call_groq(system_prompt, user_prompt)

    return result


# ─────────────────────────────────────────────
# OLD DIRECT ANALYSIS
# ─────────────────────────────────────────────

async def analyze(description: str, language: str) -> Dict[str, Any]:
    system_prompt = """
You are an expert emergency first aid assistant.

Analyze the described situation and respond ONLY with valid JSON.

Format:
{
  "condition": "",
  "severity": "critical | moderate | mild",
  "steps": [],
  "warnings": [],
  "call_immediately": true
}
"""

    user_prompt = f"""
Situation description:
{description}

Language:
{language}
"""

    result = await _call_groq(system_prompt, user_prompt)

    return result


# ─────────────────────────────────────────────
# STAGE 2 — FINAL DIAGNOSIS
# ─────────────────────────────────────────────

async def diagnose(
    text: str,
    answers: Dict[str, str],
    language: str = "en",
    image: str = None,
    media_type: str = "image/jpeg"
) -> Dict[str, Any]:
    system_prompt = """
You are an expert emergency first aid assistant.

You now have:
1. The original emergency description
2. Additional answers from probing questions

Use BOTH to make a proper assessment.

Return ONLY valid JSON.

Format:

{
  "condition": "",
  "severity": "critical | moderate | mild",
  "steps": [],
  "warnings": [],
  "call_immediately": true
}

Rules:
- Base response on actual evidence
- Do not over-diagnose
- Steps must be concise
- Warnings should explain dangerous mistakes
- Translate values if language is Twi
- Return raw JSON only
"""

    user_prompt = f"""
Original emergency:
{text}

User answers:
{json.dumps(answers)}

Language:
{language}
"""

    if image:
        result = await _call_gemini(system_prompt, user_prompt, image, media_type)
    else:
        result = await _call_groq(system_prompt, user_prompt)

    return result


# ─────────────────────────────────────────────
# STAGE 3 — FOLLOW-UP QUESTIONS & CHAT
# ─────────────────────────────────────────────

async def follow_up(
    text: str,
    answers: List[Dict[str, str]],
    previous_diagnosis: Dict[str, Any],
    follow_up_message: str,
    language: str = "en",
    image: str = None,
    media_type: str = "image/jpeg"
) -> Dict[str, Any]:
    """
    Handles user follow-up requests after an initial diagnosis has been provided.
    Users can ask questions like "He started vomiting, what should I do?" or "Can I give them water?".
    Returns updated diagnosis steps, warning updates, and a direct message response.
    """
    system_prompt = """
You are AIDA, an expert emergency first aid assistant.
The user has received an initial diagnosis and is now providing feedback or asking a question.

CRITICAL INSTRUCTIONS FOR UPDATING ADVICE:
1. PRESERVE BY DEFAULT: You MUST maintain the 'previous_diagnosis' steps and warnings as the foundation of your advice. 
2. ONLY MODIFY IF NECESSARY: Only change, add, or remove steps if the user's new message reveals a significant change in condition, new symptoms, or a correction of previous information.
3. IF MESSAGE IS IRRELEVANT: If the user's message is just a greeting, a clarification that doesn't change the medical situation, or an irrelevant comment, return the 'previous_diagnosis' steps and warnings EXACTLY as they are.
4. LANGUAGE: If the language is Twi, you must translate the answer "message", "updated_steps", and "updated_warnings" entirely into natural, conversational Twi.

Return ONLY valid JSON matching this structure:
{
  "message": "Empathetic, concise response to the user.",
  "updated_steps": ["Keep existing steps unless change is vital", "..."],
  "updated_warnings": ["Keep existing warnings unless change is vital", "..."],
  "call_immediately": [boolean - only change to true if the new info makes it a higher emergency]
}
"""

    user_prompt = f"""
Original incident description:
{text}

User probing answers:
{json.dumps(answers)}

Previous Diagnosis:
{json.dumps(previous_diagnosis)}

User's follow-up statement or question:
{follow_up_message}

Language:
{language}
"""

    if image:
        result = await _call_gemini(system_prompt, user_prompt, image, media_type)
    else:
        result = await _call_groq(system_prompt, user_prompt)

    return result


# ─────────────────────────────────────────────
# OLD DIRECT ANALYSIS
# ─────────────────────────────────────────────

async def analyze(description: str, language: str) -> Dict[str, Any]:
    system_prompt = """
You are an expert emergency first aid assistant.

Analyze the described situation and respond ONLY with valid JSON.

Format:
{
  "condition": "",
  "severity": "critical | moderate | mild",
  "steps": [],
  "warnings": [],
  "call_immediately": true
}
"""

    user_prompt = f"""
Situation description:
{description}

Language:
{language}
"""

    result = await _call_groq(system_prompt, user_prompt)

    return result