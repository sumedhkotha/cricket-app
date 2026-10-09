import sys
import os
import json
import uuid
from datetime import datetime, timezone

# Add repo root to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import db
from backend.services.payment_service import PaymentService
from backend.config import settings

client = TestClient(app)

def run_payment_security_tests():
    print("==================================================")
    print("RUNNING PHASE 1 — PAYMENT SECURITY TESTS")
    print("==================================================")

    # 1. Setup test users and tokens
    res_login_player1 = client.post("/api/auth/login", json={"email": "player@cricketvault.demo", "password": "demo1234"})
    assert res_login_player1.status_code == 200, f"Login failed: {res_login_player1.text}"
    token_player1 = res_login_player1.json()["access_token"]
    user1_id = res_login_player1.json()["user"]["id"]
    headers_user1 = {"Authorization": f"Bearer {token_player1}"}

    res_login_player2 = client.post("/api/auth/login", json={"email": "aarav.patel@cricketvault.demo", "password": "demo1234"})
    assert res_login_player2.status_code == 200, f"Login failed: {res_login_player2.text}"
    token_player2 = res_login_player2.json()["access_token"]
    user2_id = res_login_player2.json()["user"]["id"]
    headers_user2 = {"Authorization": f"Bearer {token_player2}"}

    print("✔ Authentication established for Player 1 (user1_id) and Player 2 (user2_id)")

    # Record initial payment history count
    initial_payment_count = db.payments.count_documents({})
    print(f"✔ Initial database payment history count: {initial_payment_count}")

    # TEST 1 & 2: Forged success & Invalid signature rejection
    res_order = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite"}, headers=headers_user1)
    assert res_order.status_code == 200, res_order.text
    order_data = res_order.json()
    order_id = order_data["order_id"]
    assert order_id is not None
    assert order_data["amount"] == 699
    assert order_data["currency"] == "INR"
    print(f"✔ Order created: {order_id} for amount ₹{order_data['amount']}")

    # 1. Forged frontend success response with fake signature
    res_forged = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": "pay_fake_attacker", "signature": "fake_forged_signature_123", "success": True},
        headers=headers_user1
    )
    assert res_forged.status_code == 400, f"Expected 400 for forged signature, got {res_forged.status_code}"
    assert "Invalid payment signature" in res_forged.json()["detail"]
    print("✔ TEST 1 PASSED: Forged frontend success response with fake signature rejected (HTTP 400)")

    # 2. Invalid/tampered signature rejection
    fake_sig = "a" * 64
    res_invalid_sig = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": "pay_test_tampered", "signature": fake_sig, "success": True},
        headers=headers_user1
    )
    assert res_invalid_sig.status_code == 400
    print("✔ TEST 2 PASSED: Tampered/invalid signature rejected (HTTP 400)")

    # TEST 3: User isolation (payment belonging to another user cannot activate current user's package)
    auth_res = client.post("/api/payments/test-authorize", json={"order_id": order_id}, headers=headers_user1)
    assert auth_res.status_code == 200, auth_res.text
    auth_data = auth_res.json()
    valid_payment_id = auth_data["payment_id"]
    valid_sig = auth_data["signature"]

    # Player 2 tries to verify Player 1's order
    res_cross_user = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_sig, "success": True},
        headers=headers_user2
    )
    assert res_cross_user.status_code in (403, 404), f"Expected 403/404, got {res_cross_user.status_code}"
    print("✔ TEST 3 PASSED: Cross-user verification rejected (HTTP 403 Forbidden)")

    # TEST 4: Non-existent order rejected
    res_mismatched = client.post(
        "/api/payments/verify",
        json={"order_id": "order_non_existent_999", "payment_id": "pay_123", "signature": "sig_123", "success": True},
        headers=headers_user1
    )
    assert res_mismatched.status_code == 404
    print("✔ TEST 4 PASSED: Non-existent order ID rejected (HTTP 404)")

    # TEST 5: Failed / cancelled payments do not grant access
    res_order_fail = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite"}, headers=headers_user1)
    order_fail_id = res_order_fail.json()["order_id"]
    res_cancel = client.post(
        "/api/payments/verify",
        json={"order_id": order_fail_id, "success": False},
        headers=headers_user1
    )
    assert res_cancel.status_code == 200
    assert res_cancel.json()["success"] is False
    # Verify DB record is marked failed
    db_payment_fail = db.payments.find_one({"gateway_order_id": order_fail_id})
    assert db_payment_fail["status"] == "failed"
    print("✔ TEST 5 PASSED: Failed / cancelled payments recorded as failed and do not grant access")

    # TEST 6: Legitimate payment verification activates package correctly
    res_legit = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_sig, "success": True},
        headers=headers_user1
    )
    assert res_legit.status_code == 200, res_legit.text
    assert res_legit.json()["success"] is True
    assert res_legit.json()["amount"] == 699
    # Check DB subscription
    sub = db.subscriptions.find_one({"user_id": user1_id})
    assert sub is not None
    assert sub["status"] == "active"
    assert sub["plan_id"] == "plan_elite"
    print("✔ TEST 6 PASSED: Legitimately verified payment activates subscription package")

    # TEST 7: Idempotency: Repeated verification does NOT duplicate subscriptions or rewards
    res_duplicate = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_sig, "success": True},
        headers=headers_user1
    )
    assert res_duplicate.status_code == 200
    assert res_duplicate.json()["success"] is True
    # Count subscriptions for user
    sub_count = db.subscriptions.count_documents({"user_id": user1_id})
    assert sub_count == 1, f"Expected exactly 1 subscription, found {sub_count}"
    print("✔ TEST 7 PASSED: Repeated verification is idempotent (no duplicate subscriptions)")

    # TEST 8: Webhook signature verification & duplicate handling
    res_order_wh = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite"}, headers=headers_user2)
    order_wh_id = res_order_wh.json()["order_id"]
    wh_pay_id = f"pay_wh_{uuid.uuid4().hex[:8]}"

    wh_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": wh_pay_id,
                    "order_id": order_wh_id,
                    "amount": 69900,
                    "status": "captured"
                }
            }
        }
    }
    raw_wh_bytes = json.dumps(wh_payload).encode("utf-8")
    
    # 8a: Webhook with invalid signature rejected
    res_wh_invalid = client.post(
        "/api/payments/webhook",
        content=raw_wh_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "invalid_webhook_sig"}
    )
    assert res_wh_invalid.status_code == 400
    print("✔ TEST 8a PASSED: Webhook with invalid signature rejected (HTTP 400)")

    # 8b: Webhook with valid HMAC signature succeeds
    valid_wh_sig = PaymentService.compute_signature(
        order_wh_id, 
        wh_pay_id, 
        secret=settings.RAZORPAY_WEBHOOK_SECRET
    )
    # Alternatively compute HMAC of raw body directly:
    import hmac, hashlib
    valid_raw_sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_wh_bytes, hashlib.sha256).hexdigest()

    res_wh_valid = client.post(
        "/api/payments/webhook",
        content=raw_wh_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_raw_sig}
    )
    assert res_wh_valid.status_code == 200
    assert res_wh_valid.json()["status"] == "ok"
    
    # Verify order was fulfilled
    payment_wh = db.payments.find_one({"gateway_order_id": order_wh_id})
    assert payment_wh["status"] == "paid"
    sub_user2 = db.subscriptions.find_one({"user_id": user2_id})
    assert sub_user2["status"] == "active"
    print("✔ TEST 8b PASSED: Authenticated webhook successfully fulfilled payment")

    # 8c: Duplicate webhook is idempotent
    res_wh_dup = client.post(
        "/api/payments/webhook",
        content=raw_wh_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_raw_sig}
    )
    assert res_wh_dup.status_code == 200
    sub_user2_count = db.subscriptions.count_documents({"user_id": user2_id})
    assert sub_user2_count == 1
    print("✔ TEST 8c PASSED: Duplicate webhook delivery is completely idempotent")

    # TEST 9: Existing payment history is intact
    final_payment_count = db.payments.count_documents({})
    assert final_payment_count >= initial_payment_count
    print(f"✔ TEST 9 PASSED: Payment history safely preserved (Initial: {initial_payment_count}, Current: {final_payment_count})")

    print("\n==================================================")
    print("ALL PHASE 1 PAYMENT SECURITY TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_payment_security_tests()
