from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
import io
from PIL import Image
import rembg

from database import get_db
from auth import get_current_user_id
from wardrobe.models import WardrobeItem
from wardrobe.schemas import WardrobeItemResponse, BatchProcessRequest

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
        WardrobeItemResponse(
            id=item.id,
            category=item.category,
            image_url=f"/uploads/{item.filename}",
            bg_removed_image_url=f"/uploads/{item.bg_removed_filename}" if item.bg_removed_filename else None
        )
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
        
    if item.bg_removed_filename:
        bg_filepath = os.path.join(UPLOADS_DIR, item.bg_removed_filename)
        if os.path.exists(bg_filepath):
            os.remove(bg_filepath)

    db.delete(item)
    db.commit()
    return {"detail": "Item deleted"}


@router.post("/remove-background", response_model=List[WardrobeItemResponse])
def remove_background_batch(
    request: BatchProcessRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Batch process wardrobe items to remove their backgrounds."""
    items = db.query(WardrobeItem).filter(
        WardrobeItem.id.in_(request.item_ids),
        WardrobeItem.user_id == user_id
    ).all()

    if not items:
        raise HTTPException(status_code=404, detail="No items found to process")

    processed_items = []
    for item in items:
        if not item.bg_removed_filename:
            # Load original image
            original_filepath = os.path.join(UPLOADS_DIR, item.filename)
            if os.path.exists(original_filepath):
                with open(original_filepath, "rb") as f:
                    input_data = f.read()
                
                # Remove background
                output_data = rembg.remove(input_data)
                
                # Save processed image
                removed_bg_dir = os.path.join(UPLOADS_DIR, "removed_bg")
                os.makedirs(removed_bg_dir, exist_ok=True)
                
                unique_name = f"removed_bg/processed_{uuid.uuid4().hex}.png"
                processed_filepath = os.path.join(UPLOADS_DIR, unique_name)
                
                with open(processed_filepath, "wb") as f:
                    f.write(output_data)
                    
                item.bg_removed_filename = unique_name
        
        processed_items.append(item)
        
    db.commit()

    return [
        WardrobeItemResponse(
            id=item.id,
            category=item.category,
            image_url=f"/uploads/{item.filename}",
            bg_removed_image_url=f"/uploads/{item.bg_removed_filename}" if item.bg_removed_filename else None
        )
        for item in processed_items
    ]
