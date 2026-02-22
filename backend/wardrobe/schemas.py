from pydantic import BaseModel
from typing import Optional, List


class WardrobeItemResponse(BaseModel):
    id: int
    category: str
    image_url: str
    bg_removed_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class BatchProcessRequest(BaseModel):
    item_ids: List[int]
