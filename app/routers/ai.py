import json
import os
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
import httpx

from app.dependencies import require_role

load_dotenv()

router = APIRouter(prefix="/ai", tags=["AI"])

AWS_REGION  = os.getenv("AWS_DEFAULT_REGION")
MODEL_ID    = os.getenv("LLM_MODEL_NAME")
_BEARER_RAW = os.getenv("AWS_BEARER_TOKEN_BEDROCK")

_missing = [k for k, v in {
    "AWS_DEFAULT_REGION":       AWS_REGION,
    "LLM_MODEL_NAME":           MODEL_ID,
    "AWS_BEARER_TOKEN_BEDROCK": _BEARER_RAW,
}.items() if not v]
if _missing:
    raise RuntimeError(
        f"AI router: missing required env vars: {', '.join(_missing)}. "
        "Add them to your .env file and restart the server."
    )

SYSTEM_PROMPT = """You are HarvestLink AI, a domain-specific assistant for the FarmShare platform.
FarmShare connects farmers who have surplus produce with NGOs and food banks to reduce food waste and fight hunger.

Your role is strictly limited to:
1. Explaining how the FarmShare / HarvestLink platform works.
2. Answering food storage and freshness questions (shelf life, ripeness, preservation).
3. Clarifying donation rules and guidelines (what can/cannot be donated, packaging, labelling).
4. Helping farmers choose the best donation option and timing.
5. Guiding NGOs on how to request, collect, and track produce.

Language & Extraction Rules:
- Support inputs in English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), and Kannada (ಕನ್ನಡ).
- You must understand when a user provides produce details in any of these languages.
- When extracting details for autofill, always translate the produce name to its English equivalent in the JSON block (e.g. "प्याज" / "कांदा" / "ఉల్లిపాయ" / "ಈರುಳ್ಳಿ" -> "Onion").
- Resolve relative harvest dates (e.g. "today" / "आज" / "इवत्तु") to an actual date in YYYY-MM-DD format using today's date: {TODAY}.
- You MUST detect the language of the user's input and reply in that exact same language (e.g., if the user asks in English, reply in English; if they ask in Hindi, reply in Hindi; if they ask in Marathi, reply in Marathi; if they ask in Telugu, reply in Telugu; if they ask in Kannada, reply in Kannada). Under no circumstances should you reply in Hindi if the user spoke to you in English. The autofilled JSON produce field must always be in English.

Rules:
- NEVER answer questions outside this domain. Politely redirect.
- Be concise, friendly, and practical.
- When a user provides produce details (voice or text), extract: produce name, quantity (in kg), and harvest date.
  Then respond with a JSON block AND a helpful message, in this exact format:
  ```json
  {"action":"autofill","produce":"<name>","quantity":<number>,"harvest_date":"<YYYY-MM-DD>"}
  ```
- If the harvest date is relative (e.g. "today", "yesterday"), resolve it to an actual date.
- Today's date is {TODAY}.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class VoiceListingRequest(BaseModel):
    text: str


async def _call_bedrock(messages: List[dict], system: str) -> str:
    endpoint_host = f"bedrock-runtime.{AWS_REGION}.amazonaws.com"
    path          = f"/model/{MODEL_ID}/converse"
    url           = f"https://{endpoint_host}{path}"

    body = {
        "system": [{"text": system}],
        "messages": messages,
        "inferenceConfig": {
            "maxTokens": 512,
            "temperature": 0.4,
        },
    }
    payload_bytes = json.dumps(body).encode("utf-8")
    
    headers = {
        "Authorization": f"Bearer {_BEARER_RAW}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, content=payload_bytes, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Bedrock error: {resp.text[:400]}",
        )

    data  = resp.json()
    try:
        return data["output"]["message"]["content"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Unexpected Bedrock response shape")


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: dict = Depends(require_role("Farmer", "NGO", "Food Bank")),
):
    today_str = datetime.date.today().isoformat()
    system    = SYSTEM_PROMPT.replace("{TODAY}", today_str)

    bedrock_messages = [
        {"role": m.role, "content": [{"text": m.content}]}
        for m in req.messages
    ]

    reply = await _call_bedrock(bedrock_messages, system)
    return {"reply": reply}


@router.post("/voice-listing")
async def voice_listing(
    req: VoiceListingRequest,
    current_user: dict = Depends(require_role("Farmer", "NGO", "Food Bank")),
):
    today_str = datetime.date.today().isoformat()
    system    = SYSTEM_PROMPT.replace("{TODAY}", today_str)

    prompt = (
        f"The farmer said: \"{req.text}\"\n\n"
        "Extract the produce name, quantity in kg, and harvest date. "
        "If harvest date is not mentioned, use today. "
        "Always respond with the JSON autofill block followed by a short friendly confirmation."
    )

    bedrock_messages = [
        {"role": "user", "content": [{"text": prompt}]}
    ]

    reply = await _call_bedrock(bedrock_messages, system)
    return {"reply": reply}
