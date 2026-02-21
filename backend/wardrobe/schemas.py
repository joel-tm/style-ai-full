from pydantic import BaseModel


class WardrobeItemResponse(BaseModel):
    id: int
    category: str
    image_url: str

    class Config:
        from_attributes = True
