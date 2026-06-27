import os
import json
import base64
import logging
import httpx
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user

load_dotenv()

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logger = logging.getLogger("farmshare.upload")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))

AWS_REGION  = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
MODEL_ID    = os.getenv("LLM_MODEL_NAME", "amazon.nova-pro-v1:0")
_BEARER_RAW = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "")

# Log configuration state at startup so it's visible in server logs
logger.info("=== Upload Router Init ===")
logger.info("AWS_DEFAULT_REGION   : %s", AWS_REGION)
logger.info("LLM_MODEL_NAME       : %s", MODEL_ID)
logger.info("BEDROCK TOKEN present: %s", bool(_BEARER_RAW))

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
    '{"verdict": "relevant"} or {"verdict": "irrelevant", "reason": "<one line explanation>"}'
)


async def _validate_image_with_bedrock(image_bytes: bytes, content_type: str) -> None:
    """
    Sends the image to AWS Bedrock Nova Pro for content moderation.
    Raises HTTP 422 if the image is not food/produce related.
    """
    logger.info("--- AI Moderation Check ---")
    logger.info("Image size   : %d bytes", len(image_bytes))
    logger.info("Content-Type : %s", content_type)

    if not _BEARER_RAW:
        logger.warning(
            "SKIPPING AI moderation: AWS_BEARER_TOKEN_BEDROCK is not set in environment. "
            "All images will be allowed through. Set this token to enable moderation."
        )
        return

    # Convert to base64 for Bedrock multimodal input
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    logger.info("Image base64 length: %d chars", len(b64_image))

    # Map MIME type to Bedrock format string
    fmt_map = {
        "image/jpeg": "jpeg",
        "image/png":  "png",
        "image/webp": "webp",
        "image/gif":  "gif",
    }
    # Detect real format from magic bytes — browser Content-Type is unreliable
    # and Bedrock 400s if the declared format doesn't match actual bytes.
    header = image_bytes[:12]
    if header[:3] == b'\xff\xd8\xff':
        img_format = "jpeg"
    elif header[:8] == b'\x89PNG\r\n\x1a\n':
        img_format = "png"
    elif header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        img_format = "webp"
    elif header[:6] in (b'GIF87a', b'GIF89a'):
        img_format = "gif"
    else:
        # Fallback: use fmt_map from claimed content_type
        img_format = fmt_map.get(content_type, "jpeg")

    logger.info("Claimed content_type=%s | Detected img_format=%s", content_type, img_format)

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
    logger.info("Calling Bedrock endpoint: %s", endpoint)

    headers = {
        "Authorization": f"Bearer {_BEARER_RAW}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(endpoint, content=json.dumps(body).encode(), headers=headers)
        logger.info("Bedrock HTTP status: %d", resp.status_code)
    except Exception as exc:
        logger.error("Bedrock request FAILED (network/timeout): %s", str(exc))
        logger.warning("Failing OPEN — image allowed through due to Bedrock connectivity issue.")
        return

    if resp.status_code != 200:
        logger.error("Bedrock returned error %d: %s", resp.status_code, resp.text[:400])
        logger.warning("Failing OPEN — image allowed through due to Bedrock error response.")
        return

    try:
        raw_text = resp.json()["output"]["message"]["content"][0]["text"]
        logger.info("Bedrock raw response: %s", raw_text)
        # Strip potential markdown code fences
        clean = raw_text.strip().strip("```json").strip("```").strip()
        verdict_data = json.loads(clean)
        logger.info("Parsed verdict: %s", verdict_data)
    except Exception as exc:
        logger.error("Failed to parse Bedrock verdict JSON: %s | raw=%s", str(exc), raw_text if 'raw_text' in dir() else 'N/A')
        logger.warning("Failing OPEN — image allowed through due to parse error.")
        return

    verdict = verdict_data.get("verdict")
    if verdict == "irrelevant":
        reason = verdict_data.get("reason", "Image does not appear to contain food or produce.")
        logger.warning("AI REJECTED image: %s", reason)
        raise HTTPException(
            status_code=422,
            detail=f"Image rejected by AI moderation: {reason} "
                   f"Please upload a clear photo of the surplus produce you are listing."
        )

    logger.info("AI APPROVED image (verdict=%s)", verdict)


class UploadResponse(BaseModel):
    url: str
    public_id: str


@router.post("/image", response_model=UploadResponse, status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    logger.info("Upload request from user_id=%s filename=%s type=%s",
                current_user.get("id"), file.filename, file.content_type)

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        logger.warning("Rejected unsupported type: %s", file.content_type)
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Allowed: {', '.join(allowed_types)}"
        )

    # Read image bytes into memory once (needed for both AI check and Cloudinary upload)
    image_bytes = await file.read()
    if not image_bytes:
        logger.warning("Rejected empty file upload")
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    logger.info("Read %d bytes from upload", len(image_bytes))

    # ── AI Moderation Layer ──────────────────────────────────────────────────
    # Validate image content with Bedrock before accepting the upload.
    # Raises HTTP 422 if the image is irrelevant to food/produce.
    await _validate_image_with_bedrock(image_bytes, file.content_type)
    # ────────────────────────────────────────────────────────────────────────

    logger.info("Uploading approved image to Cloudinary...")
    try:
        result = cloudinary.uploader.upload(
            image_bytes,
            folder="farmshare/produce",
            resource_type="image",
        )
        logger.info("Cloudinary upload success: public_id=%s url=%s",
                    result.get("public_id"), result.get("secure_url"))
    except Exception as e:
        logger.error("Cloudinary upload failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    return UploadResponse(url=result["secure_url"], public_id=result["public_id"])
