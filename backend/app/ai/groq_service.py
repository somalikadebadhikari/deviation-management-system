"""
Groq LLM service.
Wraps two prompts:
  1. Field extraction from raw deviation text.
  2. Risk assessment (impact / severity / reasoning) from extracted fields.
Both prompts instruct the model to return JSON only, which we then parse.
"""
import json

from fastapi import HTTPException
from groq import Groq

from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

MODEL = "openai/gpt-oss-120b"


def _call_groq_json(system_prompt: str, user_content: str) -> dict:
    """Call Groq chat completion and parse the response as JSON."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw_content = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq API call failed: {e}")

    try:
        return json.loads(raw_content)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Groq returned an invalid (non-JSON) response.",
        )


def extract_fields(text: str) -> dict:
    """Prompt 1: extract structured deviation fields from raw text."""
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Input text is empty.")

    system_prompt = """You are an assistant that extracts structured information
from pharmaceutical/manufacturing deviation reports.

Extract the following fields from the deviation report:
- Site / Plant
- Date of Occurrence
- Title
- Source
- Related Product
- Batch Number
- Detailed Description

Return valid JSON only, with exactly these keys:
site_plant, date_of_occurrence, title, source, related_product, batch_number, detailed_description

If a field is not found in the text, return an empty string for it.
Do not include any text outside the JSON object."""

    result = _call_groq_json(system_prompt, text)

    expected_keys = [
        "site_plant",
        "date_of_occurrence",
        "title",
        "source",
        "related_product",
        "batch_number",
        "detailed_description",
    ]
    if not any(result.get(k) for k in expected_keys):
        raise HTTPException(
            status_code=422,
            detail="Extraction produced no usable fields from the given text.",
        )

    return {k: result.get(k, "") for k in expected_keys}


def assess_risk(extracted_data: dict) -> dict:
    """Prompt 2: assess initial impact and severity from extracted fields."""
    system_prompt = """You are an assistant that assesses risk for manufacturing
deviation reports.

Based on the deviation details provided, determine:
- Initial Impact
- Initial Severity
- Reasoning

Severity must be exactly one of: LOW, MEDIUM, HIGH

Return valid JSON only, with exactly these keys:
initial_impact, initial_severity, reasoning

Do not include any text outside the JSON object."""

    user_content = json.dumps(extracted_data)
    result = _call_groq_json(system_prompt, user_content)

    severity = str(result.get("initial_severity", "")).strip().upper()
    if severity not in ("LOW", "MEDIUM", "HIGH"):
        raise HTTPException(
            status_code=502,
            detail=f"Groq returned an invalid severity value: '{severity}'",
        )

    return {
        "initial_impact": result.get("initial_impact", ""),
        "initial_severity": severity,
        "reasoning": result.get("reasoning", ""),
    }
