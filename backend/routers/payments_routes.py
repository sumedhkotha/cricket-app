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
    billing_cycle: Optional[str] = "monthly"  # "monthly" or "yearly"
    interval: Optional[str] = None  # alias for billing_cycle

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
    billing_cycle = req.billing_cycle or "monthly"
    
    # Calculate price strictly on the backend
    if req.type == "plan":
        plan = db.plans.find_one({"id": req.item_id})
        if not plan and req.item_id == "plan_elite":
            plan = db.plans.find_one({"id": "plan_elite_legend"})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
            
        is_yearly = billing_cycle == "yearly"
        if is_yearly:
            amount = int(plan.get("yearly_price", plan.get("price", 499) * 10))
            item_name = f"{plan.get('name', 'Plan')} (Annual)"
        else:
            amount = int(plan.get("monthly_price", plan.get("price", 499)))
            item_name = f"{plan.get('name', 'Plan')} (Monthly)"
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
        notes={
            "user_id": str(user_id),
            "type": str(req.type),
            "item_id": str(req.item_id),
            "billing_cycle": str(billing_cycle)
        }
    )
    
    order_id = rzp_order["order_id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    
    payment_doc = {
        "id": payment_record_id,
        "user_id": user_id,
        "item_name": item_name,
        "type": req.type,
        "item_id": req.item_id,
        "billing_period": billing_cycle,
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
        "billing_cycle": billing_cycle,
        "billing_period": billing_cycle,
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
    if not settings.IS_MOCK_PAYMENTS and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_"):
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
    Supports monthly and yearly duration and plan allowances.
    """
    user_id = user["id"]
    item_type = payment.get("type")
    item_id = payment.get("item_id")
    item_name = payment.get("item_name", "Item")
    amount = payment.get("amount", 0)
    billing_period = payment.get("billing_period", "monthly")
    
    if item_type == "plan":
        is_yearly = billing_period == "yearly"
        duration_days = 365 if is_yearly else 30
        expires_at = (now + timedelta(days=duration_days)).isoformat()
        
        plan = db.plans.find_one({"id": item_id})
        if not plan and item_id == "plan_elite":
            plan = db.plans.find_one({"id": "plan_elite_legend"})
            
        plan_name = plan.get("name", "Cricket Plan") if plan else "Cricket Plan"
        tier = plan.get("tier", "rookie") if plan else "rookie"
        
        if is_yearly:
            reviews_count = plan.get("reviews_yearly", plan.get("reviews_monthly", 1) * 12) if plan else 12
        else:
            reviews_count = plan.get("reviews_monthly", 1) if plan else 1
            
        existing_sub = db.subscriptions.find_one({"user_id": user_id})
        sub_fields = {
            "plan_id": item_id,
            "plan_name": plan_name,
            "tier": tier,
            "billing_period": billing_period,
            "billing_cycle": billing_period,
            "status": "active",
            "started_at": now_iso,
            "expires_at": expires_at,
            "next_billing_date": expires_at,
            "auto_renew": True,
            "amount": amount,
            "currency": "INR",
            "reviews_remaining": reviews_count,
            "reviews_total": reviews_count,
            "gateway_order_id": payment.get("gateway_order_id"),
            "gateway_payment_id": payment.get("gateway_payment_id"),
            "updated_at": now_iso
        }
        
        if existing_sub:
            db.subscriptions.update_one(
                {"id": existing_sub["id"]},
                {"$set": sub_fields}
            )
        else:
            sub_fields["id"] = f"sub_{uuid.uuid4().hex[:10]}"
            sub_fields["user_id"] = user_id
            db.subscriptions.insert_one(sub_fields)
            
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

@router.post("/cancel-subscription")
def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """
    Cancels auto-renewal while keeping active entitlement valid until expires_at.
    """
    user_id = current_user["id"]
    sub = db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found to cancel")
        
    now_iso = datetime.now(timezone.utc).isoformat()
    db.subscriptions.update_one(
        {"id": sub["id"]},
        {"$set": {
            "status": "cancelled",
            "auto_renew": False,
            "cancelled_at": now_iso,
            "updated_at": now_iso
        }}
    )
    persist_mock_db()
    return {
        "success": True,
        "message": f"Your subscription has been cancelled. You retain full access to {sub.get('plan_name')} until {sub.get('expires_at')}.",
        "expires_at": sub.get("expires_at"),
        "access_until": sub.get("expires_at"),
        "auto_renew": False,
        "status": "cancelled"
    }

@router.post("/reactivate-subscription")
def reactivate_subscription(current_user: dict = Depends(get_current_user)):
    """
    Reactivates auto-renewal for a cancelled subscription before expiration.
    """
    user_id = current_user["id"]
    sub = db.subscriptions.find_one({"user_id": user_id, "status": "cancelled"})
    if not sub:
        raise HTTPException(status_code=404, detail="No cancelled subscription found to reactivate")
        
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Verify not already expired
    expires_at_str = sub.get("expires_at")
    if expires_at_str:
        try:
            exp_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if now > exp_dt:
                raise HTTPException(status_code=400, detail="Subscription has already expired. Please purchase a new plan.")
        except HTTPException:
            raise
        except Exception:
            pass
            
    db.subscriptions.update_one(
        {"id": sub["id"]},
        {"$set": {
            "status": "active",
            "auto_renew": True,
            "reactivated_at": now_iso,
            "updated_at": now_iso
        }}
    )
    persist_mock_db()
    return {
        "success": True,
        "message": f"Your subscription to {sub.get('plan_name')} has been reactivated. Auto-renewal is enabled.",
        "expires_at": sub.get("expires_at"),
        "status": "active"
    }

@router.get("/plan-change-quote")
def get_plan_change_quote(
    target_plan_id: str,
    billing_cycle: str = "monthly",
    current_user: dict = Depends(get_current_user)
):
    """
    Calculates upgrade/downgrade quote, charges, and effective schedule.
    """
    user_id = current_user["id"]
    sub = db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    target_plan = db.plans.find_one({"id": target_plan_id})
    if not target_plan and target_plan_id == "plan_elite":
        target_plan = db.plans.find_one({"id": "plan_elite_legend"})
    if not target_plan:
        raise HTTPException(status_code=404, detail="Target plan not found")
        
    current_plan = db.plans.find_one({"id": sub.get("plan_id")}) if sub else None
    
    is_yearly = billing_cycle == "yearly"
    new_price = int(target_plan.get("yearly_price" if is_yearly else "monthly_price", target_plan.get("price", 499)))
    
    tier_order = {"free": 0, "rookie": 1, "pro_striker": 2, "elite_legend": 3}
    current_tier_val = tier_order.get(current_plan.get("tier", "free"), 0) if current_plan else 0
    target_tier_val = tier_order.get(target_plan.get("tier", "rookie"), 1)
    
    action_type = "upgrade" if target_tier_val > current_tier_val else ("downgrade" if target_tier_val < current_tier_val else "cycle_change")
    
    clean_target = dict(target_plan)
    clean_target.pop("_id", None)
    
    return {
        "current_plan_name": current_plan.get("name", "Free Tier") if current_plan else "Free Tier",
        "target_plan_name": target_plan.get("name"),
        "target_plan_id": target_plan["id"],
        "target_plan": clean_target,
        "target_amount": new_price,
        "action_type": action_type,
        "billing_cycle": billing_cycle,
        "price": new_price,
        "currency": "INR",
        "effective_date": "Immediate upon checkout",
        "explanation": (
            f"Upgrading to {target_plan.get('name')} ({billing_cycle}) will activate immediately upon verification. New charge: ₹{new_price}."
            if action_type == "upgrade"
            else f"Changing to {target_plan.get('name')} ({billing_cycle}) will update your coaching benefits. New rate: ₹{new_price}."
        )
    }

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
        
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Idempotency check for event_id
    event_id = payload.get("id") or payload.get("event_id")
    if event_id:
        existing_event = db.webhook_events.find_one({"event_id": event_id})
        if existing_event:
            return {"status": "already_processed", "event_id": event_id, "idempotent": True}
        db.webhook_events.insert_one({
            "event_id": event_id,
            "event": payload.get("event"),
            "received_at": now_iso
        })
        
    event = payload.get("event")
    
    if event in ("order.paid", "payment.captured", "subscription.charged"):
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
            
    return {"status": "ok", "event": event, "event_id": event_id}
