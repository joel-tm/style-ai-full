from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class OutfitGenerateRequest(BaseModel):
    occasion: str
    country: str
    state: str
    target_date: Optional[date] = None # Will default to today if missing


class LocationSchema(BaseModel):
    country: str
    state: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True


class WeatherDataSchema(BaseModel):
    forecast_date: date
    temperature_avg: float
    temperature_min: float
    temperature_max: float
    humidity: float
    weather_condition: str
    using_defaults: bool = False
    warning: Optional[str] = None

    class Config:
        from_attributes = True


class GeneratedOutfitResponse(BaseModel):
    id: int
    top_description: str
    bottom_description: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


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
