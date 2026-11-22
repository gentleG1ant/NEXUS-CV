import httpx

client = httpx.Client(timeout=10.0)
login_resp = client.post('https://nexus-cv-h5zf.onrender.com/api/auth/login', json={'username': 'admin', 'password': 'admin12345678'})
token = login_resp.json()['token']
headers = {'Authorization': f'Bearer {token}'}
cands = client.get('https://nexus-cv-h5zf.onrender.com/api/jobs/6/candidates', headers=headers).json()
if len(cands) >= 2:
    client.patch(f"https://nexus-cv-h5zf.onrender.com/api/candidates/{cands[0]['id']}/stage", json={
        'stage': 'INTERVIEW', 
        'reason': 'Exceptional architecture background in Spring Boot, React, and Kubernetes. Strong system design.'
    }, headers=headers)
    print(f"Moved candidate {cands[0]['id']} to INTERVIEW")
    
    client.patch(f"https://nexus-cv-h5zf.onrender.com/api/candidates/{cands[1]['id']}/stage", json={
        'stage': 'SCREENING', 
        'reason': 'Solid technical fundamentals in React and Java. Move to initial recruiter screen.'
    }, headers=headers)
    print(f"Moved candidate {cands[1]['id']} to SCREENING")
