from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from user.auth import get_current_user_id
from wardrobe_suggestion_history.schemas import WardrobeSuggestionHistoryResponse
from wardrobe_suggestion_history.services import list_suggestion_history

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
