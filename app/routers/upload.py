import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user

load_dotenv()

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))

router = APIRouter(prefix="/upload", tags=["Upload"])


class UploadResponse(BaseModel):
    url: str
    public_id: str


@router.post("/image", response_model=UploadResponse, status_code=201)
def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Allowed: {', '.join(allowed_types)}"
        )

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder="farmshare/produce",
            resource_type="image",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    return UploadResponse(url=result["secure_url"], public_id=result["public_id"])
