import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_api():
    base_url = "http://127.0.0.1:8000/api"

    print("=== 1. CRICKET MATCHES ===")
    req = urllib.request.urlopen(f"{base_url}/cricket/matches")
    data = json.loads(req.read().decode())
    print(f"Status: {data.get('status')}, Source: {data.get('source_label')}, Cached: {data.get('is_cached')}")
    matches = data.get("matches", [])
    print(f"Matches count: {len(matches)}")
    for m in matches:
        print(f" - [{m.get('status')}] {m.get('team1')} ({m.get('team1_score')}) vs {m.get('team2')} ({m.get('team2_score')})")
        print(f"   Status note: {m.get('match_status_text')}")
        sc = m.get("scorecard", {})
        batters = sc.get("batters", [])
        bowlers = sc.get("bowlers", [])
        print(f"   Scorecard: {len(batters)} batters, {len(bowlers)} bowlers")
        if batters:
            b1 = batters[0]
            print(f"   Top batter: {b1.get('name')} {b1.get('runs')} ({b1.get('balls')}) SR: {b1.get('strike_rate')}")
        if bowlers:
            bw1 = bowlers[0]
            print(f"   Top bowler: {bw1.get('name')} {bw1.get('overs')} ov, {bw1.get('wickets')} wkts, Econ: {bw1.get('economy')}")

    print("\n=== 2. POINTS TABLE ===")
    req = urllib.request.urlopen(f"{base_url}/cricket/points-table?tournament=IPL%202026")
    pdata = json.loads(req.read().decode())
    teams = pdata.get("data", [])
    print(f"Teams count: {len(teams)}")
    for t in teams[:4]:
        print(f" - #{t.get('rank')} {t.get('team')} ({t.get('short_name')}): {t.get('pts')} pts, Form: {t.get('form')}")

    print("\n=== 3. COACH DIRECTORY ===")
    req = urllib.request.urlopen(f"{base_url}/coaches/directory")
    cdata = json.loads(req.read().decode())
    coaches = cdata.get("coaches", [])
    print(f"Coaches count: {len(coaches)}")
    for c in coaches:
        print(f" - {c.get('name')} | {c.get('academy_name')} | Status: {c.get('verification_status')} | Image: {c.get('image_url')}")

    print("\n=== 4. DISCIPLINE FILTERING ===")
    disciplines = ["Batting", "Fielding", "Fast Bowling", "Spin Bowling", "Wicketkeeping", "All-Rounder Development", "High-Performance Training"]
    for d in disciplines:
        url = f"{base_url}/coaches/directory?discipline=" + urllib.parse.quote(d)
        req = urllib.request.urlopen(url)
        res = json.loads(req.read().decode())
        found = [c.get("name") for c in res.get("coaches", [])]
        print(f" - {d}: {found}")

    print("\n=== 5. SEARCH ===")
    queries = ["Sridhar", "Ayub", "Siraj", "MSK", "Kondapur"]
    for q in queries:
        url = f"{base_url}/coaches/directory?search=" + urllib.parse.quote(q)
        req = urllib.request.urlopen(url)
        res = json.loads(req.read().decode())
        found = [c.get("name") for c in res.get("coaches", [])]
        print(f" - Search '{q}': {found}")

if __name__ == "__main__":
    test_api()
