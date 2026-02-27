from sqlalchemy import Column, Integer, String, Date
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    gender = Column(String, nullable=False, default="prefer_not_to_say")
    date_of_birth = Column(Date, nullable=False)
