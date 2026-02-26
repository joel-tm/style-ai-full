from pydantic import BaseModel, EmailStr
from datetime import date


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    gender: str
    date_of_birth: date


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    gender: str
    date_of_birth: date
    age: int  # computed field

    class Config:
        from_attributes = True

    @staticmethod
    def _calc_age(dob: date) -> int:
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @classmethod
    def from_user(cls, user):
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            gender=user.gender,
            date_of_birth=user.date_of_birth,
            age=cls._calc_age(user.date_of_birth),
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
