import os
import json
import time
import logging
from typing import Dict, Any
import httpx

logger = logging.getLogger("aida.gemini")

_client = httpx.AsyncClient(timeout=20.0, limits=httpx.Limits(max_keepalive_connections=10, max_connections=20))


def configure(api_key: str):
    """Configure the service with API key"""
    os.environ["GROQ_API_KEY"] = api_key


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
# STAGE 1 — PROBING
# ─────────────────────────────────────────────

async def probe(
    text: str,
    language: str = "en",
    image: str = None,
    media_type: str = "image/jpeg"
) -> Dict[str, Any]:

    system_prompt = """
You are AIDA, an AI emergency first aid assistant.

DO NOT immediately diagnose the emergency.

Your first task is to ask 3-5 INCIDENT-SPECIFIC probing questions
to gather critical information BEFORE diagnosis.

CRITICAL RULE: Ask only RELEVANT questions specific to the incident type.
- For vomiting: ask about blood presence, consciousness, frequency
- For injuries: ask about bleeding severity, consciousness, pain
- For breathing issues: ask about breathing patterns, consciousness, timing
- For poisoning: ask about substance, consciousness, symptoms
- For chest pain: ask about severity, breathing, consciousness, radiation
- For allergic reactions: ask about severity, breathing, consciousness

Return ONLY valid JSON.

Format:

{
  "stage": "probing",
  "summary": "short understanding of situation",
  "questions": [
    "question 1",
    "question 2",
    "question 3"
  ]
}

Rules:
- Ask ONLY the most relevant questions for this specific incident
- Do not always ask "Is the person conscious?" first unless the incident suggests it
- Questions must be ANSWERABLE based on the incident type
- Questions should help determine severity
- Questions should be SHORT, CLEAR, and SIMPLE
- Avoid asking irrelevant questions (e.g., don't ask "Is it arterial spurting?" for a vomit incident)
- If language is twi, ask in Twi language
- Return raw JSON only, no markdown
"""

    user_prompt = f"""
Emergency description:
{text}

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