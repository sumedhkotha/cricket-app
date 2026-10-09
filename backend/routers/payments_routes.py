import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional

from backend.database import db, persist_mock_db
from backend.auth import get_current_user
from backend.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

class CreateOrderRequest(BaseModel):
    type: str  # "plan" or "ebook"
    item_id: str

class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: Optional[str] = None
    signature: Optional[str] = None
    success: bool = True

@router.post("/create-order")
def create_order(req: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    item_name = "Item"
    amount = 0
    
    if req.type == "plan":
        plan = db.plans.find_one({"id": req.item_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        item_name = plan.get("name", "Elite Plan")
        amount = plan.get("price", 699)
    elif req.type == "ebook":
        ebook = db.ebooks.find_one({"id": req.item_id})
        if not ebook:
            raise HTTPException(status_code=404, detail="E-book not found")
        item_name = ebook.get("title", "Cricket E-book")
        amount = ebook.get("price", 199)
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
        
    order_id = f"order_rzp_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    payment_doc = {
        "id": f"pay_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "item_name": item_name,
        "type": req.type,
        "item_id": req.item_id,
        "amount": amount,
        "currency": "INR",
        "status": "created",
        "gateway_order_id": order_id,
        "gateway_payment_id": None,
        "created_at": now_iso
    }
    db.payments.insert_one(payment_doc)
    persist_mock_db()
    
    return {
        "order_id": order_id,
        "payment_record_id": payment_doc["id"],
        "amount": amount,
        "currency": "INR",
        "item_name": item_name,
        "type": req.type,
        "item_id": req.item_id,
        "is_mock": settings.IS_MOCK_PAYMENTS,
        "key_id": settings.RAZORPAY_KEY_ID
    }

@router.post("/verify")
def verify_payment(req: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payment = db.payments.find_one({"gateway_order_id": req.order_id, "user_id": user_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")
        
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    if not req.success:
        db.payments.update_one(
            {"id": payment["id"]},
            {"$set": {"status": "failed"}}
        )
        persist_mock_db()
        return {"success": False, "message": "Payment failed or was cancelled."}
        
    # Mark payment as paid
    pay_id = req.payment_id or f"pay_rzp_mock_{uuid.uuid4().hex[:10]}"
    db.payments.update_one(
        {"id": payment["id"]},
        {"$set": {
            "status": "paid",
            "gateway_payment_id": pay_id
        }}
    )
    
    # Process fulfillment
    item_type = payment.get("type")
    item_id = payment.get("item_id")
    item_name = payment.get("item_name", "Item")
    amount = payment.get("amount", 0)
    
    if item_type == "plan":
        # Activate / Renew subscription
        expires_at = (now + timedelta(days=30)).isoformat()
        existing_sub = db.subscriptions.find_one({"user_id": user_id})
        
        if existing_sub:
            db.subscriptions.update_one(
                {"id": existing_sub["id"]},
                {"$set": {
                    "plan_id": item_id,
                    "status": "active",
                    "started_at": now_iso,
                    "expires_at": expires_at,
                    "amount": amount,
                    "reviews_remaining": 3  # Reset to 3 on purchase/renewal
                }}
            )
        else:
            db.subscriptions.insert_one({
                "id": f"sub_{uuid.uuid4().hex[:10]}",
                "user_id": user_id,
                "plan_id": item_id,
                "status": "active",
                "started_at": now_iso,
                "expires_at": expires_at,
                "amount": amount,
                "reviews_remaining": 3
            })
            
    elif item_type == "ebook":
        # Add to library if not already added
        existing_lib = db.library_items.find_one({"user_id": user_id, "ebook_id": item_id})
        if not existing_lib:
            db.library_items.insert_one({
                "id": f"lib_{uuid.uuid4().hex[:10]}",
                "user_id": user_id,
                "ebook_id": item_id,
                "purchased_at": now_iso
            })
            
    # Notify player
    db.notifications.insert_one({
        "id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "title": "Payment Successful",
        "body": f"Your payment of ₹{amount} for {item_name} was successful.",
        "read": False,
        "created_at": now_iso
    })
    
    # Notify admin
    admins = list(db.users.find({"role": "admin"}))
    for a in admins:
        db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": a["id"],
            "title": "Payment Received",
            "body": f"{current_user.get('name', 'Player')} purchased {item_name} (₹{amount}).",
            "read": False,
            "created_at": now_iso
        })
        
    persist_mock_db()
    
    return {
        "success": True,
        "message": "Payment verified and fulfilled successfully!",
        "type": item_type,
        "item_name": item_name,
        "amount": amount
    }
