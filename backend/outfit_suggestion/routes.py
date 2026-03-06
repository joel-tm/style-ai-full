from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from location.services import get_or_create_location
from outfit_request.schemas import OutfitGenerateRequest
from outfit_suggestion.schemas import WardrobeItemBrief, WardrobeSuggestionResponse
from outfit_suggestion.services import suggest_outfit_from_wardrobe
from user.auth import get_current_user_id
from user.models import User
from wardrobe_suggestion_history.services import create_suggestion_history_entry
from weather_data.schemas import WeatherDataSchema
from weather_data.services import get_or_fetch_weather

router = APIRouter(prefix="/api/outfit", tags=["Outfit"])


@router.post("/preview-weather", response_model=WeatherDataSchema)
async def preview_weather(
    req: OutfitGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    target_date = req.target_date or date.today()
    try:
        location = await get_or_create_location(db, req.country, req.state)
        weather = await get_or_fetch_weather(db, location, target_date)
        result = WeatherDataSchema.model_validate(weather)
        if getattr(weather, "_using_defaults", False):
            result.using_defaults = True
            result.warning = "Using default weather as weather API is facing issues"
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/suggest-from-wardrobe", response_model=WardrobeSuggestionResponse)
async def suggest_from_wardrobe_route(
    req: OutfitGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    from wardrobe.models import WardrobeItem

    target_date = req.target_date or date.today()

    try:
        location = await get_or_create_location(db, req.country, req.state)
        weather = await get_or_fetch_weather(db, location, target_date)

        items = db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()
        if not items:
            raise HTTPException(status_code=400, detail="Your wardrobe is empty. Add some clothes first!")

        user = db.query(User).filter(User.id == user_id).first()
        gender = user.gender if user and user.gender else "prefer_not_to_say"
        age = None
        if user and user.date_of_birth:
            today = date.today()
            age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))

        wardrobe_summary = []
        for item in items:
            item_data = {"id": item.id, "category": item.category}
            if item.image_analysis and isinstance(item.image_analysis, dict):
                item_data["attributes"] = item.image_analysis
            wardrobe_summary.append(item_data)

        suggestion_text, selected_ids, prompt_used = await suggest_outfit_from_wardrobe(
            occasion=req.occasion,
            weather=weather,
            wardrobe_items=wardrobe_summary,
            gender=gender,
            age=age,
            country=req.country,
            state=req.state,
        )

        selected_items = []
        for item in items:
            if item.id in selected_ids:
                selected_items.append(WardrobeItemBrief(
                    id=item.id,
                    category=item.category,
                    image_url=f"/uploads/{item.filename}",
                    bg_removed_image_url=f"/uploads/{item.bg_removed_filename}" if item.bg_removed_filename else None,
                ))

        weather_schema = WeatherDataSchema.model_validate(weather)

        create_suggestion_history_entry(
            db,
            user_id=user_id,
            location_id=location.id,
            weather_id=weather.id if weather else None,
            occasion=req.occasion,
            target_date=target_date,
            suggestion_text=suggestion_text,
            prompt_used=prompt_used,
            selected_items=selected_items,
        )

        return WardrobeSuggestionResponse(
            occasion=req.occasion,
            country=req.country,
            state=req.state,
            weather=weather_schema,
            suggestion=suggestion_text,
            prompt_used=prompt_used,
            selected_items=selected_items,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {str(exc)}")
