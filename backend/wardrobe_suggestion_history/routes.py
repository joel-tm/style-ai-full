from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from user.auth import get_current_user_id
from wardrobe_suggestion_history.schemas import WardrobeSuggestionHistoryResponse
from wardrobe_suggestion_history.services import get_suggestion_history_by_id, list_suggestion_history

router = APIRouter(prefix="/api/outfit", tags=["Outfit"])


@router.get("/suggest-history", response_model=List[WardrobeSuggestionHistoryResponse])
def get_suggestion_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Retrieve past wardrobe-based suggestions for the current user.
    """
    return list_suggestion_history(db, user_id)


@router.get("/suggest-history/{suggestion_id}", response_model=WardrobeSuggestionHistoryResponse)
def get_suggestion_history_detail(
    suggestion_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single past wardrobe-based suggestion for the current user.
    """
    return get_suggestion_history_by_id(db, user_id=user_id, suggestion_id=suggestion_id)
