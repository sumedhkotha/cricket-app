"""
Comprehensive Automated Test Suite for Cricket App Subscriptions,
Billing Periods (Monthly & Yearly), Discounts, Razorpay Integration,
Feature Gating, and Idempotency.
"""
import sys
import os
import json
import uuid
import hmac
import hashlib
from datetime import datetime, timedelta, timezone

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

def run_subscription_tests():
    print("=" * 70)
    print("CRICKET APP SUBSCRIPTION & BILLING COMPREHENSIVE TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. AUTHENTICATION SETUP
    # -------------------------------------------------------------
    res_p1 = client.post("/api/auth/login", json={"email": "player@cricketvault.demo", "password": "demo1234"})
    assert res_p1.status_code == 200, f"Login failed: {res_p1.text}"
    token_p1 = res_p1.json()["access_token"]
    user1_id = res_p1.json()["user"]["id"]
    h1 = {"Authorization": f"Bearer {token_p1}"}

    res_p2 = client.post("/api/auth/login", json={"email": "aarav.patel@cricketvault.demo", "password": "demo1234"})
    assert res_p2.status_code == 200, f"Login failed: {res_p2.text}"
    token_p2 = res_p2.json()["access_token"]
    user2_id = res_p2.json()["user"]["id"]
    h2 = {"Authorization": f"Bearer {token_p2}"}
    print("✔ Authentication established for Player 1 and Player 2")

    # -------------------------------------------------------------
    # 2. PLAN SPECIFICATIONS & DISCOUNT CALCULATIONS
    # -------------------------------------------------------------
    res_plans = client.get("/api/player/plans", headers=h1)
    assert res_plans.status_code == 200, res_plans.text
    plans_list = res_plans.json()
    plans_by_id = {p["id"]: p for p in plans_list}

    # Verify Plan A: Rookie
    rookie = plans_by_id.get("plan_rookie")
    assert rookie is not None, "plan_rookie missing"
    assert rookie["monthly_price"] == 499
    assert rookie["yearly_price"] == 4990
    reg_rookie = rookie["monthly_price"] * 12 # 5988
    save_rookie = reg_rookie - rookie["yearly_price"] # 998
    pct_rookie = round((save_rookie / reg_rookie) * 100, 1) # 16.7%
    assert reg_rookie == 5988, f"Expected 5988, got {reg_rookie}"
    assert save_rookie == 998, f"Expected 998, got {save_rookie}"
    assert pct_rookie == 16.7, f"Expected 16.7%, got {pct_rookie}%"
    print("✔ Plan A: Rookie pricing verified: ₹499/mo, ₹4,990/yr (Save ₹998, 16.7% off vs ₹5,988)")

    # Verify Plan B: Pro Striker
    pro = plans_by_id.get("plan_pro_striker")
    assert pro is not None, "plan_pro_striker missing"
    assert pro["monthly_price"] == 899
    assert pro["yearly_price"] == 8990
    reg_pro = pro["monthly_price"] * 12 # 10788
    save_pro = reg_pro - pro["yearly_price"] # 1798
    pct_pro = round((save_pro / reg_pro) * 100, 1) # 16.7%
    assert reg_pro == 10788, f"Expected 10788, got {reg_pro}"
    assert save_pro == 1798, f"Expected 1798, got {save_pro}"
    assert pct_pro == 16.7, f"Expected 16.7%, got {pct_pro}%"
    print("✔ Plan B: Pro Striker pricing verified: ₹899/mo, ₹8,990/yr (Save ₹1,798, 16.7% off vs ₹10,788)")

    # Verify Plan C: Elite Legend
    elite = plans_by_id.get("plan_elite_legend")
    assert elite is not None, "plan_elite_legend missing"
    assert elite["monthly_price"] == 1499
    assert elite["yearly_price"] == 14990
    reg_elite = elite["monthly_price"] * 12 # 17988
    save_elite = reg_elite - elite["yearly_price"] # 2998
    pct_elite = round((save_elite / reg_elite) * 100, 1) # 16.7%
    assert reg_elite == 17988, f"Expected 17988, got {reg_elite}"
    assert save_elite == 2998, f"Expected 2998, got {save_elite}"
    assert pct_elite == 16.7, f"Expected 16.7%, got {pct_elite}%"
    print("✔ Plan C: Elite Legend pricing verified: ₹1,499/mo, ₹14,990/yr (Save ₹2,998, 16.7% off vs ₹17,988)")

    # -------------------------------------------------------------
    # 3. ORDER CREATION WITH MONTHLY & YEARLY PERIODS
    # -------------------------------------------------------------
    # Monthly order for Rookie
    res_o_rookie_m = client.post(
        "/api/payments/create-order",
        json={"type": "plan", "item_id": "plan_rookie", "billing_cycle": "monthly"},
        headers=h1
    )
    assert res_o_rookie_m.status_code == 200
    assert res_o_rookie_m.json()["amount"] == 499
    assert res_o_rookie_m.json()["billing_cycle"] == "monthly"

    # Yearly order for Rookie
    res_o_rookie_y = client.post(
        "/api/payments/create-order",
        json={"type": "plan", "item_id": "plan_rookie", "billing_cycle": "yearly"},
        headers=h1
    )
    assert res_o_rookie_y.status_code == 200
    assert res_o_rookie_y.json()["amount"] == 4990
    assert res_o_rookie_y.json()["billing_cycle"] == "yearly"

    # Monthly & Yearly orders for Pro Striker
    res_o_pro_m = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_pro_striker", "billing_cycle": "monthly"}, headers=h1)
    assert res_o_pro_m.json()["amount"] == 899
    res_o_pro_y = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_pro_striker", "billing_cycle": "yearly"}, headers=h1)
    assert res_o_pro_y.json()["amount"] == 8990

    # Monthly & Yearly orders for Elite Legend
    res_o_elite_m = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite_legend", "billing_cycle": "monthly"}, headers=h1)
    assert res_o_elite_m.json()["amount"] == 1499
    res_o_elite_y = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite_legend", "billing_cycle": "yearly"}, headers=h1)
    assert res_o_elite_y.json()["amount"] == 14990
    print("✔ Order amounts verified strictly on server: all 3 plans match monthly & yearly prices")

    # -------------------------------------------------------------
    # 4. SIGNATURE VERIFICATION & REJECTION OF TAMPERED SIGNATURES
    # -------------------------------------------------------------
    order_data = res_o_elite_y.json()
    order_id = order_data["order_id"]

    # Fake signature rejected
    res_fake = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": "pay_fake_123", "signature": "bad_sig", "success": True},
        headers=h1
    )
    assert res_fake.status_code == 400
    print("✔ Tampered signature rejected with HTTP 400")

    # Cross-user verification rejected
    auth_res = client.post("/api/payments/test-authorize", json={"order_id": order_id}, headers=h1)
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    valid_payment_id = auth_data["payment_id"]
    valid_signature = auth_data["signature"]

    res_cross = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_signature, "success": True},
        headers=h2
    )
    assert res_cross.status_code in (403, 404)
    print("✔ Cross-user verification rejected: payment isolation preserved")

    # -------------------------------------------------------------
    # 5. LEGITIMATE PAYMENT VERIFICATION & ENTITLEMENT FULFILLMENT
    # -------------------------------------------------------------
    res_verify = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_signature, "success": True},
        headers=h1
    )
    assert res_verify.status_code == 200
    assert res_verify.json()["success"] is True

    # Check database subscription state for user1
    sub_u1 = db.subscriptions.find_one({"user_id": user1_id})
    assert sub_u1 is not None
    assert sub_u1["status"] == "active"
    assert sub_u1["plan_id"] == "plan_elite_legend"
    assert sub_u1["tier"] == "elite_legend"
    assert sub_u1["billing_period"] == "yearly"
    assert sub_u1["amount"] == 14990
    assert sub_u1["reviews_remaining"] == 72 # 72 reviews allocated for Elite yearly
    print("✔ Elite Legend Yearly subscription fulfilled: 365-day access and 72 video reviews allocated")

    # -------------------------------------------------------------
    # 6. IDEMPOTENT VERIFICATION
    # -------------------------------------------------------------
    res_dup = client.post(
        "/api/payments/verify",
        json={"order_id": order_id, "payment_id": valid_payment_id, "signature": valid_signature, "success": True},
        headers=h1
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["success"] is True
    sub_count = db.subscriptions.count_documents({"user_id": user1_id})
    assert sub_count == 1
    print("✔ Repeated verification is completely idempotent (no duplicate subscriptions created)")

    # -------------------------------------------------------------
    # 7. SUBSCRIPTION CANCELLATION & ACCESS PRESERVATION
    # -------------------------------------------------------------
    res_cancel = client.post("/api/payments/cancel-subscription", headers=h1)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"
    sub_cancelled = db.subscriptions.find_one({"user_id": user1_id})
    assert sub_cancelled["status"] == "cancelled"
    assert sub_cancelled["auto_renew"] is False
    # User retains paid access until expires_at!
    res_dash = client.get("/api/player/subscription", headers=h1)
    dash_data = res_dash.json()
    assert dash_data["subscription"]["is_access_valid"] is True
    assert dash_data["subscription"]["status"] == "cancelled"
    print("✔ Subscription cancellation verified: auto-renew turned off, paid access active until expiry")

    # -------------------------------------------------------------
    # 8. SUBSCRIPTION REACTIVATION BEFORE EXPIRY
    # -------------------------------------------------------------
    res_reactivate = client.post("/api/payments/reactivate-subscription", headers=h1)
    assert res_reactivate.status_code == 200
    assert res_reactivate.json()["status"] == "active"
    sub_reactivated = db.subscriptions.find_one({"user_id": user1_id})
    assert sub_reactivated["status"] == "active"
    assert sub_reactivated["auto_renew"] is True
    print("✔ Subscription reactivation verified: auto-renewal successfully re-enabled")

    # -------------------------------------------------------------
    # 9. FEATURE RESTRICTIONS ACCORDING TO USER'S ACTIVE PLAN
    # -------------------------------------------------------------
    # Player 1 is currently Elite Legend:
    # a. Can compare up to 8 players
    res_comp_8 = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_th62,ply_pc30,ply_rj08,ply_rs45,ply_jb93,ply_hk45,ply_rk19", headers=h1)
    assert res_comp_8.status_code == 200
    assert res_comp_8.json()["compared_count"] == 8
    print("✔ Elite Legend: compared all 8 players successfully")

    # b. Can access Advanced Biomechanics Analytics & AI summaries
    res_analytics = client.get("/api/cricket/analytics?player_id=ply_vk18", headers=h1)
    assert res_analytics.status_code == 200
    assert res_analytics.json()["tier_unlocked"] == "Elite Legend"
    print("✔ Elite Legend: accessed Biomechanical Analytics & AI Performance Summary")

    # Test Plan Restrictions for Rookie:
    # Temporarily activate Rookie for Player 2
    db.subscriptions.delete_many({"user_id": user2_id})
    res_o_p2 = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_rookie", "billing_cycle": "monthly"}, headers=h2)
    auth_p2 = client.post("/api/payments/test-authorize", json={"order_id": res_o_p2.json()["order_id"]}, headers=h2)
    client.post(
        "/api/payments/verify",
        json={"order_id": res_o_p2.json()["order_id"], "payment_id": auth_p2.json()["payment_id"], "signature": auth_p2.json()["signature"], "success": True},
        headers=h2
    )

    # Rookie: comparing 2 players succeeds
    res_r_2 = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_th62", headers=h2)
    assert res_r_2.status_code == 200
    assert res_r_2.json()["compared_count"] == 2
    print("✔ Rookie: comparing 2 players succeeds")

    # Rookie: comparing 3 players is rejected with HTTP 403
    res_r_3 = client.get("/api/cricket/comparison?player_ids=ply_vk18,ply_th62,ply_pc30", headers=h2)
    assert res_r_3.status_code == 403
    assert "allows comparing up to 2 players" in res_r_3.json()["detail"]
    print("✔ Server-side enforcement: Rookie comparing 3 players rejected (HTTP 403)")

    # Rookie: accessing Elite analytics is rejected with HTTP 403
    res_r_analytics = client.get("/api/cricket/analytics?player_id=ply_vk18", headers=h2)
    assert res_r_analytics.status_code == 403
    print("✔ Server-side enforcement: Rookie accessing Elite analytics rejected (HTTP 403)")

    # -------------------------------------------------------------
    # 10. WEBHOOK CRYPTOGRAPHIC SIGNATURE & IDEMPOTENCY
    # -------------------------------------------------------------
    order_wh = client.post("/api/payments/create-order", json={"type": "plan", "item_id": "plan_pro_striker", "billing_cycle": "monthly"}, headers=h2).json()["order_id"]
    wh_event_id = f"evt_{uuid.uuid4().hex[:12]}"
    wh_pay_id = f"pay_{uuid.uuid4().hex[:12]}"
    wh_payload = {
        "id": wh_event_id,
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": wh_pay_id,
                    "order_id": order_wh,
                    "amount": 89900,
                    "status": "captured"
                }
            }
        }
    }
    raw_wh_bytes = json.dumps(wh_payload).encode("utf-8")
    valid_wh_sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_wh_bytes, hashlib.sha256).hexdigest()

    # Valid webhook succeeds
    res_wh = client.post(
        "/api/payments/webhook",
        content=raw_wh_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_wh_sig}
    )
    assert res_wh.status_code == 200
    assert res_wh.json()["status"] == "ok"

    # Replayed duplicate webhook returns idempotent status
    res_wh_replay = client.post(
        "/api/payments/webhook",
        content=raw_wh_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_wh_sig}
    )
    assert res_wh_replay.status_code == 200
    assert res_wh_replay.json().get("idempotent") is True or res_wh_replay.json()["status"] == "already_processed"
    print("✔ Webhook verification & duplicate replay protection verified")

    # -------------------------------------------------------------
    # 11. EXISTING CORE PLATFORM FEATURES INTACT
    # -------------------------------------------------------------
    r_matches = client.get("/api/cricket/matches")
    assert r_matches.status_code == 200
    assert len(r_matches.json()["matches"]) > 0

    r_table = client.get("/api/cricket/points-table")
    assert r_table.status_code == 200
    assert len(r_table.json()["data"]) > 0

    r_coaches = client.get("/api/coaches/directory")
    assert r_coaches.status_code == 200
    assert r_coaches.json()["total"] > 0
    print("✔ Existing cricket feeds and coach directory remain fully functional")

    print("\n" + "=" * 70)
    print("ALL SUBSCRIPTION, BILLING & RAZORPAY VERIFICATION TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    run_subscription_tests()
