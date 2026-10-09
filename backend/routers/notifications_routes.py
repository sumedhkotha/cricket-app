from datetime import datetime
from fastapi import APIRouter, Depends
from backend.database import db, persist_mock_db
from backend.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    notifications = list(db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(20))
    result = []
    for n in notifications:
        n_dict = dict(n)
        n_dict.pop("_id", None)
        result.append(n_dict)
    return result

@router.post("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    db.notifications.update_many({"user_id": user_id}, {"$set": {"read": True}})
    persist_mock_db()
    return {"message": "All notifications marked as read"}
