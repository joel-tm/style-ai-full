from datetime import date
from typing import Optional

from pydantic import BaseModel


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
