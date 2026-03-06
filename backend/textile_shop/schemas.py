from pydantic import BaseModel, Field


class TextileShopSearchRequest(BaseModel):
    location_query: str = Field(min_length=2, max_length=120)


class TextileShopSummary(BaseModel):
    name: str
    address: str
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    user_rating_count: int | None = None


class TextileShopSearchResponse(BaseModel):
    shops: list[TextileShopSummary]
