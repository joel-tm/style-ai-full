from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
import os

# --- Configuration ---
SECRET_KEY = "style-ai-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# --- JWT Token ---
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_id(authorization: str | None = Header(None)) -> int:
    """Extract user ID from Bearer token in the Authorization header.

    If the header is missing and the environment variable
    `DISABLE_AUTH_IN_DOCS` is set to a truthy value (1/true), this will
    return a default user id (1) so API docs and local development can
    exercise endpoints without providing a token. In production this
    variable should be unset or false to enforce authentication.
    """
    # Development-only bypass: when explicitly enabled, allow missing
    # Authorization header and return a default user id for convenience.
    if authorization is None:
        if os.getenv("DISABLE_AUTH_IN_DOCS", "false").lower() in ("1", "true"):
            try:
                return int(os.getenv("DEFAULT_DEV_USER_ID", "1"))
            except ValueError:
                return 1
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        token = authorization.replace("Bearer ", "").strip()
        # Optional development convenience: allow passing a plain numeric
        # user id directly in the Authorization header (e.g. "Authorization: 1").
        if token.isdigit() and os.getenv("DISABLE_AUTH_IN_DOCS", "false").lower() in ("1", "true"):
            return int(token)

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return user_id
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
