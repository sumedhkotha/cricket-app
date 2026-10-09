"""
End-to-End Verification Test Suite for Cricket App Requirements using requests against live backend
"""
import uuid
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("STARTING COMPLETE LIVE VERIFICATION SUITE")
    print("=" * 60)

    # 1. Verify Cricket Score routes are removed
    print("\n[TEST 1] Verifying Cricket Score routes are removed...")
    r = requests.get(f"{BASE_URL}/api/cricket/live-scores")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    r = requests.get(f"{BASE_URL}/api/cricket/matches")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("  ✓ Cricket score endpoints return 404 (successfully removed)")

    # 2. Verify Demo logins are removed
    print("\n[TEST 2] Verifying Demo Login endpoints are removed...")
    r = requests.post(f"{BASE_URL}/api/auth/demo/player")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    r = requests.post(f"{BASE_URL}/api/auth/demo/coach")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("  ✓ Demo login shortcuts return 404 (successfully removed)")

    # 3. Test Player Registration with all cricket profile fields
    print("\n[TEST 3] Testing Player Registration with all custom cricket fields...")
    unique_email = f"player_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "name": "Virat Sharma",
        "email": unique_email,
        "password": "Password123!",
        "mobile": "+91 9876543210",
        "dob": "1998-11-05",
        "city": "Bengaluru",
        "location": "Bengaluru, India",
        "playing_role": "Batter",
        "experience": "Advanced",
        "batting_style": "Right-Handed",
        "bowling_style": "Right-Arm Medium",
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register/player", json=reg_payload)
    assert r.status_code == 200, f"Register failed: {r.text}"
    reg_data = r.json()
    player_token = reg_data["token"]
    player_user = reg_data["user"]
    player_headers = {"Authorization": f"Bearer {player_token}"}
    
    assert player_user["name"] == "Virat Sharma"
    assert player_user["playing_role"] == "Batter"
    assert player_user["experience"] == "Advanced"
    assert player_user["batting_style"] == "Right-Handed"
    assert player_user["bowling_style"] == "Right-Arm Medium"
    assert player_user["dob"] == "1998-11-05"
    assert player_user["city"] == "Bengaluru"
    assert player_user["photo_url"] is not None
    print("  ✓ Player registered successfully with all profile fields saved")

    # 4. Test Player Profile Fetch and Update
    print("\n[TEST 4] Testing Player Profile Fetch & Update...")
    r = requests.get(f"{BASE_URL}/api/player/profile", headers=player_headers)
    assert r.status_code == 200
    p_prof = r.json()
    assert p_prof["name"] == "Virat Sharma"

    # Update profile
    update_payload = {
        "playing_role": "All-Rounder",
        "experience": "Intermediate",
        "batting_style": "Left-Handed",
        "bowling_style": "Left-Arm Spin",
        "city": "Mumbai",
        "location": "Mumbai, India",
        "photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
    }
    r = requests.put(f"{BASE_URL}/api/player/profile", json=update_payload, headers=player_headers)
    assert r.status_code == 200
    updated_prof = r.json()["profile"]
    assert updated_prof["playing_role"] == "All-Rounder"
    assert updated_prof["batting_style"] == "Left-Handed"
    assert updated_prof["bowling_style"] == "Left-Arm Spin"
    assert updated_prof["city"] == "Mumbai"

    # Re-fetch to ensure database persistence
    r = requests.get(f"{BASE_URL}/api/player/profile", headers=player_headers)
    refetched = r.json()
    assert refetched["playing_role"] == "All-Rounder"
    assert refetched["batting_style"] == "Left-Handed"
    assert refetched["bowling_style"] == "Left-Arm Spin"
    assert refetched["city"] == "Mumbai"
    print("  ✓ Player profile updated and persisted in database")

    # 5. Test Photo Upload Endpoint
    print("\n[TEST 5] Testing Photo Upload Endpoint (Base64)...")
    b64_payload = {
        "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    r = requests.post(f"{BASE_URL}/api/upload/photo-base64", json=b64_payload, headers=player_headers)
    assert r.status_code == 200, f"Upload failed: {r.text}"
    photo_url = r.json()["photo_url"]
    assert photo_url.startswith("/api/uploads/") or photo_url.startswith("http")
    print("  ✓ Profile photo uploaded successfully:", photo_url)

    # 6. Test Unsubscribed Player Access Gating
    print("\n[TEST 6] Testing Subscription Access Gating for Unsubscribed Player...")
    r = requests.get(f"{BASE_URL}/api/player/announcements", headers=player_headers)
    assert r.status_code == 200
    ann_resp = r.json()
    assert ann_resp.get("locked") is True, f"Expected locked=True, got {ann_resp}"
    print("  ✓ Unsubscribed player announcements is gated (locked=True)")

    # 7. Test Subscription Checkout & Verification
    print("\n[TEST 7] Testing Plan Order Creation & Verification (Razorpay flow)...")
    r = requests.post(f"{BASE_URL}/api/payments/create-order", json={"type": "plan", "item_id": "plan_elite"}, headers=player_headers)
    assert r.status_code == 200, f"Order creation failed: {r.text}"
    order_data = r.json()
    assert "order_id" in order_data
    assert order_data["amount"] == 699
    
    # Verify payment
    verify_payload = {
        "order_id": order_data["order_id"],
        "payment_id": f"pay_rzp_test_{uuid.uuid4().hex[:8]}",
        "signature": "valid_test_signature",
        "success": True
    }
    r = requests.post(f"{BASE_URL}/api/payments/verify", json=verify_payload, headers=player_headers)
    assert r.status_code == 200
    verify_data = r.json()
    assert verify_data["success"] is True
    print("  ✓ Subscription order created and payment verified by backend")

    # Verify subscription is now active and announcements unlock
    r = requests.get(f"{BASE_URL}/api/player/announcements", headers=player_headers)
    assert r.status_code == 200
    unlocked_ann = r.json()
    assert unlocked_ann.get("locked") is False, "Expected unlocked announcements after subscription"
    print("  ✓ Announcements unlocked immediately upon payment verification")

    # 8. Coach Profile Management & Announcements
    print("\n[TEST 8] Testing Coach Login & Profile Management...")
    # Login coach
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "coach@vault.com", "password": "password123"})
    assert r.status_code == 200, f"Coach login failed: {r.text}"
    coach_data = r.json()
    coach_token = coach_data["token"]
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    # Fetch coach profile
    r = requests.get(f"{BASE_URL}/api/coach/profile", headers=coach_headers)
    assert r.status_code == 200
    c_prof = r.json()

    # Update coach profile
    c_update = {
        "specialty": "Head Batting Consultant",
        "experience_years": 16,
        "qualifications": "BCCI Level 3 Certified, Former State Opener",
        "bio": "Mentoring international & domestic batters in stroke-play and mindset.",
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
    }
    r = requests.put(f"{BASE_URL}/api/coach/profile", json=c_update, headers=coach_headers)
    assert r.status_code == 200
    c_updated = r.json()["profile"]
    assert c_updated["specialty"] == "Head Batting Consultant"
    assert c_updated["experience_years"] == 16
    print("  ✓ Coach profile updated and persisted")

    # 9. Coach Announcements Lifecycle: Create, Publish, Read, Delete
    print("\n[TEST 9] Testing Coach Announcements Lifecycle...")
    # Create Announcement
    ann_create = {
        "title": "Weekend Power Hitting & Range Drill",
        "message": "Bring your match bats. We will focus on downswing trajectory and base balance.",
        "category": "Training Drills",
        "target_audience": "all_subscribers",
        "target_user_ids": [],
        "published": True
    }
    r = requests.post(f"{BASE_URL}/api/coach/announcements", json=ann_create, headers=coach_headers)
    assert r.status_code == 200, f"Announcement creation failed: {r.text}"
    new_ann = r.json()["announcement"]
    ann_id = new_ann["id"]
    assert new_ann["title"] == ann_create["title"]
    print("  ✓ Announcement created by coach (ID:", ann_id, ")")

    # Player reads announcement
    r = requests.get(f"{BASE_URL}/api/player/announcements", headers=player_headers)
    assert r.status_code == 200
    player_anns = r.json()["announcements"]
    found = [a for a in player_anns if a["id"] == ann_id]
    assert len(found) > 0, "Created announcement not found in player announcements"
    assert found[0]["is_read"] is False, "Should be initially unread"

    # Mark as read
    r = requests.post(f"{BASE_URL}/api/player/announcements/{ann_id}/read", headers=player_headers)
    assert r.status_code == 200

    # Re-fetch to check read status
    r = requests.get(f"{BASE_URL}/api/player/announcements", headers=player_headers)
    player_anns = r.json()["announcements"]
    found = [a for a in player_anns if a["id"] == ann_id]
    assert found[0]["is_read"] is True, "Announcement should be marked as read"
    print("  ✓ Announcement successfully received and marked read by player")

    # Coach unpublishes announcement
    r = requests.post(f"{BASE_URL}/api/coach/announcements/{ann_id}/publish", json={"published": False}, headers=coach_headers)
    assert r.status_code == 200

    # Player should no longer see unpublished draft
    r = requests.get(f"{BASE_URL}/api/player/announcements", headers=player_headers)
    player_anns = r.json()["announcements"]
    found = [a for a in player_anns if a["id"] == ann_id]
    assert len(found) == 0, "Unpublished announcement should not be visible to players"
    print("  ✓ Unpublished announcement is hidden from player view")

    # Coach deletes announcement
    r = requests.delete(f"{BASE_URL}/api/coach/announcements/{ann_id}", headers=coach_headers)
    assert r.status_code == 200
    print("  ✓ Announcement deleted successfully by coach")

    # 10. Verify Coach Directory has no external links
    print("\n[TEST 10] Testing Coach Directory for external website links...")
    r = requests.get(f"{BASE_URL}/api/coaches-directory")
    assert r.status_code == 200
    dir_coaches = r.json()["coaches"]
    for c in dir_coaches:
        assert "official_website" not in c or not c.get("official_website"), f"External website found in coach: {c.get('name')}"
    print("  ✓ Coach directory returned without external website URLs")

    print("\n" + "=" * 60)
    print("ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
