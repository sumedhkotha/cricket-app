import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, Header, status
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.database import db, persist_mock_db
from backend.auth import get_current_user
from backend.config import settings
from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

class CreateOrderRequest(BaseModel):
    type: str  # "plan" or "ebook"
    item_id: str

class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: Optional[str] = None
    signature: Optional[str] = None
    success: Optional[bool] = True

class TestAuthorizeRequest(BaseModel):
    order_id: str

@router.post("/create-order")
def create_order(req: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    item_name = "Item"
    amount = 0
    
    # Calculate price strictly on the backend
    if req.type == "plan":
        plan = db.plans.find_one({"id": req.item_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        item_name = plan.get("name", "Elite Plan")
        amount = int(plan.get("price", 699))
    elif req.type == "ebook":
        ebook = db.ebooks.find_one({"id": req.item_id})
        if not ebook:
            raise HTTPException(status_code=404, detail="E-book not found")
        item_name = ebook.get("title", "Cricket E-book")
        amount = int(ebook.get("price", 199))
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
        
    payment_record_id = f"pay_{uuid.uuid4().hex[:10]}"
    receipt_id = f"rzp_{uuid.uuid4().hex[:12]}"
    
    # Create order via PaymentService
    rzp_order = PaymentService.create_order(
        amount_in_inr=amount,
        receipt=receipt_id,
        notes={"user_id": user_id, "type": req.type, "item_id": req.item_id}
    )
    
    order_id = rzp_order["order_id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    
    payment_doc = {
        "id": payment_record_id,
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

@router.post("/test-authorize")
def test_authorize(req: TestAuthorizeRequest, current_user: dict = Depends(get_current_user)):
    """
    Simulates gateway authorization in test/mock mode by generating a valid test payment_id
    and computing the exact cryptographic HMAC-SHA256 signature using the server-side secret.
    Allows testing full cryptographic verification without third-party popups.
    """
    if not settings.IS_MOCK_PAYMENTS:
        raise HTTPException(status_code=403, detail="Test authorization is only permitted in mock/test mode.")
        
    payment = db.payments.find_one({"gateway_order_id": req.order_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if payment["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to order")
        
    payment_id = f"pay_test_{uuid.uuid4().hex[:14]}"
    signature = PaymentService.compute_signature(req.order_id, payment_id)
    
    return {
        "order_id": req.order_id,
        "payment_id": payment_id,
        "signature": signature
    }

@router.post("/verify")
def verify_payment(req: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payment = db.payments.find_one({"gateway_order_id": req.order_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")
        
    # Enforce order ownership
    if payment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Payment does not belong to the authenticated user")
        
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Handle user cancellation or gateway rejection
    if req.success is False:
        db.payments.update_one(
            {"id": payment["id"]},
            {"$set": {"status": "failed", "updated_at": now_iso}}
        )
        persist_mock_db()
        return {"success": False, "message": "Payment failed or was cancelled."}
        
    # Cryptographic verification requires payment_id and signature
    if not req.payment_id or not req.signature:
        raise HTTPException(
            status_code=400, 
            detail="Cryptographic verification failed: payment_id and signature are required."
        )
        
    # Idempotency check: if already verified and paid, return existing success without re-fulfillment
    if payment.get("status") == "paid":
        return {
            "success": True,
            "message": "Payment already verified and active.",
            "type": payment.get("type"),
            "item_name": payment.get("item_name"),
            "amount": payment.get("amount")
        }
        
    # Verify cryptographic signature using HMAC-SHA256
    is_valid = PaymentService.verify_payment_signature(
        order_id=req.order_id,
        payment_id=req.payment_id,
        signature=req.signature
    )
    if not is_valid:
        raise HTTPException(
            status_code=400, 
            detail="Invalid payment signature. Verification rejected."
        )
        
    # Verify expected currency and amount integrity
    if payment.get("currency") != "INR" or payment.get("amount", 0) <= 0:
        raise HTTPException(status_code=400, detail="Invalid order currency or amount")
        
    # Mark payment record as paid
    db.payments.update_one(
        {"id": payment["id"]},
        {"$set": {
            "status": "paid",
            "gateway_payment_id": req.payment_id,
            "verified_at": now_iso,
            "updated_at": now_iso
        }}
    )
    
    # Fulfill entitlement idempotently
    fulfill_entitlement(payment, current_user, now, now_iso)
    persist_mock_db()
    
    return {
        "success": True,
        "message": "Payment verified and fulfilled successfully!",
        "type": payment.get("type"),
        "item_name": payment.get("item_name"),
        "amount": payment.get("amount")
    }

def fulfill_entitlement(payment: dict, user: dict, now: datetime, now_iso: str):
    """
    Activates purchased entitlement idempotently.
    """
    user_id = user["id"]
    item_type = payment.get("type")
    item_id = payment.get("item_id")
    item_name = payment.get("item_name", "Item")
    amount = payment.get("amount", 0)
    
    if item_type == "plan":
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
                    "reviews_remaining": 3,
                    "updated_at": now_iso
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
        "body": f"Your payment of ₹{amount} for {item_name} was successful and verified.",
        "read": False,
        "created_at": now_iso
    })
    
    # Notify admins
    admins = list(db.users.find({"role": "admin"}))
    for a in admins:
        db.notifications.insert_one({
            "id": f"notif_{uuid.uuid4().hex[:10]}",
            "user_id": a["id"],
            "title": "Payment Received",
            "body": f"{user.get('name', 'Player')} purchased {item_name} (₹{amount}).",
            "read": False,
            "created_at": now_iso
        })

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Secure Razorpay Webhook Endpoint:
    Cryptographically validates raw request body HMAC-SHA256 signature against RAZORPAY_WEBHOOK_SECRET.
    Guarantees idempotent fulfillment of asynchronous events.
    """
    raw_body = await request.body()
    
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
        
    is_valid = PaymentService.verify_webhook_signature(raw_body, x_razorpay_signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")
        
    event = payload.get("event")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    if event in ("order.paid", "payment.captured"):
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")
        
        if order_id:
            payment = db.payments.find_one({"gateway_order_id": order_id})
            if payment and payment.get("status") != "paid":
                db.payments.update_one(
                    {"id": payment["id"]},
                    {"$set": {
                        "status": "paid",
                        "gateway_payment_id": payment_id,
                        "verified_at": now_iso,
                        "updated_at": now_iso
                    }}
                )
                user = db.users.find_one({"id": payment["user_id"]}) or {"id": payment["user_id"], "name": "Player"}
                fulfill_entitlement(payment, user, now, now_iso)
                persist_mock_db()
                
    elif event == "payment.failed":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id")
        if order_id:
            db.payments.update_one(
                {"gateway_order_id": order_id},
                {"$set": {"status": "failed", "updated_at": now_iso}}
            )
            persist_mock_db()
            
    return {"status": "ok", "event": event}
