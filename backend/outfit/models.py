from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Float, DATE
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    country = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)


class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    forecast_date = Column(DATE, nullable=False, index=True)
    temperature_avg = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_max = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    weather_condition = Column(String, nullable=False) # e.g., Rain, Clear, Snow
    raw_response_json = Column(String, nullable=True) # Stored as JSON string
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    location = relationship("Location")


class OutfitRequest(Base):
    __tablename__ = "outfit_requests"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    weather_id = Column(Integer, ForeignKey("weather_data.id"), nullable=False)
    occasion = Column(String, nullable=False)
    target_date = Column(DATE, nullable=False)
    status = Column(String, default="pending") # pending, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    location = relationship("Location")
    weather = relationship("WeatherData")
    generated_outfit = relationship("GeneratedOutfit", uselist=False, back_populates="request")


class GeneratedOutfit(Base):
    __tablename__ = "generated_outfits"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("outfit_requests.id"), nullable=False, index=True)
    top_description = Column(String, nullable=False)
    bottom_description = Column(String, nullable=False)
    image_url = Column(String, nullable=True) # For the generated image
    llm_model_used = Column(String, nullable=False)
    prompt_used = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    request = relationship("OutfitRequest", back_populates="generated_outfit")
