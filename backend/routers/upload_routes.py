import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from pydantic import BaseModel
from typing import Optional

from backend.config import settings
from backend.database import db, persist_mock_db
from backend.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

class Base64PhotoUploadRequest(BaseModel):
    photo_data: str  # Data URL or URL

@router.post("/photo")
async def upload_profile_photo(
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided."
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content to check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB."
        )

    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/api/uploads/{filename}"

    # Update in users collection
    db.users.update_one({"id": user_id}, {"$set": {"photo_url": photo_url}})

    # If coach, also update in coaches collection
    if current_user.get("role") == "coach":
        db.coaches.update_one({"user_id": user_id}, {"$set": {"photo_url": photo_url, "image_url": photo_url}})

    persist_mock_db()

    return {
        "success": True,
        "photo_url": photo_url,
        "message": "Profile photo uploaded successfully."
    }

@router.post("/photo-base64")
def upload_photo_base64(
    req: Base64PhotoUploadRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    photo_url = req.photo_data.strip()

    if not photo_url:
        raise HTTPException(status_code=400, detail="Photo data cannot be empty.")

    # Update user record
    db.users.update_one({"id": user_id}, {"$set": {"photo_url": photo_url}})
    if current_user.get("role") == "coach":
        db.coaches.update_one({"user_id": user_id}, {"$set": {"photo_url": photo_url, "image_url": photo_url}})

    persist_mock_db()

    return {
        "success": True,
        "photo_url": photo_url,
        "message": "Profile photo updated successfully."
    }

@router.delete("/photo")
def remove_profile_photo(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    db.users.update_one({"id": user_id}, {"$set": {"photo_url": None}})
    if current_user.get("role") == "coach":
        db.coaches.update_one({"user_id": user_id}, {"$set": {"photo_url": None, "image_url": None}})

    persist_mock_db()

    return {
        "success": True,
        "message": "Profile photo removed successfully."
    }
