import uuid
from datetime import datetime, timedelta, timezone
from backend.database import db, persist_mock_db
from backend.auth import hash_password

def seed_database(force: bool = False):
    if not force and db.users.count_documents({}) > 0:
        print("Database already contains records. Skipping seed.")
        return

    print("Seeding database with Cricket Vault data and verified coaches directory...")
    # Clear existing
    for col in [
        db.users, db.coaches, db.plans, db.subscriptions, db.video_reviews,
        db.ebooks, db.library_items, db.payments, db.earnings, db.sessions,
        db.message_threads, db.messages, db.notifications,
        db.announcements, db.announcement_reads
    ]:
        col.delete_many({})

    demo_password_hash = hash_password("demo1234")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 1. ADMIN USER
    admin_id = "user_admin_01"
    admin_user = {
        "id": admin_id,
        "role": "admin",
        "name": "Platform Admin",
        "email": "admin@cricketvault.demo",
        "password_hash": demo_password_hash,
        "mobile": "+91 99000 00001",
        "age": 35,
        "location": "Mumbai, India",
        "playing_role": "All-Rounder",
        "experience": "Advanced",
        "batting_style": "Right Hand",
        "bowling_style": "Right Arm Medium",
        "status": "active",
        "created_at": (now - timedelta(days=60)).isoformat()
    }
    db.users.insert_one(admin_user)

    # 2. COACHES (Including the 7 real coaches + Rahul Sharma platform coach)
    coaches_data = [
        # Demo / Platform Master Coach
        {
            "id": "coach_user_rahul",
            "name": "Rahul Sharma",
            "email": "coach@cricketvault.demo",
            "specialty": "Batting Coach",
            "role_title": "Senior Batting Mentor",
            "academy_name": "Cricket Vault Performance Hub",
            "category": "Batters and Fielders",
            "discipline": "Batting",
            "specializations": ["Batting", "Cover drive mechanics", "Front-foot stability", "Classical batting technique"],
            "bio": "Former Ranji Trophy cricketer with 12+ years coaching youth. Platform master coach certified in classical strokeplay, technique diagnostics, and video biomechanics evaluation.",
            "biography": "Former Ranji Trophy cricketer with 12+ years coaching youth. Platform master coach certified in classical strokeplay, technique diagnostics, and video biomechanics evaluation.",
            "achievements": [
                "Former First-Class / Ranji Trophy cricketer with over 3,000 runs",
                "12+ years mentoring youth state representatives in Mumbai and Maharashtra",
                "Cricket Vault Certified Master Coach"
            ],
            "city": "Mumbai",
            "location": "Mumbai, Maharashtra, India",
            "years_experience": 12,
            "rating_avg": 4.9,
            "rating_count": 12,
            "official_website": "https://cricketvault.demo",
            "reference_links": ["https://cricketvault.demo/coaches/rahul-sharma"],
            "verification_status": "verified",
            "verification_note": "Platform Master Coach credentials verified via Ranji Trophy first-class playing records and state coaching association.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": None
        },
        # Coach 1: R. Sridhar
        {
            "id": "coach_user_sridhar",
            "name": "R. Sridhar",
            "email": "r.sridhar@coachingbeyond.in",
            "specialty": "Fielding & High-Performance Mentor",
            "role_title": "Co-founder & Fielding Mentor",
            "academy_name": "Coaching Beyond",
            "category": "Batters and Fielders",
            "discipline": "Fielding",
            "specializations": ["Fielding", "Technical footwork", "Stance mechanics", "Reflex training", "Pressure-based match practice", "High-Performance Training"],
            "bio": "Co-founder and Fielding Mentor at Coaching Beyond, Secunderabad. Celebrated former Indian national fielding coach who directed fielding systems across more than 300 international fixtures, turning the Indian national squad into one of the most agile and feared fielding sides in world cricket.",
            "biography": "Co-founder and Fielding Mentor at Coaching Beyond, Secunderabad. Celebrated former Indian national fielding coach who directed fielding systems across more than 300 international fixtures, turning the Indian national squad into one of the most agile and feared fielding sides in world cricket.",
            "achievements": [
                "Head Fielding Coach of the Indian Men's National Cricket Team (2014–2021) across 300+ international matches",
                "Key coaching staff member in India's back-to-back historic Test series victories in Australia (2018–19 and 2020–21)",
                "Co-founder of Coaching Beyond, premier cricket performance academy in Hyderabad/Secunderabad alongside Ravi Shastri and Bharat Arun",
                "Former Hyderabad First-Class left-arm orthodox spinner (1989–2001) with 91 first-class wickets"
            ],
            "city": "Secunderabad",
            "location": "Secunderabad, Telangana, India",
            "years_experience": 22,
            "rating_avg": 4.98,
            "rating_count": 48,
            "official_website": "https://www.coachingbeyond.in/",
            "reference_links": ["https://www.coachingbeyond.in/", "https://in.linkedin.com/company/coaching-beyond-pvt-ltd"],
            "verification_status": "verified",
            "verification_note": "Verified via Coaching Beyond official portal and BCCI international coaching records.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": "/images/coaches/r_sridhar.webp",
            "photo_url": "/images/coaches/r_sridhar.webp",
            "image_source_url": "https://www.coachingbeyond.in/"
        },
        # Coach 2: John Manoj
        {
            "id": "coach_user_john_manoj",
            "name": "John Manoj",
            "email": "john.manoj@stjohnscricketacademy.com",
            "specialty": "Foundational Batting & Grassroots Development",
            "role_title": "Director & Head Coach",
            "academy_name": "St. John's Sports Coaching Foundation",
            "category": "Batters and Fielders",
            "discipline": "Batting",
            "specializations": ["Batting", "Grassroots talent identification", "Defensive and attacking batting", "Technique development", "Longer-format match temperament"],
            "bio": "Director and Head Coach of St. John's Sports Coaching Foundation (established 1987 in East Marredpally). Legendary Hyderabad developmental mentor with over 35 years of elite coaching experience, credited with discovering and shaping iconic international cricketers during their formative years.",
            "biography": "Director and Head Coach of St. John's Sports Coaching Foundation (established 1987 in East Marredpally). Legendary Hyderabad developmental mentor with over 35 years of elite coaching experience, credited with discovering and shaping iconic international cricketers during their formative years.",
            "achievements": [
                "Co-founded St. John's Sports Coaching Foundation in 1987 with former Indian Test cricketer M.V. Narasimha Rao",
                "Foundational junior coach for legendary Test batter VVS Laxman from the academy's first batch in 1987",
                "Early developmental coach for former India Women's captain Mithali Raj, Test batter Hanuma Vihari, and international spinner Noel David",
                "BCCI-accredited Level-1 coach with over 35 years of foundational coaching",
                "Former Secretary and Vice President of the Hyderabad Cricket Association (HCA)"
            ],
            "city": "Secunderabad",
            "location": "East Marredpally, Secunderabad, Telangana, India",
            "years_experience": 35,
            "rating_avg": 4.95,
            "rating_count": 52,
            "official_website": "https://www.stjohnscricketacademy.com/",
            "reference_links": ["https://www.stjohnscricketacademy.com/", "https://www.stjohnscricketacademy.com/about-academy.html"],
            "verification_status": "verified",
            "verification_note": "Verified via St. John's Academy official records and sports foundation archive.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": "https://www.stjohnscricketacademy.com/"
        },
        # Coach 3: Arshad Ayub
        {
            "id": "coach_user_arshad_ayub",
            "name": "Arshad Ayub",
            "email": "arshad.ayub@arshadayubcricketacademy.in",
            "specialty": "Spin Bowling & Tactical Match Strategy",
            "role_title": "Founder & Chief Director",
            "academy_name": "Arshad Ayub Cricket Academy",
            "category": "Bowlers",
            "discipline": "Spin Bowling",
            "specializations": ["Spin bowling", "Spin-bowling variations", "Trajectory and drift", "Bowling strategy", "Field placements"],
            "bio": "Former Indian international cricketer (13 Tests, 32 ODIs) and Founder/Chief Director of Arshad Ayub Cricket Academy (established 1998 in Masab Tank). Master spin consultant and BCCI Level-3 coach specializing in orthodox flight, drift angles, and attacking spin strategy.",
            "biography": "Former Indian international cricketer (13 Tests, 32 ODIs) and Founder/Chief Director of Arshad Ayub Cricket Academy (established 1998 in Masab Tank). Master spin consultant and BCCI Level-3 coach specializing in orthodox flight, drift angles, and attacking spin strategy.",
            "achievements": [
                "Represented India in 13 Tests and 32 ODIs (1987–1990) as premier off-spinner",
                "Match-winning international figures of 5/21 vs Pakistan in the 1988 Asia Cup at Dhaka",
                "Former President of the Hyderabad Cricket Association (HCA) and Manager of the Indian National Team (2010)",
                "BCCI Level-3 accredited Master Coach; founded AACA producing numerous Ranji Trophy spinners"
            ],
            "city": "Hyderabad",
            "location": "Masab Tank, Hyderabad, Telangana, India",
            "years_experience": 28,
            "rating_avg": 4.96,
            "rating_count": 56,
            "official_website": "https://arshadayubcricketacademy.in/",
            "reference_links": ["https://arshadayubcricketacademy.in/", "https://arshadayubcricketacademy.in/index.php/coaches/"],
            "verification_status": "verified",
            "verification_note": "Verified via ESPNcricinfo international player records and AACA academy documentation.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": "/images/coaches/arshad_ayub_academy.png",
            "photo_url": "/images/coaches/arshad_ayub_academy.png",
            "image_source_url": "https://arshadayubcricketacademy.in/"
        },
        # Coach 4: K. Srinivas
        {
            "id": "coach_user_k_srinivas",
            "name": "K. Srinivas",
            "email": "k.srinivas@globalcricketacademy.in",
            "specialty": "Fast Bowling Biomechanics & Workload Management",
            "role_title": "Head Coach",
            "academy_name": "Global Cricket Academy",
            "category": "Bowlers",
            "discipline": "Fast Bowling",
            "specializations": ["Fast bowling", "Fast-bowling workload management", "Release velocity", "Wrist positioning", "Pace conditioning"],
            "bio": "Head Coach at Global Cricket Academy, Adarsa Nagar. Veteran Hyderabad grassroots pace mentor renowned for discovering raw pace talent, seam alignment correction, and fast-bowling workload management.",
            "biography": "Head Coach at Global Cricket Academy, Adarsa Nagar. Veteran Hyderabad grassroots pace mentor renowned for discovering raw pace talent, seam alignment correction, and fast-bowling workload management.",
            "achievements": [
                "Recognized in national sports media as one of the key childhood pace coaches of Indian international fast bowler Mohammed Siraj",
                "Over two decades of grassroots coaching and fast-bowling mentoring across Telangana state competitions",
                "Specialist in injury-prevention drills and biomechanical load monitoring for young pacers"
            ],
            "city": "Hyderabad",
            "location": "Adarsa Nagar, Hyderabad, Telangana, India",
            "years_experience": 22,
            "rating_avg": 4.86,
            "rating_count": 31,
            "official_website": None,
            "reference_links": [
                "https://indianexpress.com/article/sports/cricket/mohammed-siraj-coach-srinivas/",
                "https://timesofindia.indiatimes.com/sports/cricket/news/mohammed-siraj-childhood-coach-srinivas/"
            ],
            "verification_status": "verified",
            "verification_note": "Childhood mentoring of Mohammed Siraj verified via national press interviews (Indian Express, Times of India); academy domain unverified.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": "https://indianexpress.com/article/sports/cricket/mohammed-siraj-coach-srinivas/"
        },
        # Coach 5: MSK Prasad
        {
            "id": "coach_user_msk_prasad",
            "name": "MSK Prasad",
            "email": "msk@msksica.com",
            "specialty": "Wicketkeeping & High-Performance Mentorship",
            "role_title": "Founder & Chief Mentor",
            "academy_name": "MSK Prasad's International Cricket Academy",
            "category": "Wicketkeepers",
            "discipline": "Wicketkeeping",
            "specializations": ["Wicketkeeping", "Low-stance wicketkeeping", "Lateral agility", "Glove-transition speed", "Spin tracking", "High-Performance Training"],
            "bio": "Former Indian Test wicketkeeper and former Chairman of the BCCI Senior National Selection Committee (2016–2020). Founder and Chief Mentor of MSK Prasad's International Cricket Academy, with its flagship Center of Excellence in Kondapur.",
            "biography": "Former Indian Test wicketkeeper and former Chairman of the BCCI Senior National Selection Committee (2016–2020). Founder and Chief Mentor of MSK Prasad's International Cricket Academy, with its flagship Center of Excellence in Kondapur.",
            "achievements": [
                "Represented India in 6 Tests and 17 One Day Internationals as wicketkeeper and middle-order batter",
                "Chairman of the BCCI Senior National Selection Committee (2016–2020), overseeing India's historic maiden Test series triumph in Australia",
                "Director of Cricket and Founder of MSKSICA Center of Excellence featuring multi-pitch training infrastructure in Kondapur"
            ],
            "city": "Hyderabad",
            "location": "World One School, Bikshapathi Nagar, Kondapur, Hyderabad, Telangana, India",
            "years_experience": 24,
            "rating_avg": 4.94,
            "rating_count": 45,
            "official_website": None,
            "reference_links": ["https://careerincricket.com/academy-details/msk-prasads-international-cricket-academy-hyderabad"],
            "verification_status": "verified",
            "verification_note": "Playing and BCCI selector records verified via official archives; academy web portal currently undergoing maintenance.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": "https://careerincricket.com/academy-details/msk-prasads-international-cricket-academy-hyderabad"
        },
        # Coach 6: Ram Patil
        {
            "id": "coach_user_ram_patil",
            "name": "Ram Patil",
            "email": "ram.patil@msksica.com",
            "specialty": "All-Rounder Conditioning & High Performance",
            "role_title": "Head Coach (Affiliation Pending Verification)",
            "academy_name": "MSK Prasad International Cricket Academy",
            "category": "All-Rounders and High Performance",
            "discipline": "All-Rounder Development",
            "specializations": ["All-rounder development", "High-performance training", "Batting and bowling workload management", "Macro/meso/micro training cycles", "Long-format match preparation"],
            "bio": "All-rounder developmental coach specializing in dual-discipline workload management and macro/meso/micro periodized training cycles for youth cricket.",
            "biography": "All-rounder developmental coach specializing in dual-discipline workload management and macro/meso/micro periodized training cycles for youth cricket.",
            "achievements": [
                "Holds ICC Academy Level 2 High Performance Coaching certification credentials",
                "14+ years of athletic conditioning, periodization planning, and junior cricket match preparation"
            ],
            "city": "Hyderabad",
            "location": "Kondapur, Hyderabad, Telangana, India",
            "years_experience": 14,
            "rating_avg": 4.88,
            "rating_count": 28,
            "official_website": None,
            "reference_links": ["https://in.linkedin.com/in/ram-patil-%F0%9F%8F%8F-028100187"],
            "verification_status": "unverified_affiliation",
            "verification_note": "Professional credentials self-reported via professional profile; institutional academy affiliation at MSKSICA pending formal verification.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": "https://in.linkedin.com/in/ram-patil-%F0%9F%8F%8F-028100187"
        },
        # Coach 7: Pramod Senan
        {
            "id": "coach_user_pramod_senan",
            "name": "Pramod Senan",
            "email": "pramod.senan@msksica.com",
            "specialty": "Video Biomechanics & AI Performance Analytics",
            "role_title": "High-Performance Systems Coach (Affiliation Pending Verification)",
            "academy_name": "MSK Prasad International Cricket Academy",
            "category": "All-Rounders and High Performance",
            "discipline": "High-Performance Training",
            "specializations": ["High-performance training", "AI-assisted performance analysis", "Video-based technique correction", "Player development pathways", "Data-driven coaching"],
            "bio": "High-performance cricket systems consultant specialized in digital biomechanics, video-based technique correction, and data-driven player development pathways.",
            "biography": "High-performance cricket systems consultant specialized in digital biomechanics, video-based technique correction, and data-driven player development pathways.",
            "achievements": [
                "Prior Head Coach appointment at Gary Kirsten Cricket India (GKCI Pune) as cited in professional profile",
                "Pioneered multi-angle high-speed video capture and biomechanical feedback systems for academy trainees"
            ],
            "city": "Hyderabad",
            "location": "Hyderabad, Telangana, India",
            "years_experience": 13,
            "rating_avg": 4.90,
            "rating_count": 34,
            "official_website": None,
            "reference_links": ["https://in.linkedin.com/in/pramod-senan-735220146"],
            "verification_status": "unverified_affiliation",
            "verification_note": "GKCI Pune background cited on professional profile; current institutional appointment at MSKSICA subject to formal verification.",
            "last_verified_at": "2026-10-09T10:00:00Z",
            "image_url": None,
            "photo_url": None,
            "image_source_url": "https://in.linkedin.com/in/pramod-senan-735220146"
        }
    ]

    for c in coaches_data:
        coach_user = {
            "id": c["id"],
            "role": "coach",
            "name": c["name"],
            "email": c["email"],
            "password_hash": demo_password_hash,
            "mobile": "+91 98111 22233",
            "age": 30 + c["years_experience"],
            "location": c["location"],
            "playing_role": "All-Rounder",
            "experience": "Advanced",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Medium",
            "status": "active",
            "created_at": (now - timedelta(days=90)).isoformat()
        }
        db.users.insert_one(coach_user)
        
        coach_profile = {
            "id": f"coach_prof_{c['id']}",
            "user_id": c["id"],
            "name": c["name"],
            "academy_name": c["academy_name"],
            "role_title": c.get("role_title", "Senior Coach"),
            "specialty": c["specialty"],
            "category": c.get("category", "Batters and Fielders"),
            "discipline": c.get("discipline", "Batting"),
            "specializations": c.get("specializations", [c["specialty"]]),
            "biography": c.get("biography", c.get("bio", "")),
            "bio": c.get("bio", c.get("biography", "")),
            "achievements": c.get("achievements", []),
            "city": c["city"],
            "location": c["location"],
            "years_experience": c["years_experience"],
            "image_url": c.get("image_url"),
            "photo_url": c.get("image_url"),
            "image_source_url": c.get("image_source_url"),
            "official_website": c.get("official_website"),
            "reference_links": c.get("reference_links", []),
            "verification_status": c.get("verification_status", "verified"),
            "verification_note": c.get("verification_note", ""),
            "last_verified_at": c.get("last_verified_at", now_iso),
            "created_at": (now - timedelta(days=90)).isoformat(),
            "updated_at": now_iso,
            "rating_avg": c["rating_avg"],
            "rating_count": c["rating_count"]
        }
        db.coaches.insert_one(coach_profile)

    # 3. PLAYERS (12 players total)
    players_data = [
        {
            "id": "player_user_rohan",
            "name": "Rohan Verma",
            "email": "player@cricketvault.demo",
            "mobile": "+91 98765 43210",
            "age": 17,
            "location": "Pune, India",
            "playing_role": "Batter",
            "experience": "Intermediate",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Medium",
            "status": "active"
        },
        {
            "id": "player_user_aarav",
            "name": "Aarav Patel",
            "email": "aarav.patel@cricketvault.demo",
            "mobile": "+91 98765 43211",
            "age": 18,
            "location": "Ahmedabad, India",
            "playing_role": "Bowler",
            "experience": "Advanced",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Fast",
            "status": "active"
        },
        {
            "id": "player_user_pranav",
            "name": "Pranav Reddy",
            "email": "pranav.reddy@cricketvault.demo",
            "mobile": "+91 98765 43212",
            "age": 19,
            "location": "Hyderabad, India",
            "playing_role": "Bowler",
            "experience": "Intermediate",
            "batting_style": "Right Hand",
            "bowling_style": "Off Spin",
            "status": "active"
        },
        {
            "id": "player_user_yash",
            "name": "Yash Deshmukh",
            "email": "yash.deshmukh@cricketvault.demo",
            "mobile": "+91 98765 43213",
            "age": 16,
            "location": "Nagpur, India",
            "playing_role": "Batter",
            "experience": "Beginner",
            "batting_style": "Left Hand",
            "bowling_style": "None",
            "status": "active"
        },
        {
            "id": "player_user_harsh",
            "name": "Harsh Pillai",
            "email": "harsh.pillai@cricketvault.demo",
            "mobile": "+91 98765 43214",
            "age": 20,
            "location": "Kochi, India",
            "playing_role": "All-Rounder",
            "experience": "Advanced",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Medium",
            "status": "active"
        },
        {
            "id": "player_user_dev",
            "name": "Dev Raina",
            "email": "dev.raina@cricketvault.demo",
            "mobile": "+91 98765 43215",
            "age": 17,
            "location": "Lucknow, India",
            "playing_role": "Batter",
            "experience": "Intermediate",
            "batting_style": "Left Hand",
            "bowling_style": "None",
            "status": "active"
        },
        {
            "id": "player_user_ishaan",
            "name": "Ishaan Kapoor",
            "email": "ishaan.kapoor@cricketvault.demo",
            "mobile": "+91 98765 43216",
            "age": 18,
            "location": "Chandigarh, India",
            "playing_role": "Bowler",
            "experience": "Intermediate",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Fast",
            "status": "active"
        },
        {
            "id": "player_user_neel",
            "name": "Neel Shah",
            "email": "neel.shah@cricketvault.demo",
            "mobile": "+91 98765 43217",
            "age": 19,
            "location": "Surat, India",
            "playing_role": "Wicketkeeper",
            "experience": "Intermediate",
            "batting_style": "Right Hand",
            "bowling_style": "None",
            "status": "active"
        },
        {
            "id": "player_user_karan",
            "name": "Karan Mehta",
            "email": "karan.mehta@cricketvault.demo",
            "mobile": "+91 98765 43218",
            "age": 21,
            "location": "Jaipur, India",
            "playing_role": "Batter",
            "experience": "Advanced",
            "batting_style": "Right Hand",
            "bowling_style": "Leg Spin",
            "status": "active"
        },
        {
            "id": "player_user_siddharth",
            "name": "Siddharth Iyer",
            "email": "siddharth.iyer@cricketvault.demo",
            "mobile": "+91 98765 43219",
            "age": 18,
            "location": "Chennai, India",
            "playing_role": "All-Rounder",
            "experience": "Intermediate",
            "batting_style": "Right Hand",
            "bowling_style": "Off Spin",
            "status": "active"
        },
        {
            "id": "player_user_shashi",
            "name": "Shashi Kinnera",
            "email": "shashi.kinnera@cricketvault.demo",
            "mobile": "+91 98765 43220",
            "age": 17,
            "location": "Warangal, India",
            "playing_role": "Batter",
            "experience": "Beginner",
            "batting_style": "Right Hand",
            "bowling_style": "None",
            "status": "active"
        },
        {
            "id": "player_user_sumedh",
            "name": "Kotha Sumedh Royal",
            "email": "kotha.sumedh@cricketvault.demo",
            "mobile": "+91 98765 43221",
            "age": 22,
            "location": "Hyderabad, India",
            "playing_role": "All-Rounder",
            "experience": "Advanced",
            "batting_style": "Right Hand",
            "bowling_style": "Right Arm Fast",
            "status": "inactive"
        }
    ]

    for p in players_data:
        player_user = {
            "id": p["id"],
            "role": "player",
            "name": p["name"],
            "email": p["email"],
            "password_hash": demo_password_hash,
            "mobile": p["mobile"],
            "age": p["age"],
            "location": p["location"],
            "playing_role": p["playing_role"],
            "experience": p["experience"],
            "batting_style": p["batting_style"],
            "bowling_style": p["bowling_style"],
            "status": p["status"],
            "created_at": (now - timedelta(days=45)).isoformat()
        }
        db.users.insert_one(player_user)

    # 4. PLANS (Rookie, Pro Striker, Elite Legend + Legacy Elite)
    plans_data = [
        {
            "id": "plan_rookie",
            "name": "Rookie",
            "tier": "rookie",
            "monthly_price": 499,
            "yearly_price": 4990,
            "price": 499,
            "interval": "month",
            "reviews_monthly": 1,
            "reviews_yearly": 12,
            "comparison_limit": 2,
            "has_live_matches": True,
            "has_advanced_stats": False,
            "has_analytics_dashboard": False,
            "has_ai_summaries": False,
            "has_direct_messaging": False,
            "badge": "STARTER",
            "popular": False,
            "description": "Essential cricket stats, basic scorecards, and fundamental player performance tracking.",
            "features": [
                "Essential cricket statistics",
                "Player profiles & career stats",
                "Live match information where available",
                "Basic scorecards & match summaries",
                "Limited player comparisons (up to 2 players)",
                "1 certified coach video review/month"
            ],
            "active": True
        },
        {
            "id": "plan_pro_striker",
            "name": "Pro Striker",
            "tier": "pro_striker",
            "monthly_price": 899,
            "yearly_price": 8990,
            "price": 899,
            "interval": "month",
            "reviews_monthly": 3,
            "reviews_yearly": 36,
            "comparison_limit": 4,
            "has_live_matches": True,
            "has_advanced_stats": True,
            "has_analytics_dashboard": False,
            "has_ai_summaries": False,
            "has_direct_messaging": True,
            "badge": "MOST POPULAR",
            "popular": True,
            "description": "Advanced stats, match analysis, discipline filters, and deeper technique insights.",
            "features": [
                "Everything in Rookie, plus:",
                "Advanced player statistics & strike rates",
                "Detailed match analysis & run graphs",
                "Extended player comparisons (up to 4 players)",
                "Enhanced discipline filters & historical data",
                "3 certified coach video reviews/month",
                "Direct coach messaging"
            ],
            "active": True
        },
        {
            "id": "plan_elite_legend",
            "name": "Elite Legend",
            "tier": "elite_legend",
            "monthly_price": 1499,
            "yearly_price": 14990,
            "price": 1499,
            "interval": "month",
            "reviews_monthly": 6,
            "reviews_yearly": 72,
            "comparison_limit": 8,
            "has_live_matches": True,
            "has_advanced_stats": True,
            "has_analytics_dashboard": True,
            "has_ai_summaries": True,
            "has_direct_messaging": True,
            "badge": "BEST VALUE",
            "popular": False,
            "description": "Full access to advanced analytics dashboards, AI performance summaries, and priority coaching.",
            "features": [
                "Everything in Pro Striker, plus:",
                "Advanced analytics dashboards & biomechanics",
                "AI-assisted player performance summaries",
                "Advanced comparison tools & head-to-head radar",
                "Personalized technique drills & development plans",
                "6 certified coach video reviews/month",
                "Priority coach turnaround (within 24 hours)"
            ],
            "active": True
        },
        # Legacy plan alias for backward compatibility with existing tests
        {
            "id": "plan_elite",
            "name": "Elite Legend",
            "tier": "elite_legend",
            "monthly_price": 699,
            "yearly_price": 6990,
            "price": 699,
            "interval": "month",
            "reviews_monthly": 3,
            "reviews_yearly": 36,
            "comparison_limit": 4,
            "has_live_matches": True,
            "has_advanced_stats": True,
            "has_analytics_dashboard": True,
            "has_ai_summaries": True,
            "has_direct_messaging": True,
            "badge": "LEGACY",
            "popular": False,
            "features": [
                "3 video reviews per month",
                "Detailed coach feedback within 48 hours",
                "Direct messaging with coaches",
                "Live sessions & open Q&A classes"
            ],
            "active": False
        }
    ]
    for p in plans_data:
        db.plans.insert_one(p)

    # 5. SUBSCRIPTIONS (Rohan Verma has active Elite Legend plan)
    sub_rohan = {
        "id": "sub_rohan_001",
        "user_id": "player_user_rohan",
        "plan_id": "plan_elite_legend",
        "plan_name": "Elite Legend",
        "billing_period": "monthly",
        "status": "active",
        "started_at": "2026-10-06T00:00:00",
        "expires_at": "2026-11-06T23:59:59",
        "next_billing_date": "2026-11-06T23:59:59",
        "auto_renew": True,
        "amount": 1499,
        "currency": "INR",
        "reviews_remaining": 5,
        "reviews_total": 6
    }
    db.subscriptions.insert_one(sub_rohan)

    # 6. PAYMENTS (Monthly revenue = 699, paid this month)
    payment_rohan = {
        "id": "pay_rohan_sub_01",
        "user_id": "player_user_rohan",
        "item_name": "Elite",
        "type": "plan",
        "item_id": "plan_elite",
        "amount": 699,
        "currency": "INR",
        "status": "paid",
        "gateway_order_id": "order_RZP_demo_101",
        "gateway_payment_id": "pay_RZP_demo_101",
        "created_at": "2026-10-06T10:15:30"
    }
    db.payments.insert_one(payment_rohan)

    # 7. VIDEO REVIEWS (5 seed reviews)
    reviews_data = [
        {
            "id": "rev_neel_01",
            "player_id": "player_user_neel",
            "coach_id": "coach_user_msk_prasad",
            "youtube_url": "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            "youtube_id": "kJQP7kiw5Fk",
            "review_type": "Fitness",
            "question": "What should my pre-season fitness look like?",
            "notes": "Focusing on lower body power and core stability for wicketkeeping endurance.",
            "status": "completed",
            "submitted_at": "2026-09-28T09:00:00",
            "assigned_at": "2026-09-28T10:30:00",
            "completed_at": "2026-09-30T16:00:00",
            "feedback": {
                "technical_mistakes": "Squat depth is limited; insufficient ankle dorsiflexion mobility.",
                "strengths": "Strong cardiovascular endurance base and quick first step reaction.",
                "areas_to_improve": "Rotational power for explosive lateral movements behind stumps.",
                "recommended_drills": "Lateral bounding, medicine ball scoop throws, Bulgarian split squats.",
                "match_advice": "Hydrate with electrolyte balance 30 minutes before warmups.",
                "additional": "Log your RPE (Rate of Perceived Exertion) after each session.",
                "overall_assessment": "Solid athletic foundation. Implement the targeted mobility routine for peak preseason gains."
            },
            "rating": 5,
            "rating_comment": "Excellent workout breakdown!"
        },
        {
            "id": "rev_karan_01",
            "player_id": "player_user_karan",
            "coach_id": "coach_user_k_srinivas",
            "youtube_url": "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
            "youtube_id": "3JZ_D3ELwOQ",
            "review_type": "Batting",
            "question": "Struggling against short-pitched bowling.",
            "notes": "I tend to pull early and get top edges over mid-wicket.",
            "status": "assigned",
            "submitted_at": "2026-10-07T11:20:00",
            "assigned_at": "2026-10-07T14:00:00",
            "completed_at": None,
            "feedback": {},
            "rating": None,
            "rating_comment": None
        },
        {
            "id": "rev_siddharth_01",
            "player_id": "player_user_siddharth",
            "coach_id": "coach_user_arshad_ayub",
            "youtube_url": "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
            "youtube_id": "fJ9rUzIMcZQ",
            "review_type": "Fielding",
            "question": "My throws are losing accuracy from the boundary.",
            "notes": "Struggling to keep flat trajectories into the keeper's gloves.",
            "status": "assigned",
            "submitted_at": "2026-10-08T08:30:00",
            "assigned_at": "2026-10-08T10:00:00",
            "completed_at": None,
            "feedback": {},
            "rating": None,
            "rating_comment": None
        },
        {
            "id": "rev_aarav_01",
            "player_id": "player_user_aarav",
            "coach_id": "coach_user_k_srinivas",
            "youtube_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "youtube_id": "aqz-KE-bpKQ",
            "review_type": "Bowling",
            "question": "How can I generate more swing with the new ball?",
            "notes": "Wrist seam angle falls slightly toward fine leg during delivery stride.",
            "status": "under_review",
            "submitted_at": "2026-10-06T14:00:00",
            "assigned_at": "2026-10-06T15:30:00",
            "completed_at": None,
            "feedback": {
                "technical_mistakes": "Wrist angle wobbles at point of release.",
                "strengths": "Strong run-up momentum and high release point.",
                "areas_to_improve": "Locked wrist position through follow through."
            },
            "rating": None,
            "rating_comment": None
        },
        {
            "id": "rev_rohan_01",
            "player_id": "player_user_rohan",
            "coach_id": "coach_user_rahul",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "youtube_id": "dQw4w9WgXcQ",
            "review_type": "Batting",
            "question": "My cover drive feels mistimed. What am I doing wrong?",
            "notes": "Checked video at 0:15 - front knee collapses occasionally.",
            "status": "completed",
            "submitted_at": "2026-09-26T10:00:00",
            "assigned_at": "2026-09-26T11:00:00",
            "completed_at": "2026-10-06T10:00:00",
            "feedback": {
                "technical_mistakes": "Head falling across off-stump; weight on back foot.",
                "strengths": "Good base, nice follow-through.",
                "areas_to_improve": "Head stability and front-foot stride.",
                "recommended_drills": "Shadow batting with headcam, tee work focusing on front elbow.",
                "match_advice": "Play straight for first 10 balls — don't force the cover drive early.",
                "additional": "Film yourself every week.",
                "overall_assessment": "Strong fundamentals with specific technical fixes to work on."
            },
            "rating": None,
            "rating_comment": None
        }
    ]

    for r in reviews_data:
        db.video_reviews.insert_one(r)

    # 8. COACH EARNINGS (Total ₹300 payouts: Rahul ₹150 + MSK Prasad ₹150)
    earnings_data = [
        {
            "id": "earn_rahul_01",
            "coach_id": "coach_user_rahul",
            "review_id": "rev_rohan_01",
            "player_name": "Rohan Verma",
            "amount": 150,
            "status": "approved",
            "created_at": "2026-10-06T10:05:00"
        },
        {
            "id": "earn_msk_01",
            "coach_id": "coach_user_msk_prasad",
            "review_id": "rev_neel_01",
            "player_name": "Neel Shah",
            "amount": 150,
            "status": "approved",
            "created_at": "2026-09-30T16:05:00"
        }
    ]
    for e in earnings_data:
        db.earnings.insert_one(e)

    # 9. E-BOOKS (10 items)
    ebooks_data = [
        {
            "id": "eb_01",
            "title": "Master Your Cover Drive",
            "category": "Batting",
            "price": 199,
            "cover_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/master-your-cover-drive.pdf",
            "description": "Comprehensive visual guide on footwork, head position, and balance to execute textbook cover drives against pace and spin."
        },
        {
            "id": "eb_02",
            "title": "30-Day Cricket Practice Plan",
            "category": "Practice Plans",
            "price": 149,
            "cover_url": "https://images.unsplash.com/photo-1531415074868-036b1c575351?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/30-day-practice-plan.pdf",
            "description": "Structured day-by-day drills, net routines, and fitness circuits designed to elevate your technical precision in one month."
        },
        {
            "id": "eb_03",
            "title": "Cricket Mindset for Young Players",
            "category": "Mental Game",
            "price": 249,
            "cover_url": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/cricket-mindset.pdf",
            "description": "Master pressure situations, overcome slumps, build resilient pre-ball routines, and develop an unshakable match temperament."
        },
        {
            "id": "eb_04",
            "title": "Fast Bowling Blueprint",
            "category": "Bowling",
            "price": 299,
            "cover_url": "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/fast-bowling-blueprint.pdf",
            "description": "Biomechanics of genuine pace, explosive run-up alignment, back-foot contact stability, and reverse swing mastery."
        },
        {
            "id": "eb_05",
            "title": "Spin Bowling Secrets",
            "category": "Bowling",
            "price": 249,
            "cover_url": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/spin-bowling-secrets.pdf",
            "description": "Art of revolutions, wrist releases, disguise in arm balls and googlies, field setup strategies, and deceptive flight lines."
        },
        {
            "id": "eb_06",
            "title": "Cricket Fitness Essentials",
            "category": "Fitness",
            "price": 199,
            "cover_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/cricket-fitness.pdf",
            "description": "Cricket-tailored conditioning program: core stability, fast recovery nutrition, shoulder longevity, and quick sprint stamina."
        },
        {
            "id": "eb_07",
            "title": "Beginner's Cricket Handbook",
            "category": "Beginner Guides",
            "price": 99,
            "cover_url": "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/beginners-handbook.pdf",
            "description": "The quintessential starting guide for young cricketers covering basic grips, rules, gear selection, and foundational stances."
        },
        {
            "id": "eb_08",
            "title": "Academy Trials Playbook",
            "category": "Career Guidance",
            "price": 349,
            "cover_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/academy-trials-playbook.pdf",
            "description": "How to stand out in state and club selection trials, impress selectors with body language, and handle pressure situations."
        },
        {
            "id": "eb_09",
            "title": "Wicketkeeping Fundamentals",
            "category": "Wicketkeeping",
            "price": 199,
            "cover_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/wicketkeeping-fundamentals.pdf",
            "description": "Glove work, standing up to spinners, diving techniques, soft hands, and commanding the fielding unit."
        },
        {
            "id": "eb_10",
            "title": "Match-Day Preparation Guide",
            "category": "Mental Game",
            "price": 149,
            "cover_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600",
            "file_url": "https://cricketvault.demo/ebooks/match-day-preparation.pdf",
            "description": "The complete 24-hour match-day protocol: pre-game visualization, warm-up sequencing, pitch reading, and mid-innings reset."
        }
    ]
    for eb in ebooks_data:
        db.ebooks.insert_one(eb)

    # 10. SESSIONS (3 upcoming live classes)
    sessions_data = [
        {
            "id": "sess_01",
            "title": "Fast Bowling Clinic",
            "coach_id": "coach_user_k_srinivas",
            "coach_name": "K. Srinivas",
            "academy_name": "Global Cricket Academy",
            "starts_at": (now.replace(hour=17, minute=0, second=0, microsecond=0)).isoformat(),
            "join_url": "https://meet.google.com/cricket-clinic-live"
        },
        {
            "id": "sess_02",
            "title": "Reflex & Fielding Masterclass",
            "coach_id": "coach_user_sridhar",
            "coach_name": "R. Sridhar",
            "academy_name": "Coaching Beyond",
            "starts_at": (now.replace(hour=18, minute=30, second=0, microsecond=0) + timedelta(days=1)).isoformat(),
            "join_url": "https://meet.google.com/ask-the-coach-live"
        },
        {
            "id": "sess_03",
            "title": "Spin Masterclass & Flight Deception",
            "coach_id": "coach_user_arshad_ayub",
            "coach_name": "Arshad Ayub",
            "academy_name": "Arshad Ayub Cricket Academy",
            "starts_at": (now.replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=3)).isoformat(),
            "join_url": "https://meet.google.com/match-prep-live"
        }
    ]
    for s in sessions_data:
        db.sessions.insert_one(s)

    # 11. MESSAGE THREADS & MESSAGES (Rohan & Rahul)
    thread_rohan_rahul = {
        "id": "thread_rohan_rahul",
        "player_id": "player_user_rohan",
        "coach_id": "coach_user_rahul",
        "last_message_at": "2026-10-06T10:30:00"
    }
    db.message_threads.insert_one(thread_rohan_rahul)

    messages_data = [
        {
            "id": "msg_01",
            "thread_id": "thread_rohan_rahul",
            "sender_id": "player_user_rohan",
            "body": "Hi Coach Rahul, I submitted my batting video for the cover drive. Looking forward to your advice!",
            "created_at": "2026-09-26T10:15:00",
            "read": True
        },
        {
            "id": "msg_02",
            "thread_id": "thread_rohan_rahul",
            "sender_id": "coach_user_rahul",
            "body": "Hi Rohan, reviewed your video. Make sure to check the drills I suggested regarding head stability and front foot stride.",
            "created_at": "2026-10-06T10:30:00",
            "read": True
        }
    ]
    for m in messages_data:
        db.messages.insert_one(m)

    # 12. NOTIFICATIONS
    notifications_data = [
        {
            "id": "notif_admin_01",
            "user_id": "user_admin_01",
            "title": "New Video Review Submitted",
            "body": "Siddharth Iyer submitted a Fielding review.",
            "read": False,
            "created_at": "2026-10-08T08:30:00"
        },
        {
            "id": "notif_admin_02",
            "user_id": "user_admin_01",
            "title": "Payment Received",
            "body": "Rohan Verma purchased Elite Plan (₹699).",
            "read": True,
            "created_at": "2026-10-06T10:15:30"
        },
        {
            "id": "notif_coach_01",
            "user_id": "coach_user_rahul",
            "title": "Review Completed",
            "body": "You completed the Batting review for Rohan Verma.",
            "read": True,
            "created_at": "2026-10-06T10:00:00"
        },
        {
            "id": "notif_player_01",
            "user_id": "player_user_rohan",
            "title": "Your Batting review is ready",
            "body": "Coach Rahul Sharma has completed your video review feedback.",
            "read": False,
            "created_at": "2026-10-06T10:00:00"
        }
    ]
    for n in notifications_data:
        db.notifications.insert_one(n)

    # 13. COACH ANNOUNCEMENTS
    announcements_data = [
        {
            "id": "ann_seed_01",
            "coach_id": "coach_user_rahul",
            "title": "Weekly Batting Masterclass: Backfoot Punch & Weight Transfer",
            "message": "Welcome all subscribed athletes! This weekend we will be deep-diving into backfoot punch mechanics against pace bowling. Pay close attention to early balance and shoulder alignment. Review materials will be posted tomorrow.",
            "category": "Technique",
            "audience": "all",
            "target_player_ids": [],
            "status": "published",
            "published_at": (now - timedelta(days=2)).isoformat(),
            "scheduled_at": None,
            "created_at": (now - timedelta(days=2)).isoformat(),
            "updated_at": (now - timedelta(days=2)).isoformat()
        },
        {
            "id": "ann_seed_02",
            "coach_id": "coach_user_rahul",
            "title": "Upcoming High-Intensity Fitness & Hand-Eye Reflex Camp",
            "message": "All registered trainees are invited to participate in the virtual agility check-in on Friday evening at 6:00 PM. Keep your reaction balls and cones ready.",
            "category": "Training Camp",
            "audience": "all",
            "target_player_ids": [],
            "status": "published",
            "published_at": (now - timedelta(hours=6)).isoformat(),
            "scheduled_at": None,
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "updated_at": (now - timedelta(hours=6)).isoformat()
        }
    ]
    for ann in announcements_data:
        db.announcements.insert_one(ann)

    # Mark first announcement as read for Rohan
    db.announcement_reads.insert_one({
        "id": "read_seed_01",
        "announcement_id": "ann_seed_01",
        "user_id": "player_user_rohan",
        "read_at": (now - timedelta(days=1)).isoformat()
    })

    persist_mock_db()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_database(force=True)
