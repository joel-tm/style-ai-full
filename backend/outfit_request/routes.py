from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from outfit_request.schemas import OutfitGenerateRequest, OutfitRequestResponse
from outfit_request.services import create_outfit_request_with_generation, get_outfit_request_by_id, list_outfit_requests
from user.auth import get_current_user_id

router = APIRouter(prefix="/api/outfit", tags=["Outfit"])


@router.post("/generate", response_model=OutfitRequestResponse)
async def generate_outfit(
    req: OutfitGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    target_date = req.target_date or date.today()

    try:
        return await create_outfit_request_with_generation(
            db,
            user_id=user_id,
            occasion=req.occasion,
            country=req.country,
            state=req.state,
            target_date=target_date,
            latitude=req.latitude,
            longitude=req.longitude,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outfit generation failed: {str(e)}")


@router.get("/history", response_model=List[OutfitRequestResponse])
async def get_outfit_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return await list_outfit_requests(db, user_id)


@router.get("/{outfit_id}", response_model=OutfitRequestResponse)
async def get_outfit_detail(
    outfit_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return await get_outfit_request_by_id(db, user_id, outfit_id)