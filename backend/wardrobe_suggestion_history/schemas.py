from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from outfit.schemas import LocationSchema, WardrobeItemBrief, WeatherDataSchema


class WardrobeSuggestionHistoryResponse(BaseModel):
    id: int
    occasion: str
    target_date: date
    location: LocationSchema
    weather: Optional[WeatherDataSchema] = None
    suggestion: str
    prompt_used: str
    selected_items: List[WardrobeItemBrief] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True
