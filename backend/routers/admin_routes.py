import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional

from backend.database import db, persist_mock_db
from backend.auth import require_admin, hash_password

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

class AssignCoachRequest(BaseModel):
    coach_id: str

class CreatePlayerAdminRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "demo1234"
    mobile: Optional[str] = "+91 98000 00000"
    location: Optional[str] = "Hyderabad, India"
    playing_role: Optional[str] = "Batter"
    experience: Optional[str] = "Intermediate"
    batting_style: Optional[str] = "Right Hand"
    bowling_style: Optional[str] = "None"
    age: Optional[int] = 18

class CreateCoachAdminRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "demo1234"
    mobile: Optional[str] = "+91 98111 22233"
    specialty: Optional[str] = "Batting Coach"
    academy_name: Optional[str] = "Cricket Academy"
    location: Optional[str] = "Hyderabad, India"
    bio: Optional[str] = "Certified professional cricket coach."
    experience_years: Optional[int] = 10

@router.get("/stats")
def get_admin_stats():
    total_players = db.users.count_documents({"role": "player"})
    active_subscribers = db.subscriptions.count_documents({"status": "active"})
    total_coaches = db.users.count_documents({"role": "coach"})
    
    # Pending = submitted or assigned
    pending_reviews = db.video_reviews.count_documents({"status": {"$in": ["submitted", "assigned"]}})
    completed_reviews = db.video_reviews.count_documents({"status": "completed"})
    
    # Calculate revenue
    paid_payments = list(db.payments.find({"status": "paid"}))
    monthly_revenue = sum(p.get("amount", 0) for p in paid_payments)
    
    ebook_payments = [p for p in paid_payments if p.get("type") == "ebook"]
    ebook_sales = sum(p.get("amount", 0) for p in ebook_payments)
    
    # Coach payouts = sum of earnings
    all_earnings = list(db.earnings.find())
    coach_payouts = sum(e.get("amount", 0) for e in all_earnings)
    
    return {
        "total_players": total_players,
        "active_subscribers": active_subscribers,
        "total_coaches": total_coaches,
        "pending_reviews": pending_reviews,
        "completed_reviews": completed_reviews,
        "monthly_revenue": monthly_revenue,
        "coach_payouts": coach_payouts,
        "ebook_sales": ebook_sales
    }

@router.get("/revenue-trend")
def get_revenue_trend():
    # Return formatted months with revenue data
    return [
        {"month": "May", "revenue": 0},
        {"month": "Jun", "revenue": 0},
        {"month": "Jul", "revenue": 0},
        {"month": "Aug", "revenue": 0},
        {"month": "Sep", "revenue": 0},
        {"month": "Oct", "revenue": 699}
    ]

@router.get("/revenue-mix")
def get_revenue_mix():
    paid_payments = list(db.payments.find({"status": "paid"}))
    plan_total = sum(p.get("amount", 0) for p in paid_payments if p.get("type") == "plan")
    ebook_total = sum(p.get("amount", 0) for p in paid_payments if p.get("type") == "ebook")
    
    return [
        {"name": "Plans", "value": plan_total, "color": "#0B4D3B"},
        {"name": "E-books", "value": ebook_total, "color": "#F59E0B"}
    ]

@router.get("/players")
def get_players():
    players = list(db.users.find({"role": "player"}))
    result = []
    for p in players:
        p_dict = dict(p)
        p_dict.pop("password_hash", None)
        p_dict.pop("_id", None)
        result.append(p_dict)
    return result

@router.patch("/players/{player_id}/status")
def toggle_player_status(player_id: str):
    player = db.users.find_one({"id": player_id, "role": "player"})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    new_status = "inactive" if player.get("status") == "active" else "active"
    db.users.update_one({"id": player_id}, {"$set": {"status": new_status}})
    persist_mock_db()
    
    return {"id": player_id, "status": new_status, "message": f"Player status updated to {new_status}"}

@router.post("/players")
def create_player(req: CreatePlayerAdminRequest):
    clean_email = req.email.strip().lower()
    if db.users.find_one({"email": clean_email}):
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    user_id = f"user_player_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd = req.password if req.password else "demo1234"
    
    new_user = {
        "id": user_id,
        "role": "player",
        "name": req.name.strip(),
        "email": clean_email,
        "password_hash": hash_password(pwd),
        "mobile": req.mobile,
        "location": req.location,
        "playing_role": req.playing_role,
        "experience": req.experience,
        "batting_style": req.batting_style,
        "bowling_style": req.bowling_style,
        "age": req.age,
        "status": "active",
        "created_at": now_iso
    }
    db.users.insert_one(new_user)
    persist_mock_db()
    
    out = dict(new_user)
    out.pop("password_hash", None)
    out.pop("_id", None)
    return out

@router.get("/coaches")
def get_coaches():
    coaches = list(db.coaches.find())
    result = []
    for c in coaches:
        c_dict = dict(c)
        c_dict.pop("_id", None)
        # Fetch user name if not in coach profile
        user = db.users.find_one({"id": c_dict.get("user_id")})
        if user:
            c_dict["name"] = user.get("name")
            c_dict["email"] = user.get("email")
        result.append(c_dict)
    return result

@router.post("/coaches")
def create_coach(req: CreateCoachAdminRequest):
    clean_email = req.email.strip().lower()
    if db.users.find_one({"email": clean_email}):
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    user_id = f"user_coach_{uuid.uuid4().hex[:10]}"
    coach_id = f"coach_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd = req.password if req.password else "demo1234"
    
    new_user = {
        "id": user_id,
        "role": "coach",
        "name": req.name.strip(),
        "email": clean_email,
        "password_hash": hash_password(pwd),
        "mobile": req.mobile,
        "location": req.location,
        "status": "active",
        "created_at": now_iso
    }
    db.users.insert_one(new_user)
    
    coach_profile = {
        "id": coach_id,
        "user_id": user_id,
        "name": req.name.strip(),
        "email": clean_email,
        "specialty": req.specialty,
        "academy_name": req.academy_name,
        "category": "Batters and Fielders",
        "discipline": "Batting",
        "location": req.location,
        "bio": req.bio,
        "biography": req.bio,
        "experience_years": req.experience_years,
        "rating": 5.0,
        "total_reviews": 0,
        "pricing": {"monthly": 2999, "single_review": 499},
        "verification_status": "verified",
        "achievements": ["Certified Cricket Coach"],
        "created_at": now_iso
    }
    db.coaches.insert_one(coach_profile)
    persist_mock_db()
    
    out = dict(coach_profile)
    out.pop("_id", None)
    return out

@router.get("/reviews")
def get_reviews():
    reviews = list(db.video_reviews.find())
    result = []
    for r in reviews:
        r_dict = dict(r)
        r_dict.pop("_id", None)
        
        # Populate player name
        player = db.users.find_one({"id": r_dict.get("player_id")})
        r_dict["player_name"] = player.get("name", "Unknown Player") if player else "Unknown Player"
        
        # Populate coach name
        if r_dict.get("coach_id"):
            coach = db.users.find_one({"id": r_dict.get("coach_id")})
            r_dict["coach_name"] = coach.get("name", "Assigned Coach") if coach else "Assigned Coach"
        else:
            r_dict["coach_name"] = None
            
        result.append(r_dict)
    return result

@router.patch("/reviews/{review_id}/assign")
def assign_coach(review_id: str, req: AssignCoachRequest):
    review = db.video_reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    coach = db.users.find_one({"id": req.coach_id, "role": "coach"})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    db.video_reviews.update_one(
        {"id": review_id},
        {"$set": {
            "coach_id": req.coach_id,
            "status": "assigned",
            "assigned_at": now_iso
        }}
    )
    
    # Notify the coach
    player = db.users.find_one({"id": review.get("player_id")})
    player_name = player.get("name", "A player") if player else "A player"
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": req.coach_id,
        "title": "New Review Assigned",
        "body": f"You have been assigned a {review.get('review_type', 'cricket')} review for {player_name}.",
        "read": False,
        "created_at": now_iso
    })
    
    persist_mock_db()
    return {"message": "Coach assigned successfully", "review_id": review_id, "coach_name": coach.get("name")}

@router.get("/subscriptions")
def get_subscriptions():
    subs = list(db.subscriptions.find())
    result = []
    for s in subs:
        s_dict = dict(s)
        s_dict.pop("_id", None)
        # Populate plan name
        plan = db.plans.find_one({"id": s_dict.get("plan_id")})
        s_dict["plan_name"] = plan.get("name", "Elite") if plan else "Elite"
        # User truncated id or name
        user = db.users.find_one({"id": s_dict.get("user_id")})
        s_dict["user_display"] = s_dict.get("user_id")[:8] if s_dict.get("user_id") else "user_001"
        s_dict["user_name"] = user.get("name", "Player") if user else "Player"
        result.append(s_dict)
    return result

@router.get("/payments")
def get_payments():
    payments = list(db.payments.find())
    result = []
    for p in payments:
        p_dict = dict(p)
        p_dict.pop("_id", None)
        user = db.users.find_one({"id": p_dict.get("user_id")})
        p_dict["user_name"] = user.get("name", "Player") if user else "Player"
        result.append(p_dict)
    return result

@router.get("/ebooks")
def get_ebooks():
    ebooks = list(db.ebooks.find())
    result = []
    for eb in ebooks:
        eb_dict = dict(eb)
        eb_dict.pop("_id", None)
        result.append(eb_dict)
    return result
