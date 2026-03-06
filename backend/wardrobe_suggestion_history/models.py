from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, DATE, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from database import Base


class WardrobeSuggestionHistory(Base):
    __tablename__ = "wardrobe_suggestion_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    weather_id = Column(Integer, ForeignKey("weather_data.id"), nullable=True)
    occasion = Column(String, nullable=False)
    target_date = Column(DATE, nullable=False)
    suggestion_text = Column(Text, nullable=False)
    prompt_used = Column(Text, nullable=False)
    selected_items_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    location = relationship("Location")
    weather = relationship("WeatherData")
