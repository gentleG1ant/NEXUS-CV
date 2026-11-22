import time
import httpx

BASE_URL = "https://nexus-cv-h5zf.onrender.com"

print("Waiting for Spring Boot Gateway on port 8080...")
client = httpx.Client(timeout=10.0)

for i in range(40):
    try:
        r = client.get(f"{BASE_URL}/api/public/jobs")
        if r.status_code == 200:
            print("Spring Boot Gateway is online.")
            break
    except Exception:
        pass
    time.sleep(1)

# 1. Login
print("Logging in as admin...")
login_resp = client.post(f"{BASE_URL}/api/auth/login", json={
    "username": "admin",
    "password": "admin12345678"
})
login_data = login_resp.json()
token = login_data.get("token")
headers = {"Authorization": f"Bearer {token}"}
print(f"Logged in successfully. User: {login_data.get('username')}")

# 2. Create Job 1: Senior Full-Stack Engineer
print("Creating Job 1 (Senior Full-Stack Engineer)...")
job1_resp = client.post(f"{BASE_URL}/api/jobs", json={
    "title": "Senior Full-Stack Engineer",
    "description": "We are seeking an experienced Senior Full-Stack Engineer to lead development of our enterprise web platforms. You will architect scalable backend services in Spring Boot and Python, and deliver modern responsive user interfaces in React.",
    "requiredSkills": "React, TypeScript, Java, Spring Boot, PostgreSQL, Docker",
    "preferredSkills": "Python, FastAPI, AWS, Kubernetes, GraphQL",
    "minExperienceYears": 3,
    "educationLevel": "Bachelor's Degree in Computer Science or related field"
}, headers=headers)
job1 = job1_resp.json()
job1_id = job1["id"]

# Publish Job 1
client.patch(f"{BASE_URL}/api/jobs/{job1_id}/publish", headers=headers)
print(f"Job 1 created and published (ID: {job1_id}).")

# 3. Create Job 2: DevOps & Cloud Infrastructure Architect
print("Creating Job 2 (DevOps & Cloud Architect)...")
job2_resp = client.post(f"{BASE_URL}/api/jobs", json={
    "title": "DevOps & Cloud Infrastructure Architect",
    "description": "Architect, scale, and maintain multi-region cloud infrastructure, container orchestration, and continuous delivery pipelines.",
    "requiredSkills": "Docker, Kubernetes, AWS, Terraform, CI/CD",
    "preferredSkills": "Go, Prometheus, Grafana, Helm",
    "minExperienceYears": 5,
    "educationLevel": "Bachelor's Degree in Engineering or equivalent"
}, headers=headers)
job2 = job2_resp.json()
job2_id = job2["id"]
client.patch(f"{BASE_URL}/api/jobs/{job2_id}/pause", headers=headers)
print(f"Job 2 created and paused (ID: {job2_id}).")

# 4. Apply Candidates to Job 1
def apply_candidate(job_id, name, email, phone, resume_path):
    print(f"Submitting application for {name} ({resume_path})...")
    with open(resume_path, "rb") as f:
        files = {"resume": (resume_path.split("/")[-1], f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {
            "name": name,
            "email": email,
            "phone": phone
        }
        r = client.post(f"{BASE_URL}/api/public/jobs/{job_id}/apply", data=data, files=files)
        print(f"Apply response for {name}: {r.status_code} {r.text}")
        return r.json()

c1 = apply_candidate(job1_id, "Alex Rivera", "alex.rivera@example.com", "(555) 234-5678", "temp_resumes/Alex_Rivera_Resume.docx")
c2 = apply_candidate(job1_id, "Samantha Chen", "samantha.chen@example.com", "(555) 345-6789", "temp_resumes/Samantha_Chen_Resume.docx")
c3 = apply_candidate(job1_id, "David Miller", "david.miller@example.com", "(555) 456-7890", "temp_resumes/David_Miller_Resume.docx")

# Wait 2 seconds for Python scoring
time.sleep(2)

# Fetch candidates for Job 1
candidates = client.get(f"{BASE_URL}/api/jobs/{job1_id}/candidates", headers=headers).json()
print(f"Total candidates in pipeline: {len(candidates)}")

# 5. Move Alex Rivera to INTERVIEW and Samantha to SCREENING
for cand in candidates:
    cid = cand["id"]
    cname = cand.get("fullName", "")
    if "Alex" in cname:
        client.patch(f"{BASE_URL}/api/candidates/{cid}/stage", json={
            "stage": "INTERVIEW",
            "reason": "Outstanding technical depth across React, Spring Boot, and Docker. Strong system architecture experience."
        }, headers=headers)
        print(f"Moved {cname} to INTERVIEW.")
    elif "Samantha" in cname:
        client.patch(f"{BASE_URL}/api/candidates/{cid}/stage", json={
            "stage": "SCREENING",
            "reason": "Solid technical foundation in React and Java. Schedule initial phone screen."
        }, headers=headers)
        print(f"Moved {cname} to SCREENING.")

print("Demo data seeding completed successfully!")
