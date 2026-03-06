import os

import httpx

from textile_shop.schemas import TextileShopSummary


GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText"


async def search_nearby_textile_shops(
    location_query: str,
) -> list[TextileShopSummary]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY environment variable is missing.")

    normalized_location = location_query.strip()
    if not normalized_location:
        raise ValueError("A location is required to search for textile shops.")

    payload = {
        "textQuery": f"textile shop near {normalized_location}",
        "maxResultCount": 6,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.displayName,places.formattedAddress,places.location,"
            "places.rating,places.userRatingCount"
        ),
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(GOOGLE_PLACES_URL, json=payload, headers=headers)

    if response.status_code >= 400:
        try:
            error_body = response.json()
        except ValueError:
            error_body = response.text
        raise ValueError(f"Google Places request failed: {error_body}")

    data = response.json()
    places = data.get("places", [])

    shops: list[TextileShopSummary] = []
    seen = set()
    for place in places:
        name = (place.get("displayName") or {}).get("text")
        address = place.get("formattedAddress")
        location = place.get("location") or {}
        if not name or not address:
            continue

        dedupe_key = (name.strip().lower(), address.strip().lower())
        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        shops.append(
            TextileShopSummary(
                name=name.strip(),
                address=address.strip(),
                latitude=location.get("latitude"),
                longitude=location.get("longitude"),
                rating=place.get("rating"),
                user_rating_count=place.get("userRatingCount"),
            )
        )

    return shops
