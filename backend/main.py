from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from database import engine, Base, get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token

# Import wardrobe and outfit models so their tables get created
from wardrobe.models import WardrobeItem  # noqa: F401
from outfit.models import OutfitRequest  # noqa: F401
from wardrobe.routes import router as wardrobe_router

# --- Create all tables ---
Base.metadata.create_all(bind=engine)

# --- Uploads directory ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# --- App ---
app = FastAPI(title="Style-AI Backend", version="1.0.0")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve uploaded images ---
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# --- Include routers ---
from outfit.routes import router as outfit_router
app.include_router(wardrobe_router)
app.include_router(outfit_router)

# --- Auth Routes ---

@app.post("/api/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate fields
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not req.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Create user
    user = User(
        name=req.name.strip(),
        email=req.email.strip().lower(),
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@app.post("/api/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify password
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Generate token
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
