import httpx

from location.models import Location
from sqlalchemy.orm import Session


async def get_or_create_location(db: Session, country: str, state: str) -> Location:
    location = db.query(Location).filter(Location.country == country, Location.state == state).first()
    if location:
        return location

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
    country_name = iso_to_name.get(country, country)

    query = f"{state} {country_name}"
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query, "count": 1, "language": "en", "format": "json"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

        if not data.get("results"):
            params["name"] = state
            response = await client.get(url, params=params)
            data = response.json()

            if not data.get("results"):
                params["name"] = country
                response = await client.get(url, params=params)
                data = response.json()

                if not data.get("results"):
                    raise ValueError(f"Could not geolocate the provided country/state: {query}")

        result = data["results"][0]
        new_location = Location(
            country=country,
            state=state,
            latitude=result["latitude"],
            longitude=result["longitude"],
        )
        db.add(new_location)
        db.commit()
        db.refresh(new_location)
        return new_location
