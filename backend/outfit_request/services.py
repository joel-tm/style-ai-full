from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from generated_outfit.services import create_generated_outfit
from outfit.services import generate_outfit_image, get_or_create_location, get_or_fetch_weather
from outfit_request.models import OutfitRequest
from user.models import User


async def ensure_request_weather(db: Session, outfit_request: OutfitRequest) -> OutfitRequest:
    if outfit_request.weather is not None:
        return outfit_request

    if outfit_request.location is None:
        raise HTTPException(status_code=500, detail=f"Outfit request {outfit_request.id} is missing location data")

    weather = await get_or_fetch_weather(db, outfit_request.location, outfit_request.target_date)
    outfit_request.weather_id = weather.id
    db.add(outfit_request)
    db.commit()
    db.refresh(outfit_request)
    return outfit_request


def get_user_style_profile(db: Session, user_id: int) -> tuple[str, int | None]:
    user = db.query(User).filter(User.id == user_id).first()
    gender = user.gender if user and user.gender else "prefer_not_to_say"
    age = None
    if user and user.date_of_birth:
        today = date.today()
        age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))
    return gender, age


async def create_outfit_request_with_generation(db: Session, user_id: int, occasion: str, country: str, state: str, target_date: date) -> OutfitRequest:
    location = await get_or_create_location(db, country, state)
    weather = await get_or_fetch_weather(db, location, target_date)

    outfit_request = OutfitRequest(
        user_id=user_id,
        location_id=location.id,
        weather_id=weather.id,
        occasion=occasion,
        target_date=target_date,
        status="pending",
    )
    db.add(outfit_request)
    db.commit()
    db.refresh(outfit_request)

    gender, age = get_user_style_profile(db, user_id)
    top_description, bottom_description, image_url, prompt_used = await generate_outfit_image(
        occasion,
        weather,
        gender,
        age,
        country,
        state,
    )

    create_generated_outfit(
        db,
        request_id=outfit_request.id,
        top_description=top_description,
        bottom_description=bottom_description,
        image_url=image_url,
        llm_model_used="imagegeneration@006",
        prompt_used=prompt_used,
    )

    outfit_request.status = "completed"
    db.commit()
    db.refresh(outfit_request)
    return outfit_request


async def list_outfit_requests(db: Session, user_id: int) -> list[OutfitRequest]:
    requests = db.query(OutfitRequest).filter(OutfitRequest.user_id == user_id).order_by(OutfitRequest.created_at.desc()).all()
    for outfit_request in requests:
        await ensure_request_weather(db, outfit_request)
    return requests


async def get_outfit_request_by_id(db: Session, user_id: int, outfit_id: int) -> OutfitRequest:
    outfit_request = db.query(OutfitRequest).filter(
        OutfitRequest.id == outfit_id,
        OutfitRequest.user_id == user_id,
    ).first()
    if not outfit_request:
        raise HTTPException(status_code=404, detail="Outfit not found")
    await ensure_request_weather(db, outfit_request)
    return outfit_request
