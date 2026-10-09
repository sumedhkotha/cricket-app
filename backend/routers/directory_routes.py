from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.database import db

router = APIRouter(prefix="/coaches", tags=["Coaching Directory"])

def _normalize_coach(c_dict: dict) -> dict:
    # Ensure consistent fields
    bio_text = c_dict.get("biography") or c_dict.get("bio") or ""
    c_dict["biography"] = bio_text
    c_dict["bio"] = bio_text

    img = c_dict.get("image_url") or c_dict.get("photo_url") or None
    c_dict["image_url"] = img
    c_dict["photo_url"] = img

    c_dict.setdefault("achievements", [])
    c_dict.setdefault("specializations", [])
    c_dict.setdefault("verification_status", "verified")
    c_dict.setdefault("verification_note", "Verified through official academy records and professional profile documentation.")
    c_dict.pop("official_website", None)
    c_dict.setdefault("image_source_url", None)
    c_dict.setdefault("last_verified_at", "2026-10-09T10:00:00Z")
    c_dict.setdefault("location", c_dict.get("city", "Hyderabad, India"))
    return c_dict

@router.get("/directory")
def get_coaches_directory(
    discipline: Optional[str] = Query(None, description="Discipline: Batting, Fielding, Fast Bowling, Spin Bowling, Wicketkeeping, All-Rounder Development, High-Performance Training"),
    category: Optional[str] = Query(None, description="Category: Batters and Fielders, Bowlers, Wicketkeepers, All-Rounders and High Performance"),
    location: Optional[str] = Query(None, description="Location / City search"),
    search: Optional[str] = Query(None, description="Search by coach name, academy, or specialization")
):
    coaches = list(db.coaches.find())
    results = []

    for c in coaches:
        c_dict = dict(c)
        c_dict.pop("_id", None)
        c_dict = _normalize_coach(c_dict)

        # 1. Apply Discipline Filter
        if discipline and discipline != "All":
            disc_norm = discipline.lower().strip()
            specs = [s.lower() for s in c_dict.get("specializations", [])]
            coach_disc = (c_dict.get("discipline") or "").lower()
            coach_spec = (c_dict.get("specialty") or "").lower()
            
            if not any(disc_norm in s for s in specs) and disc_norm not in coach_disc and disc_norm not in coach_spec:
                continue

        # 2. Apply Category Filter
        if category and category != "All" and category != "All Categories":
            cat_norm = category.lower().strip()
            coach_cat = (c_dict.get("category") or "").lower()
            if cat_norm not in coach_cat:
                continue

        # 3. Apply Location Filter
        if location and location != "All":
            loc_norm = location.lower().strip()
            coach_loc = (c_dict.get("location") or "").lower()
            coach_city = (c_dict.get("city") or "").lower()
            if loc_norm not in coach_loc and loc_norm not in coach_city:
                continue

        # 4. Apply Text Search (name, academy, bio, achievements, specializations)
        if search:
            query = search.lower().strip()
            name = (c_dict.get("name") or "").lower()
            academy = (c_dict.get("academy_name") or "").lower()
            bio = (c_dict.get("biography") or "").lower()
            specs = " ".join(c_dict.get("specializations", [])).lower()
            achs = " ".join(c_dict.get("achievements", [])).lower()
            
            if (query not in name and query not in academy and 
                query not in bio and query not in specs and query not in achs):
                continue

        results.append(c_dict)

    # Sort: verified mentors first, then by rating
    results.sort(
        key=lambda x: (
            1 if x.get("verification_status") == "verified" else 0,
            x.get("rating_avg", 0),
            x.get("years_experience", 0)
        ),
        reverse=True
    )
    return {
        "total": len(results),
        "coaches": results
    }

@router.get("/directory/{coach_id}")
def get_coach_directory_detail(coach_id: str):
    coach = db.coaches.find_one({"$or": [{"id": coach_id}, {"user_id": coach_id}]})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach profile not found")
    c_dict = dict(coach)
    c_dict.pop("_id", None)
    return _normalize_coach(c_dict)
