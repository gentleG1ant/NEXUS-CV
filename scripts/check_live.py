import httpx

client = httpx.Client(timeout=10.0)
login_resp = client.post("https://nexus-cv-h5zf.onrender.com/api/auth/login", json={"username": "admin", "password": "admin12345678"})
token = login_resp.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
jobs = client.get("https://nexus-cv-h5zf.onrender.com/api/jobs", headers=headers).json()
for j in jobs:
    jid = j["id"]
    cands = client.get(f"https://nexus-cv-h5zf.onrender.com/api/jobs/{jid}/candidates", headers=headers).json()
    print(f"Job {jid} ({j['title']}) [{j['status']}] - candidates: {len(cands)}")
    for c in cands:
        print(f"  -> Candidate {c.get('fullName')} (Score: {c.get('matchScore')}%, Stage: {c.get('stage')})")
