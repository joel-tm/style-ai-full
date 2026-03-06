from typing import List, Optional

from pydantic import BaseModel, Field

from weather_data.schemas import WeatherDataSchema


class WardrobeItemBrief(BaseModel):
    id: int
    category: str
    image_url: str
    bg_removed_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class WardrobeSuggestionResponse(BaseModel):
    occasion: str
    country: str
    state: str
    weather: Optional[WeatherDataSchema] = None
    suggestion: str
    prompt_used: str
    selected_items: List[WardrobeItemBrief] = Field(default_factory=list)

    class Config:
        from_attributes = True
