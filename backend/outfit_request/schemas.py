from datetime import date
from typing import Optional

from pydantic import BaseModel

from generated_outfit.schemas import GeneratedOutfitResponse
from outfit.schemas import LocationSchema, WeatherDataSchema


class OutfitGenerateRequest(BaseModel):
    occasion: str
    country: str
    state: str
    target_date: Optional[date] = None


class OutfitRequestResponse(BaseModel):
    id: int
    occasion: str
    target_date: date
    status: str
    location: LocationSchema
    weather: WeatherDataSchema
    generated_outfit: Optional[GeneratedOutfitResponse] = None

    class Config:
        from_attributes = True
