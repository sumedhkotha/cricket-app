import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

from backend.database import db, persist_mock_db
from backend.auth import require_player

router = APIRouter(prefix="/player", tags=["Player"], dependencies=[Depends(require_player)])

class SubmitReviewRequest(BaseModel):
    youtube_url: str
    review_type: str = "Batting"
    question: str
    notes: Optional[str] = ""
    coach_id: Optional[str] = None

class RateReviewRequest(BaseModel):
    rating: int
    rating_comment: Optional[str] = ""

class SendPlayerMessageRequest(BaseModel):
    body: str

class StartThreadRequest(BaseModel):
    coach_id: str

class UpdatePlayerProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    city: Optional[str] = None
    playing_role: Optional[str] = None
    experience: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    photo_url: Optional[str] = None

def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    # Check if URL itself is just an 11 char ID
    if len(url.strip()) == 11 and re.match(r'^[0-9A-Za-z_-]{11}$', url.strip()):
        return url.strip()
    return None

@router.get("/overview")
def get_player_overview(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    
    # Active subscription
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    active_plan_name = "None"
    reviews_remaining = 0
    if sub:
        plan = db.plans.find_one({"id": sub.get("plan_id")})
        active_plan_name = plan.get("name", "Elite") if plan else "Elite"
        reviews_remaining = sub.get("reviews_remaining", 0)
        
    completed_reviews_count = db.video_reviews.count_documents({
        "player_id": player_id,
        "status": "completed"
    })
    
    # Upcoming sessions
    sessions = list(db.sessions.find().limit(3))
    sessions_list = []
    for s in sessions:
        s_dict = dict(s)
        s_dict.pop("_id", None)
        sessions_list.append(s_dict)
        
    upcoming_classes_count = len(sessions_list)
    
    # Recent review
    recent_reviews = list(db.video_reviews.find({"player_id": player_id}).sort("submitted_at", -1).limit(5))
    clean_reviews = []
    for r in recent_reviews:
        r_dict = dict(r)
        r_dict.pop("_id", None)
        if r_dict.get("coach_id"):
            coach = db.users.find_one({"id": r_dict.get("coach_id")})
            r_dict["coach_name"] = coach.get("name", "Rahul Sharma") if coach else "Rahul Sharma"
        else:
            r_dict["coach_name"] = "Assigned Coach"
        clean_reviews.append(r_dict)
        
    # Current coach (demo coach Rahul or most recent coach)
    coach_profile = db.coaches.find_one({"user_id": "coach_user_rahul"}) or db.coaches.find_one({})
    current_coach_data = None
    if coach_profile:
        coach_user = db.users.find_one({"id": coach_profile.get("user_id")})
        current_coach_data = {
            "name": coach_user.get("name", "Rahul Sharma") if coach_user else "Rahul Sharma",
            "specialty": coach_profile.get("specialty", "Batting Coach"),
            "rating_avg": coach_profile.get("rating_avg", 4.9),
            "photo_url": coach_profile.get("photo_url", "")
        }
        
    return {
        "active_plan": active_plan_name,
        "reviews_remaining": reviews_remaining,
        "completed_reviews": completed_reviews_count,
        "upcoming_classes": upcoming_classes_count,
        "recent_reviews": clean_reviews,
        "current_coach": current_coach_data,
        "upcoming_sessions": sessions_list,
        "has_active_plan": sub is not None
    }

@router.get("/reviews")
def get_player_reviews(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    reviews = list(db.video_reviews.find({"player_id": player_id}).sort("submitted_at", -1))
    result = []
    for r in reviews:
        r_dict = dict(r)
        r_dict.pop("_id", None)
        if r_dict.get("coach_id"):
            coach = db.users.find_one({"id": r_dict.get("coach_id")})
            r_dict["coach_name"] = coach.get("name", "Rahul Sharma") if coach else "Rahul Sharma"
        else:
            r_dict["coach_name"] = "Assigned Coach"
        result.append(r_dict)
    return result

@router.get("/reviews/{review_id}")
def get_player_review_detail(review_id: str, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id, "player_id": player_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    r_dict = dict(review)
    r_dict.pop("_id", None)
    if r_dict.get("coach_id"):
        coach = db.users.find_one({"id": r_dict.get("coach_id")})
        r_dict["coach_name"] = coach.get("name", "Coach") if coach else "Coach"
    return r_dict

@router.post("/reviews")
def submit_player_review(req: SubmitReviewRequest, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    
    # 1. Validate subscription
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    if not sub or sub.get("reviews_remaining", 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You need an active plan with reviews remaining"
        )
        
    # 2. Validate YouTube URL & ID
    yt_id = extract_youtube_id(req.youtube_url)
    if not yt_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid YouTube video link"
        )
        
    now_iso = datetime.now(timezone.utc).isoformat()
    review_id = f"rev_{uuid.uuid4().hex[:10]}"
    
    # Resolve target coach (requested coach or auto-assign to active coaching pool)
    target_coach_id = req.coach_id
    if target_coach_id:
        coach_u = db.users.find_one({"id": target_coach_id, "role": "coach"})
        if not coach_u:
            coach_p = db.coaches.find_one({"id": target_coach_id})
            if coach_p and coach_p.get("user_id"):
                target_coach_id = coach_p.get("user_id")
            else:
                target_coach_id = None

    if not target_coach_id:
        # Check if player has an active coach message thread
        existing_thread = db.message_threads.find_one({"player_id": player_id})
        if existing_thread and existing_thread.get("coach_id"):
            target_coach_id = existing_thread.get("coach_id")
        else:
            # Check if player had a previous review with an assigned coach
            prior_rev = db.video_reviews.find_one({"player_id": player_id, "coach_id": {"$ne": None}})
            if prior_rev and prior_rev.get("coach_id"):
                target_coach_id = prior_rev.get("coach_id")
            else:
                # Default to primary active certified coach (Rahul or first coach)
                primary_coach = db.users.find_one({"id": "coach_user_rahul", "role": "coach"})
                if primary_coach:
                    target_coach_id = primary_coach["id"]
                else:
                    first_coach = db.users.find_one({"role": "coach"})
                    if first_coach:
                        target_coach_id = first_coach["id"]

    new_review = {
        "id": review_id,
        "player_id": player_id,
        "coach_id": target_coach_id,
        "youtube_url": req.youtube_url.strip(),
        "youtube_id": yt_id,
        "review_type": req.review_type,
        "question": req.question.strip(),
        "notes": req.notes.strip() if req.notes else "",
        "status": "assigned" if target_coach_id else "submitted",
        "submitted_at": now_iso,
        "assigned_at": now_iso if target_coach_id else None,
        "completed_at": None,
        "feedback": {},
        "rating": None,
        "rating_comment": None
    }
    db.video_reviews.insert_one(new_review)
    
    # Decrement reviews remaining
    new_remaining = max(0, sub.get("reviews_remaining", 1) - 1)
    db.subscriptions.update_one({"id": sub["id"]}, {"$set": {"reviews_remaining": new_remaining}})
    
    # Send notification directly to the assigned coach
    if target_coach_id:
        db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": target_coach_id,
            "title": "New Video Review Received",
            "body": f"Player {current_user.get('name', 'Student')} submitted a {req.review_type} review for your evaluation.",
            "read": False,
            "created_at": now_iso
        })

    # Notify admins
    admins = list(db.users.find({"role": "admin"}))
    for a in admins:
        db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": a["id"],
            "title": "New Video Review Submitted",
            "body": f"{current_user.get('name', 'A player')} submitted a {req.review_type} review.",
            "read": False,
            "created_at": now_iso
        })
        
    persist_mock_db()
    
    clean_review = dict(new_review)
    clean_review.pop("_id", None)
    return {"message": "Review submitted successfully", "review": clean_review}

@router.post("/reviews/{review_id}/rate")
def rate_review(review_id: str, req: RateReviewRequest, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id, "player_id": player_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Only completed reviews can be rated")
        
    rating_val = max(1, min(5, req.rating))
    db.video_reviews.update_one(
        {"id": review_id},
        {"$set": {
            "rating": rating_val,
            "rating_comment": req.rating_comment.strip() if req.rating_comment else ""
        }}
    )
    
    coach_id = review.get("coach_id")
    if coach_id:
        # Recalculate coach rating average and count
        all_rated = list(db.video_reviews.find({"coach_id": coach_id, "rating": {"$ne": None}}))
        if all_rated:
            total_stars = sum(r.get("rating", 5) for r in all_rated)
            avg = round(total_stars / len(all_rated), 1)
            db.coaches.update_one(
                {"user_id": coach_id},
                {"$set": {"rating_avg": avg, "rating_count": len(all_rated)}}
            )
            
        now_iso = datetime.now(timezone.utc).isoformat()
        db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": coach_id,
            "title": "New Rating Received",
            "body": f"{current_user.get('name', 'Player')} rated your review {rating_val} stars.",
            "read": False,
            "created_at": now_iso
        })
        
    persist_mock_db()
    return {"message": "Thanks for your feedback", "rating": rating_val}

@router.get("/subscription")
def get_player_subscription(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    sub = db.subscriptions.find_one({"user_id": player_id})
    clean_sub = None
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    if sub:
        clean_sub = dict(sub)
        clean_sub.pop("_id", None)
        
        # Check expiry
        expires_at_str = clean_sub.get("expires_at")
        is_expired = False
        days_remaining = 0
        if expires_at_str:
            try:
                exp_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                diff = exp_dt - now
                days_remaining = max(0, diff.days)
                if now > exp_dt:
                    is_expired = True
            except Exception:
                pass
                
        if is_expired:
            clean_sub["status"] = "expired"
            clean_sub["is_access_valid"] = False
        else:
            clean_sub["is_access_valid"] = clean_sub.get("status") in ("active", "cancelled")
            
        clean_sub["days_remaining"] = days_remaining
        
        # Check renewal pending state (active, auto_renew True, within 3 days of expiration)
        if clean_sub["is_access_valid"] and clean_sub.get("auto_renew") and days_remaining <= 3:
            clean_sub["renewal_pending"] = True
        else:
            clean_sub["renewal_pending"] = False
        
        # Hydrate plan details
        plan_id = clean_sub.get("plan_id")
        plan = db.plans.find_one({"id": plan_id})
        if not plan and plan_id == "plan_elite":
            plan = db.plans.find_one({"id": "plan_elite_legend"})
            
        if plan:
            clean_sub["plan_name"] = plan.get("name", "Cricket Plan")
            clean_sub["tier"] = plan.get("tier", "rookie")
            clean_sub["monthly_price"] = plan.get("monthly_price", 499)
            clean_sub["yearly_price"] = plan.get("yearly_price", 4990)
            clean_sub["features"] = plan.get("features", [])
        else:
            clean_sub["plan_name"] = "Cricket Plan"
            clean_sub["tier"] = "rookie"
            
        clean_sub["billing_period"] = clean_sub.get("billing_period") or clean_sub.get("billing_cycle", "monthly")
        clean_sub["billing_cycle"] = clean_sub["billing_period"]
        clean_sub["price"] = clean_sub.get("amount", clean_sub.get("price", 499))
        clean_sub["interval"] = "year" if clean_sub.get("billing_period") == "yearly" else "month"
        clean_sub["auto_renew"] = clean_sub.get("auto_renew", clean_sub.get("status") == "active")
        clean_sub["next_billing_date"] = clean_sub.get("next_billing_date") or clean_sub.get("expires_at")
    else:
        # Check if there is a pending or failed checkout
        latest_payment = db.payments.find_one({"user_id": player_id}, sort=[("created_at", -1)])
        if latest_payment and latest_payment.get("status") == "created":
            fallback_status = "checkout_pending"
        elif latest_payment and latest_payment.get("status") == "failed":
            fallback_status = "payment_failed"
        else:
            fallback_status = "free"
            
        clean_sub = {
            "status": fallback_status,
            "plan_name": "Free Plan",
            "tier": "free",
            "price": 0,
            "amount": 0,
            "billing_period": "none",
            "interval": "none",
            "auto_renew": False,
            "is_access_valid": False,
            "reviews_remaining": 0,
            "features": [
                "Essential platform access",
                "Community announcements",
                "Coach directory exploration"
            ]
        }
        
    # Payment history
    payments = list(db.payments.find({"user_id": player_id}).sort("created_at", -1))
    payments_list = []
    for p in payments:
        p_dict = dict(p)
        p_dict.pop("_id", None)
        payments_list.append(p_dict)
        
    # Active plans for upgrade/downgrade
    all_plans = list(db.plans.find({"active": True}))
    clean_plans = []
    for ap in all_plans:
        ap_dict = dict(ap)
        ap_dict.pop("_id", None)
        clean_plans.append(ap_dict)
        
    return {
        "subscription": clean_sub,
        "payment_history": payments_list,
        "available_plans": clean_plans
    }

@router.get("/plans")
def get_plans():
    plans = list(db.plans.find({"active": True}))
    result = []
    for p in plans:
        p_dict = dict(p)
        p_dict.pop("_id", None)
        result.append(p_dict)
    return result

@router.get("/ebooks")
def get_player_ebooks(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    owned_items = list(db.library_items.find({"user_id": player_id}))
    owned_ebook_ids = set(item.get("ebook_id") for item in owned_items)
    
    ebooks = list(db.ebooks.find())
    result = []
    for eb in ebooks:
        eb_dict = dict(eb)
        eb_dict.pop("_id", None)
        eb_dict["is_owned"] = eb_dict["id"] in owned_ebook_ids
        result.append(eb_dict)
    return result

@router.get("/library")
def get_player_library(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    library_items = list(db.library_items.find({"user_id": player_id}).sort("purchased_at", -1))
    result = []
    for item in library_items:
        ebook = db.ebooks.find_one({"id": item.get("ebook_id")})
        if ebook:
            eb_dict = dict(ebook)
            eb_dict.pop("_id", None)
            eb_dict["purchased_at"] = item.get("purchased_at")
            result.append(eb_dict)
    return result

@router.get("/profile")
def get_player_profile(current_user: dict = Depends(require_player)):
    user = dict(current_user)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user

@router.put("/profile")
def update_player_profile(req: UpdatePlayerProfileRequest, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    
    if "dob" in update_data and update_data["dob"] and "age" not in update_data:
        try:
            birth_year = int(update_data["dob"].split("-")[0])
            update_data["age"] = max(5, datetime.now(timezone.utc).year - birth_year)
        except Exception:
            pass

    if "city" in update_data and update_data["city"]:
        update_data["city"] = update_data["city"].strip()
        if "location" not in update_data or not update_data["location"]:
            update_data["location"] = update_data["city"]

    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].strip()

    if update_data:
        db.users.update_one({"id": player_id}, {"$set": update_data})
        persist_mock_db()

    updated = db.users.find_one({"id": player_id})
    u_dict = dict(updated)
    u_dict.pop("password_hash", None)
    u_dict.pop("_id", None)
    return {"message": "Profile updated successfully", "profile": u_dict}

# ==================== ANNOUNCEMENTS ====================

@router.get("/announcements")
def get_player_announcements(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    
    # Check active subscription
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    has_active_sub = sub is not None

    if not has_active_sub:
        return {
            "locked": True,
            "message": "This feature requires an active subscription.",
            "announcements": [],
            "unread_count": 0
        }

    # Fetch published announcements where audience is "all" or player_id is in target_player_ids
    query = {
        "status": "published",
        "$or": [
            {"audience": "all"},
            {"target_player_ids": player_id}
        ]
    }
    announcements = list(db.announcements.find(query).sort("published_at", -1))
    
    # Read status per announcement
    user_reads = set(
        r["announcement_id"] for r in db.announcement_reads.find({"user_id": player_id})
    )
    
    result = []
    unread_count = 0
    for a in announcements:
        a_dict = dict(a)
        a_dict.pop("_id", None)
        
        # Enrich coach info
        coach = db.users.find_one({"id": a_dict.get("coach_id")})
        coach_prof = db.coaches.find_one({"user_id": a_dict.get("coach_id")})
        a_dict["coach_name"] = coach.get("name", "Coach") if coach else "Coach"
        a_dict["coach_photo"] = (coach_prof.get("photo_url") or coach_prof.get("image_url") or coach.get("photo_url")) if coach_prof and coach else ""
        a_dict["coach_specialty"] = coach_prof.get("specialty", "Cricket Coach") if coach_prof else "Coach"
        
        is_read = a_dict["id"] in user_reads
        a_dict["read"] = is_read
        if not is_read:
            unread_count += 1
            
        result.append(a_dict)
        
    return {
        "locked": False,
        "announcements": result,
        "unread_count": unread_count
    }

@router.post("/announcements/{announcement_id}/read")
def mark_announcement_read(announcement_id: str, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    existing = db.announcement_reads.find_one({"announcement_id": announcement_id, "user_id": player_id})
    if not existing:
        db.announcement_reads.insert_one({
            "id": f"read_{uuid.uuid4().hex[:10]}",
            "announcement_id": announcement_id,
            "user_id": player_id,
            "read_at": datetime.now(timezone.utc).isoformat()
        })
        persist_mock_db()
    return {"success": True}

@router.post("/announcements/read-all")
def mark_all_announcements_read(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    query = {
        "status": "published",
        "$or": [
            {"audience": "all"},
            {"target_player_ids": player_id}
        ]
    }
    announcements = list(db.announcements.find(query))
    now_iso = datetime.now(timezone.utc).isoformat()
    for a in announcements:
        if not db.announcement_reads.find_one({"announcement_id": a["id"], "user_id": player_id}):
            db.announcement_reads.insert_one({
                "id": f"read_{uuid.uuid4().hex[:10]}",
                "announcement_id": a["id"],
                "user_id": player_id,
                "read_at": now_iso
            })
    persist_mock_db()
    return {"success": True}

@router.get("/threads")
def get_player_threads(current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    
    # Check active subscription
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    if not sub:
        return {
            "locked": True,
            "message": "This feature requires an active subscription.",
            "threads": [],
            "coaches": []
        }

    # Existing threads
    threads = list(db.message_threads.find({"player_id": player_id}))
    threads_list = []
    for t in threads:
        t_dict = dict(t)
        t_dict.pop("_id", None)
        
        coach_user = db.users.find_one({"id": t_dict.get("coach_id")})
        coach_prof = db.coaches.find_one({"user_id": t_dict.get("coach_id")})
        
        t_dict["coach_name"] = coach_user.get("name", "Coach") if coach_user else "Coach"
        t_dict["specialty"] = coach_prof.get("specialty", "Coach") if coach_prof else "Coach"
        
        # Last message
        last_msg = db.messages.find_one(
            {"thread_id": t_dict["id"]},
            sort=[("created_at", -1)]
        )
        t_dict["last_message"] = last_msg.get("body", "") if last_msg else ""
        
        # Unread
        unread = db.messages.count_documents({
            "thread_id": t_dict["id"],
            "sender_id": {"$ne": player_id},
            "read": False
        })
        t_dict["has_unread"] = unread > 0
        
        threads_list.append(t_dict)
        
    # All coaches for "Start a chat"
    all_coaches = list(db.coaches.find())
    coaches_list = []
    for c in all_coaches:
        user = db.users.find_one({"id": c.get("user_id")})
        if user:
            coaches_list.append({
                "coach_id": c.get("user_id"),
                "name": user.get("name"),
                "specialty": c.get("specialty"),
                "photo_url": c.get("photo_url")
            })
            
    return {
        "locked": False,
        "threads": threads_list,
        "coaches": coaches_list
    }

@router.post("/threads/start")
def start_or_get_thread(req: StartThreadRequest, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    coach_id = req.coach_id
    
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires an active subscription."
        )

    existing = db.message_threads.find_one({"player_id": player_id, "coach_id": coach_id})
    if existing:
        e_dict = dict(existing)
        e_dict.pop("_id", None)
        return e_dict
        
    thread_id = f"thread_{player_id[:8]}_{coach_id[:8]}_{uuid.uuid4().hex[:4]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    new_thread = {
        "id": thread_id,
        "player_id": player_id,
        "coach_id": coach_id,
        "last_message_at": now_iso
    }
    db.message_threads.insert_one(new_thread)
    persist_mock_db()
    
    clean_thread = dict(new_thread)
    clean_thread.pop("_id", None)
    return clean_thread

@router.get("/threads/{thread_id}/messages")
def get_player_thread_messages(thread_id: str, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    thread = db.message_threads.find_one({"id": thread_id, "player_id": player_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    # Mark messages as read
    db.messages.update_many(
        {"thread_id": thread_id, "sender_id": {"$ne": player_id}},
        {"$set": {"read": True}}
    )
    persist_mock_db()
    
    messages = list(db.messages.find({"thread_id": thread_id}).sort("created_at", 1))
    result = []
    for m in messages:
        m_dict = dict(m)
        m_dict.pop("_id", None)
        result.append(m_dict)
    return result

@router.post("/threads/{thread_id}/messages")
def send_player_message(thread_id: str, req: SendPlayerMessageRequest, current_user: dict = Depends(require_player)):
    player_id = current_user["id"]
    
    sub = db.subscriptions.find_one({"user_id": player_id, "status": "active"})
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires an active subscription."
        )

    thread = db.message_threads.find_one({"id": thread_id, "player_id": player_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    msg_id = f"msg_{uuid.uuid4().hex[:10]}"
    new_msg = {
        "id": msg_id,
        "thread_id": thread_id,
        "sender_id": player_id,
        "body": req.body.strip(),
        "created_at": now_iso,
        "read": False
    }
    db.messages.insert_one(new_msg)
    db.message_threads.update_one({"id": thread_id}, {"$set": {"last_message_at": now_iso}})
    
    # Notify coach
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": thread.get("coach_id"),
        "title": "New Message from Player",
        "body": f"{current_user.get('name', 'A player')} sent you a message.",
        "read": False,
        "created_at": now_iso
    })
    
    persist_mock_db()
    clean_msg = dict(new_msg)
    clean_msg.pop("_id", None)
    return clean_msg
