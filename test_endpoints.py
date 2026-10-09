import urllib.request
import json

def test_api():
    base = "http://127.0.0.1:8000/api"
    
    # 1. Test Coach Directory
    req = urllib.request.urlopen(f"{base}/coaches/directory")
    coaches_data = json.loads(req.read().decode())
    print(f"=== COACH DIRECTORY TEST: {coaches_data['total']} coaches ===")
    for c in coaches_data["coaches"]:
        print(f"  • {c['name']} | Role: {c.get('role_title')} | Academy: {c.get('academy_name')} | Status: {c.get('verification_status')}")

    # 2. Test Live Matches
    req = urllib.request.urlopen(f"{base}/cricket/matches")
    matches_data = json.loads(req.read().decode())
    print(f"\n=== CRICKET MATCHES TEST: {matches_data['total']} matches ===")
    for m in matches_data["matches"]:
        print(f"  • [{m['status'].upper()}] {m['tournament']}: {m['team1_short']} {m.get('team1_score', '')} vs {m['team2_short']} {m.get('team2_score', '')} - {m.get('match_status_text')}")

    # 3. Test Points Table
    req = urllib.request.urlopen(f"{base}/cricket/points-table")
    points_data = json.loads(req.read().decode())
    print(f"\n=== POINTS TABLE TEST: {len(points_data['data'])} teams ===")
    for t in points_data["data"][:4]:
        print(f"  • Rank {t['rank']}: {t['team']} ({t['short_name']}) - P:{t['played']} W:{t['won']} PTS:{t['pts']} NRR:{t['nrr']}")

    print("\nAll API tests PASSED successfully!")

if __name__ == "__main__":
    test_api()
