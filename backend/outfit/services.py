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
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={location.latitude}&longitude={location.longitude}"
        f"&daily=temperature_2m_max,temperature_2m_min,weathercode"
        f"&timezone=auto&start_date={target_date}&end_date={target_date}"
    )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        
        if "daily" not in data or not data["daily"]["time"]:
            raise ValueError("Could not fetch weather data for the specified date.")
            
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

        new_weather = WeatherData(
            location_id=location.id,
            forecast_date=target_date,
            temperature_avg=temp_avg,
            temperature_min=temp_min,
            temperature_max=temp_max,
            humidity=50.0, # Placeholder as Open-Meteo daily humidity isn't directly exposed in all endpoints cleanly without hourly aggregation
            weather_condition=condition,
            raw_response_json=response.text
        )
        db.add(new_weather)
        db.commit()
        db.refresh(new_weather)
        return new_weather

async def generate_outfit_image(occasion: str, weather: WeatherData) -> tuple[str, str, str, str]:
    """
    Generates an outfit image using Google Vertex AI.
    Returns: (top_description, bottom_description, image_url, prompt_used)
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is missing for Vertex AI.")
        
    vertexai.init(project=project_id, location=location)

    prompt = (
        f"A photorealistic, highly detailed image of a complete clothing outfit. "
        f"The outfit is styled for a '{occasion}' occasion. "
        f"The weather is {weather.temperature_avg:.1f}C ({weather.weather_condition}). "
        f"The image should show only the clothing beautifully laid out flat. "
        f"No people, no faces, just the top clothing and bottom clothing pieces clearly visible together on a clean, light neutral background. "
        f"Professional fashion photography style, studio lighting."
    )

    # We use preview image generation model
    model = ImageGenerationModel.from_pretrained("imagegeneration@006")
    images = model.generate_images(
        prompt=prompt,
        number_of_images=1,
        language="en",
        aspect_ratio="1:1"
    )

    generated_image = images[0]
    
    # Save image to uploads folder
    UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "outfits")
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    unique_name = f"outfit_{uuid.uuid4().hex}.png"
    filepath = os.path.join(UPLOADS_DIR, unique_name)
    generated_image.save(location=filepath)

    image_url = f"/uploads/outfits/{unique_name}"

    # We generate a simple description since the image generation model doesn't return text descriptions
    top_desc = f"Top suitable for {occasion} in {weather.weather_condition}"
    bottom_desc = f"Bottoms tailored for {weather.temperature_avg:.1f}C weather"

    return top_desc, bottom_desc, image_url, prompt
