import logging
from datetime import date

import httpx
from location.models import Location
from sqlalchemy.orm import Session

from weather_data.models import WeatherData


async def get_or_fetch_weather(db: Session, location: Location, target_date: date) -> WeatherData:
    weather = db.query(WeatherData).filter(
        WeatherData.location_id == location.id,
        WeatherData.forecast_date == target_date,
    ).first()

    if weather:
        return weather

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
            temperature_max = daily["temperature_2m_max"][0]
            temperature_min = daily["temperature_2m_min"][0]
            temperature_avg = (temperature_max + temperature_min) / 2

            code = daily["weathercode"][0]
            condition = "Clear"
            if 1 <= code <= 3:
                condition = "Cloudy"
            elif 45 <= code <= 48:
                condition = "Fog"
            elif 51 <= code <= 67:
                condition = "Rain"
            elif 71 <= code <= 77:
                condition = "Snow"
            elif 80 <= code <= 82:
                condition = "Showers"
            elif 95 <= code <= 99:
                condition = "Thunderstorm"

            raw_response_json = response.text
    except Exception as exc:
        logger.warning(f"Weather API failed, using defaults: {exc}")
        temperature_max = 28.0
        temperature_min = 22.0
        temperature_avg = 25.0
        condition = "Clear"
        raw_response_json = None
        using_defaults = True

    new_weather = WeatherData(
        location_id=location.id,
        forecast_date=target_date,
        temperature_avg=temperature_avg,
        temperature_min=temperature_min,
        temperature_max=temperature_max,
        humidity=50.0,
        weather_condition=condition,
        raw_response_json=raw_response_json,
    )
    db.add(new_weather)
    db.commit()
    db.refresh(new_weather)
    new_weather._using_defaults = using_defaults
    return new_weather
