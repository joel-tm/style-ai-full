import logging
import os
from datetime import date

import httpx
from location.models import Location
from sqlalchemy.orm import Session

from weather_data.models import WeatherData


GOOGLE_WEATHER_URL = "https://weather.googleapis.com/v1/forecast/days:lookup"


def _extract_condition_text(forecast_day: dict) -> str:
    for part_key in ("daytimeForecast", "nighttimeForecast"):
        weather_condition = (forecast_day.get(part_key) or {}).get("weatherCondition") or {}
        description = weather_condition.get("description") or {}
        if description.get("text"):
            return description["text"]
        if weather_condition.get("type"):
            return weather_condition["type"].replace("_", " ").title()
    return "Clear"


def _extract_humidity(forecast_day: dict) -> float:
    humidity_values = []
    for part_key in ("daytimeForecast", "nighttimeForecast"):
        humidity = (forecast_day.get(part_key) or {}).get("relativeHumidity")
        if isinstance(humidity, (int, float)):
            humidity_values.append(float(humidity))

    if humidity_values:
        return sum(humidity_values) / len(humidity_values)
    return 50.0


def _find_forecast_day(forecast_days: list[dict], target_date: date) -> dict | None:
    for forecast_day in forecast_days:
        display_date = forecast_day.get("displayDate") or {}
        if (
            display_date.get("year") == target_date.year
            and display_date.get("month") == target_date.month
            and display_date.get("day") == target_date.day
        ):
            return forecast_day
    return None


async def get_or_fetch_weather(db: Session, location: Location, target_date: date) -> WeatherData:
    weather = db.query(WeatherData).filter(
        WeatherData.location_id == location.id,
        WeatherData.forecast_date == target_date,
    ).first()

    logger = logging.getLogger(__name__)
    api_key = os.getenv("GOOGLE_WEATHER_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_WEATHER_API_KEY (or GOOGLE_MAPS_API_KEY) environment variable is missing.")

    using_defaults = False
    try:
        days_ahead = (target_date - date.today()).days
        if days_ahead < 0 or days_ahead > 9:
            raise ValueError("Google Weather API supports daily forecast lookup for the next 10 days only.")

        params = {
            "key": api_key,
            "location.latitude": location.latitude,
            "location.longitude": location.longitude,
            "days": days_ahead + 1,
            "pageSize": days_ahead + 1,
            "languageCode": "en-US",
            "unitsSystem": "METRIC",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(GOOGLE_WEATHER_URL, params=params)
            response.raise_for_status()
            data = response.json()

            forecast_day = _find_forecast_day(data.get("forecastDays", []), target_date)
            if not forecast_day:
                raise ValueError("No daily forecast data returned for the requested date")

            max_temperature = forecast_day.get("maxTemperature") or {}
            min_temperature = forecast_day.get("minTemperature") or {}
            temperature_max = max_temperature.get("degrees")
            temperature_min = min_temperature.get("degrees")
            if temperature_max is None or temperature_min is None:
                raise ValueError("Weather API response missing min/max temperature")

            temperature_avg = (temperature_max + temperature_min) / 2

            humidity = _extract_humidity(forecast_day)
            condition = _extract_condition_text(forecast_day)

            raw_response_json = response.text
    except Exception as exc:
        logger.warning(f"Weather API failed, using defaults: {exc}")

        if weather and weather.raw_response_json and "forecastDays" in weather.raw_response_json:
            weather._using_defaults = True
            return weather

        temperature_max = 28.0
        temperature_min = 22.0
        temperature_avg = 25.0
        humidity = 50.0
        condition = "Clear"
        raw_response_json = None
        using_defaults = True

    if weather is None:
        weather = WeatherData(location_id=location.id, forecast_date=target_date)
        db.add(weather)

    weather.temperature_avg = temperature_avg
    weather.temperature_min = temperature_min
    weather.temperature_max = temperature_max
    weather.humidity = humidity
    weather.weather_condition = condition
    weather.raw_response_json = raw_response_json

    db.commit()
    db.refresh(weather)
    weather._using_defaults = using_defaults
    return weather
