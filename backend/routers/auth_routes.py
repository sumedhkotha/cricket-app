import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.database import db, persist_mock_db
from backend.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterPlayerRequest(BaseModel):
    name: str
    email: str
    password: str
    mobile: str
    dob: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = ""
    city: Optional[str] = ""
    photo_url: Optional[str] = None
    playing_role: str = "Batter"
    experience: str = "Beginner"
    batting_style: str = "Right-Handed"
    bowling_style: str = "None"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register_player(req: RegisterPlayerRequest):
    # Check if user already exists
    existing = db.users.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Calculate age if dob provided and age not set
    calculated_age = req.age
    if not calculated_age and req.dob:
        try:
            birth_year = int(req.dob.split("-")[0])
            calculated_age = max(5, datetime.now(timezone.utc).year - birth_year)
        except Exception:
            calculated_age = 18
    elif not calculated_age:
        calculated_age = 18

    loc = (req.location or req.city or "").strip()

    user_id = f"user_player_{uuid.uuid4().hex[:10]}"
    new_user = {
        "id": user_id,
        "role": "player",
        "name": req.name.strip(),
        "email": req.email.lower().strip(),
        "password_hash": hash_password(req.password),
        "mobile": req.mobile.strip(),
        "dob": req.dob,
        "age": calculated_age,
        "city": req.city.strip() if req.city else loc,
        "location": loc,
        "photo_url": req.photo_url,
        "playing_role": req.playing_role,
        "experience": req.experience,
        "batting_style": req.batting_style,
        "bowling_style": req.bowling_style,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(new_user)
    
    # Send welcome notification
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "title": "Welcome to Cricket Vault!",
        "body": "Explore our coaching plans, certified coaches, and master your technique.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    persist_mock_db()
    
    token = create_access_token({"sub": user_id, "role": "player"})
    clean_user = dict(new_user)
    clean_user.pop("password_hash", None)
    clean_user.pop("_id", None)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": clean_user
    }

@router.post("/login")
def login(req: LoginRequest):
    user = db.users.find_one({"email": req.email.lower().strip()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if user.get("status") == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact platform administrator."
        )
        
    token = create_access_token({"sub": user["id"], "role": user.get("role", "player")})
    clean_user = dict(user)
    clean_user.pop("password_hash", None)
    clean_user.pop("_id", None)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": clean_user
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user = dict(current_user)
    user.pop("password_hash", None)
    user.pop("_id", None)
    
    # Attach coach profile or player subscription summary if relevant
    if user.get("role") == "coach":
        coach_profile = db.coaches.find_one({"user_id": user["id"]})
        if coach_profile:
            coach_profile.pop("_id", None)
            user["coach_profile"] = coach_profile
    elif user.get("role") == "player":
        sub = db.subscriptions.find_one({"user_id": user["id"], "status": "active"})
        if sub:
            sub.pop("_id", None)
            user["subscription"] = sub
            
    return user

