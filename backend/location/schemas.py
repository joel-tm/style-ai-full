from pydantic import BaseModel


class LocationSchema(BaseModel):
    country: str
    state: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True
