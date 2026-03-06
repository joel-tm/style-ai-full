import os

import httpx

from location.models import Location
from sqlalchemy.orm import Session


GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _country_display_name(country: str) -> str:
    iso_to_name = {
        "AE": "United Arab Emirates",
        "SA": "Saudi Arabia",
        "TH": "Thailand",
        "US": "United States",
        "SG": "Singapore",
        "GB": "United Kingdom",
        "MY": "Malaysia",
        "ID": "Indonesia",
        "VN": "Vietnam",
        "HK": "Hong Kong",
        "IN": "India",
    }
    return iso_to_name.get(country.upper(), country)


async def _geocode_location(country: str, state: str) -> tuple[float, float]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY environment variable is missing.")

    country_name = _country_display_name(country)
    params = {
        "address": f"{state}, {country_name}",
        "key": api_key,
    }

    country_code = country.strip().upper()
    if len(country_code) == 2:
        params["components"] = f"country:{country_code}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(GOOGLE_GEOCODING_URL, params=params)
        data = response.json()

    if data.get("status") != "OK" or not data.get("results"):
        raise ValueError(f"Could not geolocate the provided country/state: {state}, {country_name}")

    result = data["results"][0]
    geometry = result.get("geometry", {}).get("location", {})
    latitude = geometry.get("lat")
    longitude = geometry.get("lng")
    if latitude is None or longitude is None:
        raise ValueError(f"Geocoding response missing coordinates for: {state}, {country_name}")

    return latitude, longitude


async def get_or_create_location(db: Session, country: str, state: str, latitude: float | None = None, longitude: float | None = None) -> Location:
    if latitude is None or longitude is None:
        latitude, longitude = await _geocode_location(country, state)

    location = db.query(Location).filter(Location.country == country, Location.state == state).first()
    if location:
        location.latitude = latitude
        location.longitude = longitude
        db.commit()
        db.refresh(location)
        return location

    new_location = Location(
        country=country,
        state=state,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location
