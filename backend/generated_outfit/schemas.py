from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class GeneratedOutfitResponse(BaseModel):
    id: int
    top_description: str
    bottom_description: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
