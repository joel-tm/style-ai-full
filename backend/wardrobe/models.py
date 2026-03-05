from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from datetime import datetime, timezone
from database import Base


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    filename = Column(String, nullable=False)
    bg_removed_filename = Column(String, nullable=True)
    image_analysis = Column(JSON, nullable=True)  # Stores: type, subtype, primaryColor, secondaryColors, fit, length, fabricType, texture
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
