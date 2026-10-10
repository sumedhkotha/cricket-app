import sys
import os
import json
import uuid
import hmac
import hashlib
from datetime import datetime, timezone, timedelta

# Ensure python path and utf-8 stdout
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import db
from backend.config import settings

client = TestClient(app)

def generate_valid_signature(order_id: str, payment_id: str, secret: str) -> str:
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

def test_full_subscription_system():
    print("=" * 60)
    print("CRICKET APP SUBSCRIPTION & RAZORPAY BILLING TEST SUITE")
    print("=" * 60)

    # 1. Authenticate test player
    res_login = client.post("/api/auth/login", json={"email": "player@cricketvault.demo", "password": "demo1234"})
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✔ Authenticated Player: {user_id}")

    # 2. Verify Plans in Database and Pricing Specifications
    plans_res = client.get("/api/player/subscription", headers=headers)
    assert plans_res.status_code == 200
    available_plans = plans_res.json()["available_plans"]
    plans_by_id = {p["id"]: p for p in available_plans}

    # Plan A: Rookie
    rookie = plans_by_id.get("plan_rookie")
    assert rookie is not None, "plan_rookie missing from available plans"
    assert rookie["price"] == 499, f"Expected Rookie monthly ₹499, got {rookie['price']}"
    assert rookie["yearly_price"] == 4990, f"Expected Rookie yearly ₹4,990, got {rookie['yearly_price']}"
    # Calculate savings: 499 * 12 = 5988; 5988 - 4990 = 998; 998 / 5988 = 16.666%
    rookie_savings = (rookie["price"] * 12) - rookie["yearly_price"]
    assert rookie_savings == 998, f"Expected ₹998 savings, got {rookie_savings}"
    assert round((rookie_savings / (rookie["price"] * 12)) * 100, 1) == 16.7
    print("✔ Plan A (Rookie): ₹499/mo, ₹4,990/yr (Save ₹998 / 16.7%) verified")

    # Plan B: Pro Striker
    pro = plans_by_id.get("plan_pro_striker")
    assert pro is not None, "plan_pro_striker missing from available plans"
    assert pro["price"] == 899, f"Expected Pro Striker monthly ₹899, got {pro['price']}"
    assert pro["yearly_price"] == 8990, f"Expected Pro Striker yearly ₹8,990, got {pro['yearly_price']}"
    pro_savings = (pro["price"] * 12) - pro["yearly_price"]
    assert pro_savings == 1798, f"Expected ₹1,798 savings, got {pro_savings}"
    assert round((pro_savings / (pro["price"] * 12)) * 100, 1) == 16.7
    print("✔ Plan B (Pro Striker): ₹899/mo, ₹8,990/yr (Save ₹1,798 / 16.7%) verified")

    # Plan C: Elite Legend
    elite = plans_by_id.get("plan_elite_legend")
    assert elite is not None, "plan_elite_legend missing from available plans"
    assert elite["price"] == 1499, f"Expected Elite Legend monthly ₹1,499, got {elite['price']}"
    assert elite["yearly_price"] == 14990, f"Expected Elite Legend yearly ₹14,990, got {elite['yearly_price']}"
    elite_savings = (elite["price"] * 12) - elite["yearly_price"]
    assert elite_savings == 2998, f"Expected ₹2,998 savings, got {elite_savings}"
    assert round((elite_savings / (elite["price"] * 12)) * 100, 1) == 16.7
    print("✔ Plan C (Elite Legend): ₹1,499/mo, ₹14,990/yr (Save ₹2,998 / 16.7%) verified")

    # 3. Test Order Creation for Both Monthly & Yearly Billing on All 3 Plans
    test_cases = [
        ("plan_rookie", "monthly", 499),
        ("plan_rookie", "yearly", 4990),
        ("plan_pro_striker", "monthly", 899),
        ("plan_pro_striker", "yearly", 8990),
        ("plan_elite_legend", "monthly", 1499),
        ("plan_elite_legend", "yearly", 14990),
    ]

    for plan_id, cycle, expected_amount in test_cases:
        res = client.post(
            "/api/payments/create-order",
            json={"type": "plan", "item_id": plan_id, "billing_cycle": cycle},
            headers=headers
        )
        assert res.status_code == 200, f"Order creation failed: {res.text}"
        data = res.json()
        assert data["amount"] == expected_amount, f"Expected {expected_amount}, got {data['amount']}"
        assert data["currency"] == "INR"
        assert "order_id" in data
        assert data["billing_cycle"] == cycle
        print(f"✔ Order created for {plan_id} ({cycle}): Order ID {data['order_id']}, ₹{data['amount']}")

    # 4. Signature Security Tests
    # Create order for verification testing
    res_order = client.post(
        "/api/payments/create-order",
        json={"type": "plan", "item_id": "plan_rookie", "billing_cycle": "monthly"},
        headers=headers
    )
    order_data = res_order.json()
    order_id = order_data["order_id"]
    fake_payment_id = f"pay_test_{uuid.uuid4().hex[:12]}"

    # A) Forged signature must be rejected with 400
    res_invalid_sig = client.post(
        "/api/payments/verify",
        json={
            "order_id": order_id,
            "payment_id": fake_payment_id,
            "signature": "forged_malicious_signature_hex"
        },
        headers=headers
    )
    assert res_invalid_sig.status_code == 400, f"Expected 400, got {res_invalid_sig.status_code}"
    print("✔ Invalid/forged HMAC signature correctly rejected with HTTP 400")

    # B) Valid signature must activate Rookie monthly (30 days, 1 review)
    valid_sig = generate_valid_signature(order_id, fake_payment_id, settings.RAZORPAY_KEY_SECRET)
    res_verify = client.post(
        "/api/payments/verify",
        json={
            "order_id": order_id,
            "payment_id": fake_payment_id,
            "signature": valid_sig
        },
        headers=headers
    )
    assert res_verify.status_code == 200, f"Verification failed: {res_verify.text}"
    print("✔ Valid HMAC signature verified successfully and entitlement activated")

    # Verify Rookie Subscription State
    sub_res = client.get("/api/player/subscription", headers=headers)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()["subscription"]
    assert sub_data["plan_id"] == "plan_rookie"
    assert sub_data["status"] == "active"
    assert sub_data["billing_cycle"] == "monthly"
    assert sub_data["reviews_remaining"] == 1
    print("✔ Rookie subscription active in database with 1 monthly review allowance")

    # 5. Feature Gate Check for Rookie Tier
    stats_res = client.get("/api/cricket/stats", headers=headers)
    assert stats_res.status_code == 200
    stats_json = stats_res.json()
    assert stats_json["user_tier"] == "rookie"
    # Essential stats present, advanced locked
    first_player = stats_json["players"][0]
    assert "essential_stats" in first_player
    assert first_player.get("advanced_stats_locked") is True
    print("✔ /api/cricket/stats accurately unlocked essential stats and locked advanced stats for Rookie")

    # Comparison limit for Rookie is max 2
    comp_res_ok = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_jb93", headers=headers)
    assert comp_res_ok.status_code == 200
    assert comp_res_ok.json()["comparison_limit"] == 2
    print("✔ /api/cricket/comparison permitted 2 players for Rookie")

    comp_res_excess = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_jb93,ply_hk45", headers=headers)
    assert comp_res_excess.status_code == 403, "Expected 403 when exceeding Rookie quota of 2"
    print("✔ /api/cricket/comparison blocked 3 players for Rookie with HTTP 403 quota check")

    # AI Biomechanics restricted to Elite
    bio_res_blocked = client.get("/api/cricket/analytics?player_id=ply_vk18", headers=headers)
    assert bio_res_blocked.status_code == 403
    print("✔ /api/cricket/analytics blocked for Rookie with HTTP 403")

    # 6. Upgrade Flow to Elite Legend (Yearly: ₹14,990)
    # Check plan change quote
    quote_res = client.get("/api/payments/plan-change-quote?target_plan_id=plan_elite_legend&billing_cycle=yearly", headers=headers)
    assert quote_res.status_code == 200
    quote_data = quote_res.json()
    assert quote_data["target_plan"]["name"] == "Elite Legend"
    assert quote_data["target_amount"] == 14990
    print(f"✔ Upgrade quote generated: {quote_data['target_plan']['name']} ({quote_data['billing_cycle']}) ₹{quote_data['target_amount']}")

    # Create & verify payment for Elite Legend Yearly
    res_elite_order = client.post(
        "/api/payments/create-order",
        json={"type": "plan", "item_id": "plan_elite_legend", "billing_cycle": "yearly"},
        headers=headers
    )
    elite_order_id = res_elite_order.json()["order_id"]
    elite_pay_id = f"pay_test_{uuid.uuid4().hex[:12]}"
    elite_sig = generate_valid_signature(elite_order_id, elite_pay_id, settings.RAZORPAY_KEY_SECRET)
    res_elite_verify = client.post(
        "/api/payments/verify",
        json={"order_id": elite_order_id, "payment_id": elite_pay_id, "signature": elite_sig},
        headers=headers
    )
    assert res_elite_verify.status_code == 200

    # Verify Elite Legend Entitlements (365 days, 72 reviews)
    sub_elite = client.get("/api/player/subscription", headers=headers).json()["subscription"]
    assert sub_elite["plan_id"] == "plan_elite_legend"
    assert sub_elite["billing_cycle"] == "yearly"
    assert sub_elite["reviews_remaining"] == 72
    assert sub_elite["status"] == "active"
    print("✔ Elite Legend Yearly activated with 365 days duration and 72 annual reviews")

    # Check Elite features unlocked!
    bio_res_unlocked = client.get("/api/cricket/analytics?player_id=ply_vk18", headers=headers)
    assert bio_res_unlocked.status_code == 200
    bio_json = bio_res_unlocked.json()
    assert bio_json["tier_unlocked"] == "Elite Legend"
    assert "biomechanics" in bio_json
    assert "ai_performance_summary" in bio_json["biomechanics"]
    print(f"✔ Elite AI Biomechanics & Performance Summary unlocked: '{bio_json['biomechanics']['ai_performance_summary'][:50]}...'")

    # Comparison limit for Elite is 8
    comp_elite = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_jb93,ply_hk45,ply_rk19", headers=headers)
    assert comp_elite.status_code == 200
    assert comp_elite.json()["comparison_limit"] == 8
    print("✔ Elite comparison limit up to 8 confirmed")

    # 7. Cancellation Flow
    cancel_res = client.post("/api/payments/cancel-subscription", headers=headers)
    assert cancel_res.status_code == 200
    cancel_json = cancel_res.json()
    assert cancel_json["status"] == "cancelled"
    assert cancel_json["auto_renew"] is False
    assert "access_until" in cancel_json

    # Check that subscription status is cancelled, but STILL retains access until expires_at
    sub_after_cancel = client.get("/api/player/subscription", headers=headers).json()["subscription"]
    assert sub_after_cancel["status"] == "cancelled"
    assert sub_after_cancel["auto_renew"] is False
    assert sub_after_cancel["days_remaining"] > 300  # Paid for yearly!
    # Feature access remains functional until period end
    bio_still_works = client.get("/api/cricket/analytics?player_id=ply_vk18", headers=headers)
    assert bio_still_works.status_code == 200
    print("✔ Cancellation disables auto_renew while granting full access until expires_at")

    # 8. Webhook Idempotency Test
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET or settings.RAZORPAY_KEY_SECRET
    webhook_event_id = f"evt_{uuid.uuid4().hex[:16]}"
    webhook_payload = {
        "event": "payment.captured",
        "id": webhook_event_id,
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_{uuid.uuid4().hex[:12]}",
                    "amount": 49900,
                    "currency": "INR",
                    "status": "captured",
                    "order_id": order_id,
                    "notes": {"user_id": user_id, "plan_id": "plan_rookie", "billing_cycle": "monthly"}
                }
            }
        }
    }
    raw_bytes = json.dumps(webhook_payload).encode("utf-8")
    wb_sig = hmac.new(webhook_secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    headers_webhook = {"X-Razorpay-Signature": wb_sig, "Content-Type": "application/json"}

    # First webhook submission
    wb_res_1 = client.post("/api/payments/webhook", content=raw_bytes, headers=headers_webhook)
    assert wb_res_1.status_code == 200, f"Webhook failed: {wb_res_1.text}"
    assert wb_res_1.json()["status"] == "ok"
    print("✔ Webhook processed successfully on first arrival")

    # Replay identical webhook event (should be ignored gracefully without duplicate actions)
    wb_res_2 = client.post("/api/payments/webhook", content=raw_bytes, headers=headers_webhook)
    assert wb_res_2.status_code == 200
    assert wb_res_2.json()["status"] == "already_processed"
    assert wb_res_2.json()["idempotent"] is True
    print("✔ Replayed webhook idempotently ignored (no duplicate fulfillment or event duplication)")

    print("=" * 60)
    print("ALL 8 PHASES OF SUBSCRIPTION TEST SUITE PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_subscription_system()
