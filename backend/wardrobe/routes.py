from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from database import get_db
from auth import get_current_user_id
from wardrobe.models import WardrobeItem
from wardrobe.schemas import WardrobeItemResponse

router = APIRouter(prefix="/api/wardrobe", tags=["Wardrobe"])

# --- Uploads directory ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

VALID_CATEGORIES = ["Tops", "Bottoms", "Dresses", "Footwear", "Accessories"]


@router.post("", response_model=WardrobeItemResponse)
def upload_wardrobe_item(
    category: str = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Upload a clothing image to the wardrobe."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, unique_name)

    # Save file to disk
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save to DB
    item = WardrobeItem(user_id=user_id, category=category, filename=unique_name)
    db.add(item)
    db.commit()
    db.refresh(item)

    return WardrobeItemResponse(id=item.id, category=item.category, image_url=f"/uploads/{item.filename}")


@router.get("", response_model=List[WardrobeItemResponse])
def get_wardrobe_items(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all wardrobe items for the current user."""
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()
    return [
        WardrobeItemResponse(id=item.id, category=item.category, image_url=f"/uploads/{item.filename}")
        for item in items
    ]


@router.delete("/{item_id}")
def delete_wardrobe_item(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a wardrobe item."""
    item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Delete file from disk
    filepath = os.path.join(UPLOADS_DIR, item.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(item)
    db.commit()
    return {"detail": "Item deleted"}
