from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, DATE, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class OutfitRequest(Base):
    __tablename__ = "outfit_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    weather_id = Column(Integer, ForeignKey("weather_data.id"), nullable=False)
    occasion = Column(String, nullable=False)
    target_date = Column(DATE, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    location = relationship("Location")
    weather = relationship("WeatherData")
    generated_outfit = relationship("GeneratedOutfit", uselist=False, back_populates="request")
