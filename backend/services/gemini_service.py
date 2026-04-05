import os
import json
from typing import Dict, Any
import httpx

def configure(api_key: str):
    """Configure the service with API key"""
    os.environ["GROQ_API_KEY"] = api_key


async def analyze(description: str, language: str) -> Dict[str, Any]:
    """
    Analyze a first aid situation using Groq's LLM.
    Returns structured, AI-reasoned guidance based on the actual description.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Call configure() first.")

    system_prompt = """You are an expert emergency first aid assistant. 
Analyze the described situation and respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

The JSON must follow this exact structure:
{
  "condition": "<concise name of the identified medical condition>",
  "severity": "<one of: critical | moderate | mild>",
  "steps": ["<step 1>", "<step 2>", ...],
  "warnings": ["<warning 1>", ...],
  "call_immediately": <true | false>
}

Rules:
- Base everything on the actual description. Do not guess or generalize.
- Steps must be ordered, actionable, and concise — written for a bystander under stress.
- Warnings must highlight what NOT to do that could worsen the situation.
- Set call_immediately to true for anything life-threatening or unclear.
- If the language specified is not English, translate all values (not keys) into that language.
- Never include preamble, commentary, or markdown fences. Return raw JSON only."""

    user_prompt = f"""Situation description: {description}
Language for response: {language}"""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "temperature": 0.2,          # Low temp = consistent, factual output
                    "max_tokens": 600,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()

        raw = data["choices"][0]["message"]["content"].strip()

        # Strip accidental markdown fences if the model added them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)
        _validate_response(result)
        return result

    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"Groq API error {e.response.status_code}: {e.response.text}") from e
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse AI response as JSON: {raw}") from e


def _validate_response(data: Dict[str, Any]) -> None:
    """Ensure the AI response contains all required fields with correct types."""
    required = {
        "condition": str,
        "severity": str,
        "steps": list,
        "warnings": list,
        "call_immediately": bool,
    }
    for field, expected_type in required.items():
        if field not in data:
            raise ValueError(f"AI response missing required field: '{field}'")
        if not isinstance(data[field], expected_type):
            raise ValueError(
                f"Field '{field}' has wrong type. "
                f"Expected {expected_type.__name__}, got {type(data[field]).__name__}"
            )
    if data["severity"] not in ("critical", "moderate", "mild"):
        raise ValueError(f"Invalid severity value: '{data['severity']}'")