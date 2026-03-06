from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, DATE, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    forecast_date = Column(DATE, nullable=False, index=True)
    temperature_avg = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    weather_condition = Column(String, nullable=False)
    raw_response_json = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    location = relationship("Location")
