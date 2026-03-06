from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class GeneratedOutfit(Base):
    __tablename__ = "generated_outfits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("outfit_requests.id"), nullable=False, index=True)
    top_description = Column(String, nullable=False)
    bottom_description = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    llm_model_used = Column(String, nullable=False)
    prompt_used = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    request = relationship("OutfitRequest", back_populates="generated_outfit")
