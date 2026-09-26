# Resume Review — local development build

React recruiter dashboard and careers page, Spring Boot API, file-backed H2 database, and an internal FastAPI resume-scoring service. **This remains a development build. Do not use live applicant data or expose it to the public internet yet.**

## Working flows

- Admin login and protected recruiter API; admin-only account registration.
- Save a job draft, publish it on the local `/careers` page, and accept candidate name, email and a PDF/DOCX resume.
- Store resumes under `backend-java/data/resumes/` with generated names; authorized recruiters can download them.
- Persist jobs, applications, scores, review stages and reasoned audit events in `backend-java/data/resumedb.mv.db`.
- Score resumes through the Python worker when available. If parsing/scoring fails, the application is still received for manual review.
- An older recruiter batch-screening form remains available in the dashboard.

## Windows setup

Install a **Java 17+ JDK** (not just a JRE), Python 3.10+, and Node.js. Extract the ZIP. In PowerShell from the extracted `resume-review` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd frontend-react
npm ci
cd ..
$env:PATH = "$PWD\.venv\Scripts;$env:PATH"
.\start-local.ps1
```

On first start, set an admin password of at least 12 characters. Username: `admin`. Open `http://localhost:5173` for the recruiter dashboard and `http://localhost:5173/careers` for the local careers page. Press Ctrl+C in the startup terminal to stop the three services. The browser's local URL is accessible on the machine running it; external applicants require later hosting and network configuration.

## Data and upgrades

Flyway migration files live under `backend-java/src/main/resources/db/migration`. An existing nonempty H2 development database is baseline-marked at V1 and upgraded with V2; a fresh database receives V1 and V2. Back up the **whole** `backend-java/data/` folder before updating, since it contains both the database and stored resumes. Hibernate validates the schema instead of modifying it at startup. A tested backup/restore command remains on the roadmap.

The original uploaded ZIP remains unchanged. This new copy retires the Streamlit/Oracle and Colab paths. The job-board connectors, candidate status messaging, retention controls, mature validation, company isolation, and public deployment remain future phases. See `PROJECT_STATUS.md` and `CHANGELOG.md`.
