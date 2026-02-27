import asyncio
import httpx
import os
import uuid
from datetime import date
from outfit.models import Location, WeatherData
from sqlalchemy.orm import Session
from vertexai.preview.vision_models import ImageGenerationModel
import vertexai

from sqlalchemy.orm import Session

async def get_or_create_location(db: Session, country: str, state: str) -> Location:
    loc = db.query(Location).filter(Location.country == country, Location.state == state).first()
    if loc:
        return loc

    # Geocoding via Open-Meteo
    query = f"{state} {country}"
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query, "count": 1, "language": "en", "format": "json"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        
        if not data.get("results"):
            # Fallback 1: Just state
            params["name"] = state
            response = await client.get(url, params=params)
            data = response.json()

            if not data.get("results"):
                # Fallback 2: Just country
                params["name"] = country
                response = await client.get(url, params=params)
                data = response.json()

                if not data.get("results"):
                    raise ValueError(f"Could not geolocate the provided country/state: {query}")

        result = data["results"][0]
        lat = result["latitude"]
        lon = result["longitude"]

        new_loc = Location(country=country, state=state, latitude=lat, longitude=lon)
        db.add(new_loc)
        db.commit()
        db.refresh(new_loc)
        return new_loc


async def get_or_fetch_weather(db: Session, location: Location, target_date: date) -> WeatherData:
    weather = db.query(WeatherData).filter(
        WeatherData.location_id == location.id, 
        WeatherData.forecast_date == target_date
    ).first()
    
    if weather:
        return weather

    # Fetch from Open-Meteo
    # using daily forecast for the target_date
    import logging
    logger = logging.getLogger(__name__)

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={location.latitude}&longitude={location.longitude}"
        f"&daily=temperature_2m_max,temperature_2m_min,weathercode"
        f"&timezone=auto&start_date={target_date}&end_date={target_date}"
    )

    using_defaults = False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            data = response.json()

            if "daily" not in data or not data["daily"]["time"]:
                raise ValueError("No daily data in response")

            daily = data["daily"]
            temp_max = daily["temperature_2m_max"][0]
            temp_min = daily["temperature_2m_min"][0]
            temp_avg = (temp_max + temp_min) / 2

            # very rough mapping of WMO weather codes (0=Clear, 1-3=Partly Cloudy, 45-48=Fog, 51-67=Rain, 71-77=Snow, etc.)
            code = daily["weathercode"][0]
            condition = "Clear"
            if 1 <= code <= 3: condition = "Cloudy"
            elif 45 <= code <= 48: condition = "Fog"
            elif 51 <= code <= 67: condition = "Rain"
            elif 71 <= code <= 77: condition = "Snow"
            elif 80 <= code <= 82: condition = "Showers"
            elif 95 <= code <= 99: condition = "Thunderstorm"

            raw_json = response.text
    except Exception as e:
        logger.warning(f"Weather API failed, using defaults: {e}")
        temp_max = 28.0
        temp_min = 22.0
        temp_avg = 25.0
        condition = "Clear"
        raw_json = None
        using_defaults = True

    new_weather = WeatherData(
        location_id=location.id,
        forecast_date=target_date,
        temperature_avg=temp_avg,
        temperature_min=temp_min,
        temperature_max=temp_max,
        humidity=50.0,
        weather_condition=condition,
        raw_response_json=raw_json
    )
    db.add(new_weather)
    db.commit()
    db.refresh(new_weather)
    # Attach a transient flag so the caller can inform the user
    new_weather._using_defaults = using_defaults
    return new_weather

async def generate_outfit_image(occasion: str, weather: WeatherData, gender: str = "prefer_not_to_say", age: int | None = None, country: str = "", state: str = "") -> tuple[str, str, str, str]:
    """
    Generates an outfit image using Google Vertex AI.
    Returns: (top_description, bottom_description, image_url, prompt_used)
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is missing for Vertex AI.")
        
    from google import genai
    from google.genai import types
    
    # Build the prompt from occasion + weather + user context
    gender_str = gender.replace("_", " ") if gender and gender != "prefer_not_to_say" else "person"
    age_str = f", age {age}" if age else ""
    location_str = f" in {state}, {country}" if state and country else (f" in {country}" if country else "")
    prompt = (
        f"A stylish, full-body outfit for a {gender_str}{age_str}{location_str} for a {occasion} occasion. "
        f"A professional flat lay of {gender_str}{age_str} clothing for a {occasion} occasion. "
        f"The outfit is designed for {weather.weather_condition} weather at {weather.temperature_avg:.1f}°C{location_str}. "
        f"High-quality {gender_str} fashion items laid flat on a clean, neutral background. "
        f"Visible items: [Top Piece] and [Bottom Piece]. "
        f"Strictly no people, no models, no limbs, and no mannequins. "
        f"Only the clothes are shown, neatly arranged from a top-down perspective."
    )
    
    # Run EVERYTHING (client creation + API call) inside a thread so the
    # client's destructor fires in a non-async context, avoiding the
    # '_async_httpx_client' cleanup bug in google-genai.
    def _generate():
        c = genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
        )
        return c.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/jpeg"
            )
        )

    import logging
    logger = logging.getLogger(__name__)
    try:
        result = await asyncio.to_thread(_generate)
    except Exception as e:
        logger.error(f"Vertex AI image generation failed: {e}", exc_info=True)
        raise

    generated_image = result.generated_images[0]
    
    # Save image to uploads folder
    UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "outfits")
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    unique_name = f"outfit_{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(UPLOADS_DIR, unique_name)
    
    with open(filepath, "wb") as f:
        f.write(generated_image.image.image_bytes)

    image_url = f"/uploads/outfits/{unique_name}"

    # We generate a simple description since the image generation model doesn't return text descriptions
    top_desc = f"Top suitable for {occasion} in {weather.weather_condition}"
    bottom_desc = f"Bottoms tailored for {weather.temperature_avg:.1f}C weather"

    return top_desc, bottom_desc, image_url, prompt
