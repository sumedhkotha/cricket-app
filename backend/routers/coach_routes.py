import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.database import db, persist_mock_db
from backend.auth import require_coach

router = APIRouter(prefix="/coach", tags=["Coach"], dependencies=[Depends(require_coach)])

class FeedbackModel(BaseModel):
    technical_mistakes: str = ""
    strengths: Optional[str] = ""
    areas_to_improve: Optional[str] = ""
    recommended_drills: Optional[str] = ""
    match_advice: Optional[str] = ""
    additional: Optional[str] = ""
    overall_assessment: str = ""

class DraftReviewRequest(BaseModel):
    feedback: FeedbackModel

class SubmitReviewRequest(BaseModel):
    feedback: FeedbackModel

class SendMessageRequest(BaseModel):
    body: str

from typing import Optional, Dict, Any, List

class UpdateCoachProfileRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    biography: Optional[str] = None
    city: Optional[str] = None
    years_experience: Optional[int] = None
    specialty: Optional[str] = None
    qualifications: Optional[str] = None
    specializations: Optional[List[str]] = None
    photo_url: Optional[str] = None

class CreateAnnouncementRequest(BaseModel):
    title: str
    message: str
    audience: str = "all"  # "all" or "selected"
    target_player_ids: Optional[List[str]] = []
    category: Optional[str] = "General"
    status: str = "published"  # "published" or "draft"
    scheduled_at: Optional[str] = None

class UpdateAnnouncementRequest(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    audience: Optional[str] = None
    target_player_ids: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None

@router.get("/stats")
def get_coach_stats(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    
    # Reviews
    pending_reviews = db.video_reviews.count_documents({
        "$or": [
            {"coach_id": coach_id, "status": {"$in": ["assigned", "under_review"]}},
            {"coach_id": None, "status": "submitted"}
        ]
    })
    completed_reviews = db.video_reviews.count_documents({
        "coach_id": coach_id,
        "status": "completed"
    })
    
    # Distinct players assigned
    all_coach_reviews = list(db.video_reviews.find({
        "$or": [
            {"coach_id": coach_id},
            {"coach_id": None, "status": "submitted"}
        ]
    }))
    player_ids = set(r.get("player_id") for r in all_coach_reviews if r.get("player_id"))
    assigned_players = len(player_ids)
    
    # Earnings this month
    coach_earnings = list(db.earnings.find({"coach_id": coach_id}))
    this_months_earnings = sum(e.get("amount", 0) for e in coach_earnings)
    
    return {
        "assigned_players": assigned_players,
        "pending_reviews": pending_reviews,
        "completed_reviews": completed_reviews,
        "this_months_earnings": this_months_earnings
    }

@router.get("/reviews")
def get_coach_reviews(status: Optional[str] = None, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    
    if status == "pending":
        query = {
            "$or": [
                {"coach_id": coach_id, "status": {"$in": ["assigned", "under_review"]}},
                {"coach_id": None, "status": "submitted"}
            ]
        }
    elif status == "completed":
        query = {"coach_id": coach_id, "status": "completed"}
    else:
        query = {
            "$or": [
                {"coach_id": coach_id},
                {"coach_id": None, "status": "submitted"}
            ]
        }
        
    reviews = list(db.video_reviews.find(query))
    result = []
    for r in reviews:
        r_dict = dict(r)
        r_dict.pop("_id", None)
        
        player = db.users.find_one({"id": r_dict.get("player_id")})
        if player:
            r_dict["player_name"] = player.get("name", "Player")
            r_dict["player_location"] = player.get("location", "")
            r_dict["player_role"] = player.get("playing_role", "")
        else:
            r_dict["player_name"] = "Player"
            
        result.append(r_dict)
    return result

@router.get("/reviews/{review_id}")
def get_coach_review_detail(review_id: str, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    # If unassigned, auto-claim for this coach
    if review.get("coach_id") is None:
        now_iso = datetime.now(timezone.utc).isoformat()
        db.video_reviews.update_one(
            {"id": review_id},
            {"$set": {"coach_id": coach_id, "status": "under_review", "assigned_at": now_iso}}
        )
        persist_mock_db()
        review["coach_id"] = coach_id
        review["status"] = "under_review"
    elif review.get("coach_id") != coach_id:
        raise HTTPException(status_code=403, detail="Review is assigned to another coach")
        
    r_dict = dict(review)
    r_dict.pop("_id", None)
    
    player = db.users.find_one({"id": r_dict.get("player_id")})
    if player:
        p_clean = dict(player)
        p_clean.pop("password_hash", None)
        p_clean.pop("_id", None)
        r_dict["player"] = p_clean
        
    return r_dict

@router.post("/reviews/{review_id}/start")
def start_review(review_id: str, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id, "coach_id": coach_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.get("status") == "assigned":
        db.video_reviews.update_one({"id": review_id}, {"$set": {"status": "under_review"}})
        persist_mock_db()
        
    return {"message": "Review status updated to under_review"}

@router.put("/reviews/{review_id}/draft")
def save_review_draft(review_id: str, req: DraftReviewRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id, "coach_id": coach_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    db.video_reviews.update_one(
        {"id": review_id},
        {"$set": {
            "feedback": req.feedback.dict(),
            "status": "under_review"
        }}
    )
    persist_mock_db()
    return {"message": "Draft saved successfully"}

@router.post("/reviews/{review_id}/submit")
def submit_coach_review(review_id: str, req: SubmitReviewRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    review = db.video_reviews.find_one({"id": review_id, "coach_id": coach_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    fb = req.feedback
    if not fb.overall_assessment or not fb.overall_assessment.strip():
        raise HTTPException(status_code=400, detail="Overall Assessment is required")
    if not fb.technical_mistakes or not fb.technical_mistakes.strip():
        raise HTTPException(status_code=400, detail="Technical Mistakes is required")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    db.video_reviews.update_one(
        {"id": review_id},
        {"$set": {
            "feedback": fb.dict(),
            "status": "completed",
            "completed_at": now_iso
        }}
    )
    
    # Check if earning already exists for this review to prevent duplicates
    existing_earn = db.earnings.find_one({"review_id": review_id})
    if not existing_earn:
        player = db.users.find_one({"id": review.get("player_id")})
        player_name = player.get("name", "Player") if player else "Player"
        db.earnings.insert_one({
            "id": f"earn_{uuid.uuid4().hex[:10]}",
            "coach_id": coach_id,
            "review_id": review_id,
            "player_name": player_name,
            "amount": 150,
            "status": "approved",
            "created_at": now_iso
        })
        
    # Notify the player
    rev_type = review.get("review_type", "cricket")
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": review.get("player_id"),
        "title": f"Your {rev_type} review is ready",
        "body": f"Coach {current_user.get('name', 'Your coach')} has completed your review with detailed feedback.",
        "read": False,
        "created_at": now_iso
    })
    
    persist_mock_db()
    return {"message": "Review submitted successfully"}

@router.get("/earnings")
def get_coach_earnings(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    earnings = list(db.earnings.find({"coach_id": coach_id}))
    
    total_earned = sum(e.get("amount", 0) for e in earnings)
    reviews_completed = len(earnings)
    rate_per_review = 150
    
    logs = []
    for e in earnings:
        e_dict = dict(e)
        e_dict.pop("_id", None)
        logs.append(e_dict)
        
    return {
        "total": total_earned,
        "reviews_completed": reviews_completed,
        "rate_per_review": rate_per_review,
        "earnings_log": logs
    }

@router.get("/ratings")
def get_coach_ratings(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    coach_prof = db.coaches.find_one({"user_id": coach_id}) or {}
    
    # Get reviews with ratings
    rated_reviews = list(db.video_reviews.find({
        "coach_id": coach_id,
        "rating": {"$ne": None}
    }))
    
    ratings_list = []
    for r in rated_reviews:
        player = db.users.find_one({"id": r.get("player_id")})
        first_name = player.get("name", "Player").split(" ")[0] if player else "Player"
        ratings_list.append({
            "stars": r.get("rating"),
            "comment": r.get("rating_comment", ""),
            "player_first_name": first_name,
            "date": r.get("completed_at") or r.get("submitted_at")
        })
        
    return {
        "rating_avg": coach_prof.get("rating_avg"),
        "rating_count": coach_prof.get("rating_count", len(rated_reviews)),
        "ratings_log": ratings_list
    }

@router.get("/profile")
def get_coach_profile(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    coach_prof = db.coaches.find_one({"user_id": coach_id}) or {}
    coach_prof.pop("_id", None)
    
    return {
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "specialty": coach_prof.get("specialty", "Batting Coach"),
        "bio": coach_prof.get("bio", coach_prof.get("biography", "")),
        "biography": coach_prof.get("biography", coach_prof.get("bio", "")),
        "city": coach_prof.get("city", current_user.get("location", "")),
        "years_experience": coach_prof.get("years_experience", 10),
        "qualifications": coach_prof.get("qualifications", "Certified Level 3 Master Cricket Coach"),
        "specializations": coach_prof.get("specializations", ["Batting", "Technique"]),
        "rating_avg": coach_prof.get("rating_avg", 4.9),
        "rating_count": coach_prof.get("rating_count", 12),
        "photo_url": coach_prof.get("photo_url") or coach_prof.get("image_url") or current_user.get("photo_url", "")
    }

@router.put("/profile")
def update_coach_profile(req: UpdateCoachProfileRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    
    # Sync with users collection
    user_updates = {}
    if "name" in update_data and update_data["name"]:
        user_updates["name"] = update_data["name"].strip()
    if "city" in update_data and update_data["city"]:
        user_updates["location"] = update_data["city"].strip()
    if "photo_url" in update_data:
        user_updates["photo_url"] = update_data["photo_url"]
        update_data["image_url"] = update_data["photo_url"]
    if "bio" in update_data:
        update_data["biography"] = update_data["bio"]
    elif "biography" in update_data:
        update_data["bio"] = update_data["biography"]
        
    if user_updates:
        db.users.update_one({"id": coach_id}, {"$set": user_updates})
        
    if update_data:
        db.coaches.update_one({"user_id": coach_id}, {"$set": update_data}, upsert=True)
    persist_mock_db()
    
    # Return updated profile
    updated_coach = db.coaches.find_one({"user_id": coach_id}) or {}
    updated_user = db.users.find_one({"id": coach_id}) or {}
    return {
        "message": "Profile updated successfully",
        "profile": {
            "name": updated_user.get("name"),
            "email": updated_user.get("email"),
            "specialty": updated_coach.get("specialty", "Batting Coach"),
            "bio": updated_coach.get("bio", ""),
            "city": updated_coach.get("city", ""),
            "years_experience": updated_coach.get("years_experience", 10),
            "qualifications": updated_coach.get("qualifications", "Certified Level 3 Master Cricket Coach"),
            "photo_url": updated_coach.get("photo_url", "")
        }
    }

# ==================== ANNOUNCEMENTS ====================

@router.get("/announcements")
def get_coach_announcements(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    announcements = list(db.announcements.find({"coach_id": coach_id}).sort("created_at", -1))
    result = []
    for a in announcements:
        a_dict = dict(a)
        a_dict.pop("_id", None)
        # count how many players read this announcement
        read_count = db.announcement_reads.count_documents({"announcement_id": a_dict["id"]})
        a_dict["read_count"] = read_count
        result.append(a_dict)
    return result

@router.post("/announcements")
def create_announcement(req: CreateAnnouncementRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    if not req.title.strip() or not req.message.strip():
        raise HTTPException(status_code=400, detail="Title and message are required.")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    announcement_id = f"ann_{uuid.uuid4().hex[:10]}"
    
    new_ann = {
        "id": announcement_id,
        "coach_id": coach_id,
        "title": req.title.strip(),
        "message": req.message.strip(),
        "audience": req.audience,
        "target_player_ids": req.target_player_ids or [],
        "category": req.category or "General",
        "status": req.status,
        "published_at": now_iso if req.status == "published" else None,
        "scheduled_at": req.scheduled_at,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    db.announcements.insert_one(new_ann)
    
    # If published, notify players in the audience
    if req.status == "published":
        recipient_query = {"role": "player"}
        if req.audience == "selected" and req.target_player_ids:
            recipient_query["id"] = {"$in": req.target_player_ids}
        
        target_players = list(db.users.find(recipient_query))
        coach_name = current_user.get("name", "Coach")
        for p in target_players:
            sub = db.subscriptions.find_one({"user_id": p["id"], "status": "active"})
            if sub:
                db.notifications.insert_one({
                    "id": f"notif_{uuid.uuid4().hex[:10]}",
                    "user_id": p["id"],
                    "title": f"Coach Announcement: {req.title.strip()}",
                    "body": f"Coach {coach_name} posted a new announcement.",
                    "read": False,
                    "created_at": now_iso
                })
                
    persist_mock_db()
    clean_ann = dict(new_ann)
    clean_ann.pop("_id", None)
    return clean_ann

@router.put("/announcements/{announcement_id}")
def update_announcement(announcement_id: str, req: UpdateAnnouncementRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    ann = db.announcements.find_one({"id": announcement_id, "coach_id": coach_id})
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found or not owned by you.")
        
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if req.status == "published" and ann.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
        
    db.announcements.update_one({"id": announcement_id}, {"$set": update_data})
    persist_mock_db()
    
    updated = db.announcements.find_one({"id": announcement_id})
    u_dict = dict(updated)
    u_dict.pop("_id", None)
    return u_dict

@router.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    ann = db.announcements.find_one({"id": announcement_id, "coach_id": coach_id})
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found or not owned by you.")
        
    db.announcements.delete_one({"id": announcement_id})
    db.announcement_reads.delete_many({"announcement_id": announcement_id})
    persist_mock_db()
    return {"message": "Announcement deleted successfully."}

@router.post("/announcements/{announcement_id}/publish")
def toggle_publish_announcement(announcement_id: str, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    ann = db.announcements.find_one({"id": announcement_id, "coach_id": coach_id})
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found or not owned by you.")
        
    new_status = "draft" if ann.get("status") == "published" else "published"
    now_iso = datetime.now(timezone.utc).isoformat()
    update_data = {"status": new_status, "updated_at": now_iso}
    if new_status == "published" and not ann.get("published_at"):
        update_data["published_at"] = now_iso
        
    db.announcements.update_one({"id": announcement_id}, {"$set": update_data})
    persist_mock_db()
    return {"message": f"Announcement marked as {new_status}.", "status": new_status}

@router.get("/announcement-recipients")
def get_announcement_recipients(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    active_subs = list(db.subscriptions.find({"status": "active"}))
    sub_user_ids = set(s.get("user_id") for s in active_subs if s.get("user_id"))
    
    reviews = list(db.video_reviews.find({"coach_id": coach_id}))
    threads = list(db.message_threads.find({"coach_id": coach_id}))
    player_ids = sub_user_ids.union(set(r.get("player_id") for r in reviews)).union(set(t.get("player_id") for t in threads))
    
    players = list(db.users.find({"role": "player", "id": {"$in": list(player_ids)}}))
    result = []
    for p in players:
        p_clean = {
            "id": p["id"],
            "name": p.get("name", "Player"),
            "email": p.get("email", ""),
            "playing_role": p.get("playing_role", "Batter"),
            "location": p.get("location", ""),
            "photo_url": p.get("photo_url")
        }
        result.append(p_clean)
    return result

@router.get("/threads")
def get_coach_threads(current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    threads = list(db.message_threads.find({"coach_id": coach_id}))
    result = []
    for t in threads:
        t_dict = dict(t)
        t_dict.pop("_id", None)
        
        player = db.users.find_one({"id": t_dict.get("player_id")})
        t_dict["player_name"] = player.get("name", "Player") if player else "Player"
        
        # Last message
        last_msg = db.messages.find_one(
            {"thread_id": t_dict["id"]},
            sort=[("created_at", -1)]
        )
        t_dict["last_message"] = last_msg.get("body", "") if last_msg else ""
        
        # Unread count
        unread = db.messages.count_documents({
            "thread_id": t_dict["id"],
            "sender_id": {"$ne": coach_id},
            "read": False
        })
        t_dict["has_unread"] = unread > 0
        
        result.append(t_dict)
    return result

@router.get("/threads/{thread_id}/messages")
def get_coach_thread_messages(thread_id: str, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    thread = db.message_threads.find_one({"id": thread_id, "coach_id": coach_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    # Mark messages as read
    db.messages.update_many(
        {"thread_id": thread_id, "sender_id": {"$ne": coach_id}},
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
def send_coach_message(thread_id: str, req: SendMessageRequest, current_user: dict = Depends(require_coach)):
    coach_id = current_user["id"]
    thread = db.message_threads.find_one({"id": thread_id, "coach_id": coach_id})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    msg_id = f"msg_{uuid.uuid4().hex[:10]}"
    new_msg = {
        "id": msg_id,
        "thread_id": thread_id,
        "sender_id": coach_id,
        "body": req.body.strip(),
        "created_at": now_iso,
        "read": False
    }
    db.messages.insert_one(new_msg)
    db.message_threads.update_one({"id": thread_id}, {"$set": {"last_message_at": now_iso}})
    
    # Notify player
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": thread.get("player_id"),
        "title": "New Message from Coach",
        "body": f"Coach {current_user.get('name', 'Rahul')} sent you a message.",
        "read": False,
        "created_at": now_iso
    })
    
    persist_mock_db()
    clean_msg = dict(new_msg)
    clean_msg.pop("_id", None)
    return clean_msg
