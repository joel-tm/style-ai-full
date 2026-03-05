from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ImageAnalysisData(BaseModel):
    type: Optional[str] = None
    neckline: Optional[str] = None
    sleevelength: Optional[str] = None
    primaryColor: Optional[str] = None
    secondaryColors: Optional[str] = None
    fit: Optional[str] = None
    length: Optional[str] = None
    fabricType: Optional[str] = None
    texture: Optional[str] = None


class WardrobeItemResponse(BaseModel):
    id: int
    category: str
    image_url: str
    bg_removed_image_url: Optional[str] = None
    image_analysis: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class BatchProcessRequest(BaseModel):
    item_ids: List[int]
