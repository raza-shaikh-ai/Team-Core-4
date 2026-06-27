import os
import json
import base64
import httpx
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user

load_dotenv()

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))

AWS_REGION  = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
MODEL_ID    = os.getenv("LLM_MODEL_NAME", "amazon.nova-pro-v1:0")
_BEARER_RAW = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "")

router = APIRouter(prefix="/upload", tags=["Upload"])

# ---------------------------------------------------------------------------
# AI Image Moderation — checks if the image is food/produce before uploading
# ---------------------------------------------------------------------------
IMAGE_MODERATION_PROMPT = (
    "You are an image moderation AI for FarmShare, an agricultural food-sharing platform. "
    "Your task is to decide if an image is relevant for listing surplus food/produce on the platform.\n\n"
    "RELEVANT examples: fruits, vegetables, grains, dairy products, packaged food, crops, farm produce, harvest.\n"
    "IRRELEVANT examples: people only, vehicles, buildings, documents, selfies, memes, animals without food, landscapes.\n\n"
    "Reply with ONLY a single JSON object with no extra text:\n"
    '{\"verdict\": \"relevant\"} or {\"verdict\": \"irrelevant\", \"reason\": \"<one line explanation>\"}'
)


async def _validate_image_with_bedrock(image_bytes: bytes, content_type: str) -> None:
    """
    Sends the image to AWS Bedrock Nova Pro for content moderation.
    Raises HTTP 422 if the image is not food/produce related.
    """
    if not _BEARER_RAW:
        # If Bedrock is not configured, skip validation (dev mode)
        return

    # Convert to base64 for Bedrock multimodal input
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Map MIME type to Bedrock format string
    fmt_map = {
        "image/jpeg": "jpeg",
        "image/png":  "png",
        "image/webp": "webp",
        "image/gif":  "gif",
    }
    img_format = fmt_map.get(content_type, "jpeg")

    body = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "image": {
                            "format": img_format,
                            "source": {"bytes": b64_image},
                        }
                    },
                    {"text": IMAGE_MODERATION_PROMPT},
                ],
            }
        ],
        "inferenceConfig": {
            "maxTokens": 128,
            "temperature": 0.0,
        },
    }

    endpoint = f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com/model/{MODEL_ID}/converse"
    headers  = {
        "Authorization": f"Bearer {_BEARER_RAW}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(endpoint, content=json.dumps(body).encode(), headers=headers)
    except Exception as exc:
        # If Bedrock is unreachable, fail open (allow upload) to avoid blocking farmers
        return

    if resp.status_code != 200:
        # Bedrock error — fail open to avoid blocking farmers
        return

    try:
        raw_text = resp.json()["output"]["message"]["content"][0]["text"]
        # Strip potential markdown code fences
        clean = raw_text.strip().strip("```json").strip("```").strip()
        verdict_data = json.loads(clean)
    except Exception:
        # Can't parse — fail open
        return

    if verdict_data.get("verdict") == "irrelevant":
        reason = verdict_data.get("reason", "Image does not appear to contain food or produce.")
        raise HTTPException(
            status_code=422,
            detail=f"Image rejected by AI moderation: {reason} "
                   f"Please upload a clear photo of the surplus produce you are listing."
        )


class UploadResponse(BaseModel):
    url: str
    public_id: str


@router.post("/image", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Allowed: {', '.join(allowed_types)}"
        )

    # Read image bytes into memory once (needed for both AI check and Cloudinary upload)
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── AI Moderation Layer ──────────────────────────────────────────────────
    # Validate image content with Bedrock before accepting the upload.
    # Raises HTTP 422 if the image is irrelevant to food/produce.
    await _validate_image_with_bedrock(image_bytes, file.content_type)
    # ────────────────────────────────────────────────────────────────────────

    try:
        result = cloudinary.uploader.upload(
            image_bytes,
            folder="farmshare/produce",
            resource_type="image",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    return UploadResponse(url=result["secure_url"], public_id=result["public_id"])

