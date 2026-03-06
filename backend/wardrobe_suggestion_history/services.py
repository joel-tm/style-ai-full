from datetime import date
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from location.schemas import LocationSchema
from outfit_suggestion.schemas import WardrobeItemBrief
from wardrobe_suggestion_history.models import WardrobeSuggestionHistory
from wardrobe_suggestion_history.schemas import WardrobeSuggestionHistoryResponse
from weather_data.schemas import WeatherDataSchema


def serialize_suggestion_history(history_item: WardrobeSuggestionHistory) -> WardrobeSuggestionHistoryResponse:
    return WardrobeSuggestionHistoryResponse(
        id=history_item.id,
        occasion=history_item.occasion,
        target_date=history_item.target_date,
        location=LocationSchema.model_validate(history_item.location),
        weather=WeatherDataSchema.model_validate(history_item.weather) if history_item.weather else None,
        suggestion=history_item.suggestion_text,
        prompt_used=history_item.prompt_used,
        selected_items=[WardrobeItemBrief.model_validate(item) for item in (history_item.selected_items_json or [])],
        created_at=history_item.created_at,
    )


def list_suggestion_history(db: Session, user_id: int) -> List[WardrobeSuggestionHistoryResponse]:
    history_items = db.query(WardrobeSuggestionHistory).filter(
        WardrobeSuggestionHistory.user_id == user_id
    ).order_by(WardrobeSuggestionHistory.created_at.desc()).all()
    return [serialize_suggestion_history(item) for item in history_items]


def get_suggestion_history_by_id(
    db: Session,
    *,
    user_id: int,
    suggestion_id: int,
) -> WardrobeSuggestionHistoryResponse:
    history_item = db.query(WardrobeSuggestionHistory).filter(
        WardrobeSuggestionHistory.id == suggestion_id,
        WardrobeSuggestionHistory.user_id == user_id,
    ).first()
    if not history_item:
        raise HTTPException(status_code=404, detail="Suggested outfit not found")
    return serialize_suggestion_history(history_item)


def create_suggestion_history_entry(
    db: Session,
    *,
    user_id: int,
    location_id: int,
    weather_id: Optional[int],
    occasion: str,
    target_date: date,
    suggestion_text: str,
    prompt_used: str,
    selected_items: List[WardrobeItemBrief],
) -> WardrobeSuggestionHistory:
    history_entry = WardrobeSuggestionHistory(
        user_id=user_id,
        location_id=location_id,
        weather_id=weather_id,
        occasion=occasion,
        target_date=target_date,
        suggestion_text=suggestion_text,
        prompt_used=prompt_used,
        selected_items_json=[item.model_dump() for item in selected_items],
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)
    return history_entry
