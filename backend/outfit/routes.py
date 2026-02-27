from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from database import get_db
from auth import get_current_user_id
from models import User
from outfit.models import OutfitRequest, GeneratedOutfit
from outfit.schemas import OutfitGenerateRequest, OutfitRequestResponse, WeatherDataSchema
from outfit.services import get_or_create_location, get_or_fetch_weather, generate_outfit_image

router = APIRouter(prefix="/api/outfit", tags=["Outfit"])

@router.post("/preview-weather", response_model=WeatherDataSchema)
async def preview_weather(
    req: OutfitGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Fetches and returns the weather data before generation, so the frontend can display it.
    """
    target_date = req.target_date or date.today()
    try:
        location = await get_or_create_location(db, req.country, req.state)
        weather = await get_or_fetch_weather(db, location, target_date)
        result = WeatherDataSchema.model_validate(weather)
        if getattr(weather, '_using_defaults', False):
            result.using_defaults = True
            result.warning = "Using default weather as weather API is facing issues"
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate", response_model=OutfitRequestResponse)
async def generate_outfit(
    req: OutfitGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generates a new outfit based on location and occasion using Vertex AI.
    """
    target_date = req.target_date or date.today()

    try:
        # 1. Location & Weather
        location = await get_or_create_location(db, req.country, req.state)
        weather = await get_or_fetch_weather(db, location, target_date)
        
        # 2. Record Request
        outfit_req = OutfitRequest(
            user_id=user_id,
            location_id=location.id,
            weather_id=weather.id,
            occasion=req.occasion,
            target_date=target_date,
            status="pending"
        )
        db.add(outfit_req)
        db.commit()
        db.refresh(outfit_req)

        # 3. Fetch user profile for personalized generation
        user = db.query(User).filter(User.id == user_id).first()
        gender = user.gender if user and user.gender else "prefer_not_to_say"
        age = None
        if user and user.date_of_birth:
            today = date.today()
            age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))

        # 4. Generate Image
        top_desc, bottom_desc, image_url, prompt = await generate_outfit_image(req.occasion, weather, gender, age, req.country, req.state)

        # 5. Save Generated Outfit
        gen_outfit = GeneratedOutfit(
            request_id=outfit_req.id,
            top_description=top_desc,
            bottom_description=bottom_desc,
            image_url=image_url,
            llm_model_used="imagegeneration@006",
            prompt_used=prompt
        )
        db.add(gen_outfit)
        
        outfit_req.status = "completed"
        db.commit()
        db.refresh(outfit_req)

        return outfit_req
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outfit generation failed: {str(e)}")


@router.get("/history", response_model=List[OutfitRequestResponse])
def get_outfit_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Retrieve past outfit generation requests for the current user.
    """
    requests = db.query(OutfitRequest).filter(OutfitRequest.user_id == user_id).order_by(OutfitRequest.created_at.desc()).all()
    return requests
