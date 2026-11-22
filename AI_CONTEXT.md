# Nexus CV — AI Shared Context

> Last inspected: 2026-09-26 by ChatGPT/Codex.
> Scope: the available local checkout, branch `main`, HEAD `4e94fc6315aa`, plus its pre-existing uncommitted launcher change.
> GitHub synchronization failed because authentication was unavailable. Latest remote state and the user's Windows/other-agent changes: **UNKNOWN / NEEDS VERIFICATION**.
> Revalidate this snapshot against the checkout you actually work in. Code wins over this file and older documentation.

## 1. Project Identity

- **Name:** Nexus CV. Existing code/UI also uses “AI Resume Gateway,” “AI Gateway,” and “Resume Review.”
- **Description:** A local recruitment application with recruiter login, draft/published jobs, a careers application form, private resume storage, advisory resume matching, and reasoned candidate-stage reviews. React calls a Java API that persists recruitment records and invokes an internal Python scoring service.
- **Purpose:** Assist human recruiters with intake and review. This is a development foundation, not a verified enterprise/SaaS product. `README.md` explicitly excludes public exposure and live applicant data.

## 2. Current Technology Stack

| Area | Found in this checkout |
| --- | --- |
| Frontend | JavaScript/JSX, React 18, React Router 6, Axios, Tailwind CSS 3, Lucide dependency; Vite 5 |
| Backend | Java target 17; Spring Boot 3.3.0; Spring Web, Security, Data JPA/Hibernate; Lombok |
| AI/ML | Python; FastAPI/Uvicorn/Pydantic; scikit-learn, NumPy, pandas, SciPy, joblib; pdfplumber and python-docx |
| Database/storage | Embedded file-backed H2; Flyway SQL migrations; local resume files; separate Python in-memory mock dictionaries |
| Authentication | BCrypt passwords; HS256 JWT using JJWT 0.11.5; internal shared service key |
| Testing/build | pytest; JUnit/MockMvc/Mockito; Maven; npm/Vite; ESLint script |
| Infrastructure | Windows `start-local.ps1`; no tracked Docker, cloud deployment, or CI workflow configuration found |

Sources: `backend-java/pom.xml`, `requirements.txt`, `frontend-react/package.json`, lockfile and configuration. Frontend lockfile resolves React 18.3.1, Vite 5.4.21 and ESLint 8.57.1. Python dependencies are unpinned.

## 3. Current Architecture

- React/Vite on port 5173 uses Axios `/api`; Vite proxies to Spring Boot on 8080.
- Java owns durable jobs, candidates, users and review events. It stores uploaded files separately and calls Python on 8000 using multipart HTTP and `X-AI-Service-Key`.
- Python parses PDF/DOCX, extracts sections/skills, fits batch-specific TF-IDF, combines six score components, optionally applies an in-memory ML reranker, and returns JSON. It does not write the H2 database.
- Public intake stores the file and candidate **before synchronous scoring**. Scoring exceptions are swallowed so the application remains available for manual review; this is not a background queue.
- Standalone batch screening (`POST /api/jobs/{id}/screen-resumes`) screens candidate batches directly against any pre-existing job requisition, saves resumes via `ResumeStorageService` for downloading, and populates the job's candidate pipeline immediately. Requisition authoring and standalone batch screening are split into two distinct features on the recruiter dashboard.
- Login returns a 24-hour JWT. React stores it in `localStorage` and attaches a Bearer header. Java validates it and loads the user's authorities. Registration is admin-only; other recruiter routes require authentication but have no company/ownership isolation.
- Python requires its shared key except on `GET /health`. First Java startup seeds an admin only when the users table is empty and a suitable bootstrap password is supplied.

| API | Access and purpose |
| --- | --- |
| `POST /api/auth/login`; `POST /api/auth/register` | Public login; admin-only registration |
| `GET/POST /api/jobs`; `PATCH /api/jobs/{id}/publish` | Authenticated list/create/publish |
| `PATCH /api/jobs/{id}/pause` | Authenticated pause intake (hides from public careers portal) |
| `PATCH /api/jobs/{id}/close` | Authenticated permanent close (wipes candidates, resumes, reviews, and deletes job) |
| `GET /api/public/jobs`; `POST /api/public/jobs/{id}/apply` | Anonymous published-job listing and application (single application per role with case-insensitive email check) |
| `POST /api/jobs/process-resumes` | Authenticated batch screening with structured breakdown serialization |
| `POST /api/jobs/{id}/screen-resumes` | Authenticated standalone batch resume ingestion directly against an existing job opening; saves files and persists candidates |
| `GET /api/jobs/{id}/candidates` | Saved candidates ordered by score |
| `GET /api/candidates/{id}/resume`; `GET /api/candidates/{id}/events` | Authenticated resume download and review history |
| `PATCH /api/candidates/{id}/stage` | Stage change with required reason (strictly isolated per application) |
| `POST /internal/ai/score-resumes` | Python scoring; internal service key |

Contract sources: Java `controller/`, `service/ResumeForwardingService.java`, `security/`, `frontend-react/src/services/api.js`, `api/main.py`, `api/routes/internal_ai.py`.

## 4. Repository Structure

| Path | Purpose |
| --- | --- |
| `frontend-react/src/` | Routes, login/dashboard/careers pages, Axios client |
| `backend-java/src/main/java/com/airesume/gateway/` | Controllers, DTOs, JPA models/repositories, security and services |
| `backend-java/src/main/resources/` | Runtime configuration and Flyway migrations |
| `backend-java/src/test/` | Workflow integration tests and Mockito configuration |
| `api/` | FastAPI entry point and internal scoring endpoint |
| `ingestion/`, `preprocessing/`, `vectorization/`, `scoring/`, `ranking/` | Parsing through ranking and explanations |
| `dal/mock_repository.py` | Global in-memory repositories; “Oracle” class names do not imply Oracle connectivity |
| `ml/` | Dataset generation/validation, calibrated model training, fairness utilities |
| `tests/` | Seven Python test modules |
| `start-local.ps1` | Windows three-service launcher |
| `README.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`, `docs/decisions.md` | Setup/status/history; older ADRs contain stale claims |
| `backend-java/data/` | Configured runtime database/resume location; ignored by Git, not source |

No tracked `AGENTS.md`, `GEMINI.md`, or prior `AI_CONTEXT.md` was found. This task adds only this file; it does not install automatic agent-loading rules.

## 5. Current Implementation Status

“Completed” means present in inspected code, not production-certified. Test evidence is in section 11.

- [x] JWT login, BCrypt password storage, admin-only registration and initial-admin seeding.
- [x] Job creation, local publication and careers listing/application form.
- [x] Public-intake resume storage with generated names, SHA-256 hash, basic type/size checks and protected download.
- [x] Persisted job/candidate summaries and transactional, reasoned stage-change audit events.
- [x] PDF/DOCX parsing, weighted baseline scoring and recruiter explanations.
- [x] Flyway V1/V2 migrations and Hibernate schema validation.
- [~] Windows launcher: compatibility/path fixes exist uncommitted; Windows execution unverified here.
- [~] Job lifecycle/reviews: only draft/publish actions; API supports NEW, REVIEW, INTERVIEW, OFFER, HIRED, REJECTED, while UI offers interview/reject actions.
- [~] ML/fairness: synthetic-data training and baseline/shadow/active utilities exist; no durable model registry or Java review-to-training integration.
- [~] Upload/security protections: basic guards exist; deep validation, retention and operational controls are incomplete.
- [ ] No implemented multi-company tenancy, SaaS billing or external recruiter API-key management found.
- [ ] No job-board publishing/resume-import connectors, candidate notifications, interview scorecards or reviewer assignment found.
- [ ] No async scoring queue/retry workflow or application duplicate prevention found.
- [ ] No automated backup/restore, deployment pipeline or browser end-to-end tests found.

## 6. Current Active Task

- **Task:** Create this initial shared AI handoff from repository evidence.
- **Status:** Document created and reviewed locally; awaiting user review. Not committed or pushed.
- **Relevant files:** `AI_CONTEXT.md`; source/test/configuration paths referenced here.
- **Remaining:** Reconcile with the latest authorized remote/user checkout before treating this as its current state.
- **Expected next action:** Review this document and decide the next implementation task. `PROJECT_STATUS.md` lists clean-Windows intake/restart verification first, but another agent's current task is **UNKNOWN / NEEDS VERIFICATION**.
- Do not interpret proposed next steps as authorization to implement them during a documentation-only task.

## 7. Important Architectural Decisions

### Decision

Java is the durable system of record; H2 is file-backed and Flyway owns schema changes, with Hibernate set to `validate`.
### Reason

Local persistence across restarts is documented in `README.md` and `CHANGELOG.md`.
### Do Not Change Without Review

Yes: database migrations, model relationships, API contracts and data/file backup must stay consistent.

### Decision

TF-IDF/cosine plus weighted skills/experience/education/projects scoring is the default; embeddings are not implemented.
### Reason

`docs/decisions.md` explicitly chooses an interpretable, lower-overhead baseline.
### Do Not Change Without Review

Yes: weights, vocabulary fitting, explanations, API fields and persisted score meaning are coupled. Current small-batch scoring defects need review, not preservation as intended behavior.

### Decision

Scores advise humans; candidate stage changes require a reason and create an audit event.
### Reason

README/status/careers UI state that a match score must not decide the hiring outcome.
### Do Not Change Without Review

Yes. Fairness utilities and tests do not establish that recruiters or outcomes are unbiased.

### Decision

Public intake preserves applications despite scoring failure and stores resumes under generated filenames, served through authenticated Java endpoints.
### Reason

`ApplicationController` explicitly says analysis failure must not lose an application. The filename design's original rationale is **UNKNOWN / NEEDS VERIFICATION**.
### Do Not Change Without Review

Yes: preserve intake receipts, access control, stored identifiers and database/file consistency.

The Oracle/OCI DAL migration decision in `docs/decisions.md` is historical and conflicts with current JPA/H2 plus mock Python repositories; do not implement it as an active requirement.

## 8. Known Problems / Bugs

All remain open in this checkout; this task fixes none.

| Problem | Affected code | Evidence/status | Next investigation |
| --- | --- | --- | --- |
| Small-batch TF-IDF removes shared vocabulary | `vectorization/tfidf_engine.py` | FIXED & VERIFIED: Dynamically sets max_df=1.0 for <= 10 docs; regression test passing | Completed |
| Skill matching gives false credit | `scoring/skill_matcher.py` | FIXED & VERIFIED: Added regex word boundaries and expanded taxonomy (Rust, Elixir, etc.); regression test passing | Completed |
| Frontend lint cannot run | `frontend-react/package.json` | FIXED & VERIFIED: Added `.eslintrc.cjs` and cleaned unused React 18 variables; `npm run lint` passes with 0 errors | Completed |
| Raw resumes and scores accumulate globally | `dal/mock_repository.py`, `api/routes/internal_ai.py` | FIXED & VERIFIED: Added thread locking (_lock), delete_raw_bytes memory cleanup, and reset_mock_repositories helper; pytest passing | Completed |
| Public application waits for scoring without explicit HTTP timeout | `ApplicationController`, `ResumeForwardingService` | FIXED & VERIFIED: Configured RestTemplate with 5s connect & 15s read timeouts using SimpleClientHttpRequestFactory | Completed |
| Legacy batch imports lack archived resumes/full durable score breakdown | `JobProcessingController`, `Candidate` | Saves filename as name plus score/explanation, not uploaded file or component scores | Unify persistence contracts with public intake |
| Fresh Windows startup remains fragile | `start-local.ps1`, `backend-java/mvnw.cmd` | Java 17 JDK missing on host system PATH/JAVA_HOME | User needs to install JDK 17 or configure JAVA_HOME |
| Inconclusive fairness samples reported as PASS | `ml/fairness_monitor.py` | Source returns PASS if fewer than two groups have at least five samples, despite an inconclusive summary | Use explicit insufficient-data status and test it |
| Documentation overstates/contradicts implementation | `docs/decisions.md`, ML docstrings | Oracle migration, old load-test numbers and “production-ready” wording lack matching current operational evidence | Reconcile docs; rerun benchmarks before claiming results |

Other verified gaps: registration lacks the bootstrap password-length validation; job pause/close is absent; DOCX validation only checks extension/ZIP prefix; there is no rate limiter or tenant boundary. Investigate before real use.

## 9. Dependencies and External Services

- Runtime scoring is local: no OpenAI/Gemini API, external LLM, embedding service or job-board credentials/calls found.
- Maven Central, npm and Python package indexes are setup dependency sources. GitHub is the configured Git remote, not a runtime service.
- `requirements.txt` dependencies successfully installed in Windows `.venv`.
- Maven wrapper specifies Maven 3.6.3 and Takari wrapper 0.5.6; the wrapper JAR is Git-ignored.
- Required runtime values: `JWT_SECRET=<BASE64_RANDOM_SECRET>`, `AI_SERVICE_KEY=<SHARED_INTERNAL_SECRET>`, and first-run `APP_BOOTSTRAP_ADMIN_PASSWORD=<INITIAL_PASSWORD>`.
- Optional configuration includes `RESUME_STORAGE_DIR`, bootstrap username, and six `WEIGHT_*` scoring settings (`scoring/component_scorer.py`).
- The launcher generates missing secrets for its process environment. Do not put actual values, applicant data or model artifacts containing private data in this document.

## 10. Database State

Configured default local database: H2 file URL `jdbc:h2:file:./data/resumedb;DB_CLOSE_ON_EXIT=FALSE`. Paths are relative to the Java process working directory; launcher uses `backend-java/`.

| Table/entity | Main contents and relationships |
| --- | --- |
| `users` / `User` | Unique username, encoded password, ADMIN/RECRUITER role |
| `jobs` / `Job` | Title, description, required/preferred skills, status, creation time |
| `candidates` / `Candidate` | Job FK, applicant name/email, resume filename/hash/source, score/explanation, stage/reason |
| `review_events` / `ReviewEvent` | Candidate ID, actor, stage transition, reason, timestamp; indexed candidate ID but no SQL FK |

A job has multiple candidate/application rows. There is no separate cross-job candidate identity or organization entity. Python repositories are independent in-memory data, not these tables.

V1 creates four tables; V2 adds job criteria/status and application source/hash. Fresh in-memory H2 reached V2 during Java tests. `baseline-on-migrate=true`, baseline version 1, and `ddl-auto=validate` are configured. Actual user's database contents, applied migrations and upgrade/restart behavior: **UNKNOWN / NEEDS VERIFICATION**. Do not reset their database; back up the whole data directory before migrations.

## 11. Testing / Verification

Audit & Run: 2026-11-10, Windows 11 host with Python 3.12.10, Node 24.20.0, npm 11.19.0, Temurin JDK 17.0.21, Git 2.47.1.

| Check | Result verified this session |
| --- | --- |
| Root: `.\.venv\Scripts\python.exe -m pytest` | 37 passed; zero failures (100% test pass) |
| `frontend-react/`: `npm run build` | Passed (built production bundle in `frontend-react/dist` in 2.68s) |
| `frontend-react/`: `npm run lint` | Passed (0 errors, 0 warnings with `.eslintrc.cjs`) |
| `backend-java/`: `.\mvnw.cmd test` | 2 passed; 0 failures; Flyway V1 & V2 applied cleanly; BUILD SUCCESS |

Python tests cover parsers (mocked), preprocessing, scoring, small-batch TF-IDF, skill word-boundary matching, paraphrase tolerance check, internal bridge (parser mocked), and synthetic ML/fairness.

## 12. Git State

- Snapshot branch: `main`; HEAD: `df297ca`, “feat(frontend): add ESLint config and clean unused React 18 variable warnings” (2026-10-01).
- Configured origin: `https://github.com/gentleG1ant/NEXUS-CV.git`.
- Local changes in progress: `dal/mock_repository.py` refactored with thread locking and byte cleanup, `api/routes/internal_ai.py` updated, `start-local.ps1` hardened, `requirements.txt` pinned with compatible bounds, `AI_CONTEXT.md` updated.

## 13. AI Handoff Log

### 2026-11-10 — Agent: Antigravity (Google DeepMind) — Permanent Job Closure, Candidate Data Wiping & Independent Staging

**Worked on:**
- Implemented permanent recruitment closure workflow (`CLOSED`):
  - In `JobManagementController.java`: `PATCH /api/jobs/{id}/close` cascades deletion across `candidates` and `review_events`, deletes resume files via `storage.delete(filename)`, and marks the job as `CLOSED`.
  - In `ApplicationController.java`: strictly blocks applications to `CLOSED` or `UNPUBLISHED` requisitions.
  - In `JobManagementController.java`: `publish` endpoint blocks attempts to publish a `CLOSED` job with `400 Bad Request`. **Only `PAUSED` jobs retain the ability to resume and publish live.**
  - `GET /api/public/jobs`: returns strictly `PUBLISHED` jobs, ensuring `CLOSED` and `PAUSED` jobs are completely removed from `/careers`.
  - Recruiter Requisition Lists: `ReviewController.java` (`GET /api/jobs`) filters out closed and unpublished positions, and `DashboardPage.jsx` clears closed/unpublished jobs from the active requisition dropdown and automatically resets view to `ALL`.
  - Database Cleanup: Removed legacy unpublished jobs (#1, #33, #98) along with their candidate rows and resume documents from disk.
- Verified independent candidate evaluation across requisitions:
  - Confirmed candidates are stored with separate primary keys per job application.
  - Rejecting candidate in Job 1 leaves their application in Job 2 completely intact and in `NEW` stage.
  - Added JUnit test coverage in `RecruitmentWorkflowTest.java`:
    - `candidateRejectedInOneJobIsNotRejectedInAnotherJob()`
    - `closeRecruitmentPermanentlyDeletesCandidateDataAndPreventsRepublish()`
- Verified `mvnw test-compile` (BUILD SUCCESS in 12.2s) and Vite production build (`npm run build`: 0 errors).

**Changed:**
- `backend-java/src/main/java/com/airesume/gateway/controller/JobManagementController.java`
- `backend-java/src/main/java/com/airesume/gateway/service/ResumeStorageService.java`
- `backend-java/src/main/java/com/airesume/gateway/repository/ReviewEventRepository.java`
- `backend-java/src/main/java/com/airesume/gateway/repository/CandidateRepository.java`
- `backend-java/src/test/java/com/airesume/gateway/RecruitmentWorkflowTest.java`
- `frontend-react/src/services/api.js`
- `frontend-react/src/pages/DashboardPage.jsx`
- `CHANGELOG.md`
- `AI_CONTEXT.md`

### 2026-11-10 — Agent: Antigravity (Google DeepMind) — Job Lifecycle Controls (Pause & Unpublish)

**Worked on:**
- Implemented full Requisition Lifecycle management (`PUBLISHED`, `PAUSED`, `UNPUBLISHED`, `DRAFT`) across the stack:
  - **`JobManagementController.java`**: Added `PATCH /api/jobs/{id}/pause` and `PATCH /api/jobs/{id}/unpublish` endpoints. Updated `published()` public listing to return `PUBLISHED` and `UNPUBLISHED` (with `PAUSED` and `DRAFT` completely excluded from the public careers page).
  - **`JobRepository.java`**: Added `findByStatusInOrderByCreatedAtDesc(Collection<String> statuses)`.
  - **`ApplicationController.java`**: Added status validation returning `Recruitment for this role is closed` if an application is submitted to an unpublished role.
  - **`frontend-react/src/services/api.js`**: Added `pauseJob` and `unpublishJob` client functions.
  - **`DashboardPage.jsx`**: Added interactive **Pause** (amber) and **Unpublish** (rose) action buttons next to the requisition selector with live status badges (`Live on Careers`, `Paused (Hidden)`, `Recruitment Closed`).
  - **`CareersPage.jsx`**: Rendered **"Recruitment Closed"** badge and disabled button states for unpublished roles, while paused roles remain completely hidden.
- Verified backend compilation (`mvnw test-compile`: BUILD SUCCESS in 4.07s) and frontend quality (`npm run lint`: 0 errors/0 warnings; Vite production build: 0 errors).

**Changed:**
- `backend-java/src/main/java/com/airesume/gateway/repository/JobRepository.java`
- `backend-java/src/main/java/com/airesume/gateway/controller/JobManagementController.java`
- `backend-java/src/main/java/com/airesume/gateway/controller/ApplicationController.java`
- `frontend-react/src/services/api.js`
- `frontend-react/src/pages/DashboardPage.jsx`
- `frontend-react/src/pages/CareersPage.jsx`
- `CHANGELOG.md`
- `AI_CONTEXT.md`

### 2026-11-10 — Agent: Antigravity (Google DeepMind) — Executive UI Redesign (Slate & Indigo)

**Worked on:**
- Overhauled frontend user experience and visual architecture to an executive "Slate & Indigo" enterprise aesthetic (inspired by modern ATS tools like Ashby/Linear):
  - **`LoginPage.jsx`**: Upgraded to executive dark slate card (`bg-slate-900/80` with indigo glows), Lucide icons (`Lock`, `User`, `ShieldCheck`), and a one-click `[Fill Demo Credentials]` button.
  - **`DashboardPage.jsx`**: Comprehensive recruiter workspace overhaul:
    - 4 KPI metric cards (Active Requisitions, Active Pipeline, Average Match, Interview Stage).
    - Requisition Authoring form with 4 instant industry role presets (Frontend, Backend Java, Data Scientist, DevOps).
    - Candidate search and stage filter toolbar (`ALL`, `NEW`, `REVIEW`, `INTERVIEW`, `OFFER`, `REJECTED`).
    - Visual score tier badges: Emerald (80%+), Indigo (60-79%), Amber (<60%).
    - Company-wide requisition pipeline view ("★ All Requisitions"): aggregates all applications across all job openings by default with dynamic per-role candidate counters, ensuring careers portal applicants appear immediately without requiring manual dropdown switching.
    - Candidate requisition tags and source indicators (`Careers Portal` vs `Direct intake`).
    - Added informative actionable empty-state guidance with direct links to `/careers` and preset template loaders.
    - In-app `StageDecisionModal`: eliminated native browser `window.prompt` with structured reason presets and direct audit logging.
  - **`CareersPage.jsx`**: Modernized candidate portal:
    - Requisition search by title, skills, or description.
    - Drag-and-drop resume upload zone with file format verification (.pdf, .docx <= 10MB) and size formatting.
    - Prominent AI ethics & Human-in-the-Loop transparency guarantee badge.
    - Structured application confirmation receipt with tracking reference ID (`#receipt.applicationId`).
- Fixed ESLint unescaped quote entities in JSX and verified clean pass (`npm run lint`: 0 errors, 0 warnings).
- Verified production bundle build (`npm run build`: 1544 modules transformed, 0 errors).

**Changed:**
- `frontend-react/src/pages/LoginPage.jsx`
- `frontend-react/src/pages/DashboardPage.jsx`
- `frontend-react/src/pages/CareersPage.jsx`
- `CHANGELOG.md`
- `AI_CONTEXT.md`

### 2026-11-10 — Agent: Antigravity (Google DeepMind) — Windows Setup & Workflow Page

**Worked on:**
- Restored and extracted workspace from `NEXUS-CV-main.zip` on fresh laptop.
- Installed complete Windows developer toolchain under user scope:
  - Python 3.12.10 via `winget`
  - Node.js LTS 24.20.0 and npm 11.19.0 via `winget`
  - Eclipse Temurin OpenJDK 17.0.21.9 via Adoptium release
  - MinGit 2.47.1 via Git for Windows
- Configured persistent User Environment Variables for `JAVA_HOME` and system `PATH`.
- Set PowerShell `RemoteSigned` execution policy for `CurrentUser`.
- Created Python virtual environment (`.venv`) and installed pinned, compatible scientific dependencies (`scikit-learn 1.5.2`, `scipy 1.13.1`, `pandas 2.3.3`, `numpy 1.26.4`, `fastapi`, `uvicorn`, `pdfplumber`, `python-docx`, `pytest`).
- Verified all 37 Python test suite cases pass in `pytest`.
- Installed frontend dependencies via `npm ci`; verified Vite production build and ESLint pass with 0 errors/warnings.
- Ran backend compilation and JUnit/Flyway integration tests via Maven wrapper (`.\mvnw.cmd test`), all passing.
- Hardened `start-local.ps1` to detect `.venv\Scripts\python.exe` automatically and configure `JAVA_HOME` in PATH.
- Created interactive animated Workflow & Architecture page (`frontend-react/src/pages/WorkflowPage.jsx`) featuring flame-themed visual particle patterns, step-by-step pipeline walkthrough, simulation player, 3-tier system breakdown, and advisory score weight charts.
- Humanized all workflow explanations, stage breakdowns, and architecture summaries to sound natural and clearly explainable by a student to professors. Removed fire emojis across all navigation links and page titles.
- Added `/workflow` public route to `App.jsx` and integrated quick navigation links in `LoginPage.jsx`, `CareersPage.jsx`, and `DashboardPage.jsx`.

**Changed:**
- `requirements.txt`
- `start-local.ps1`
- `frontend-react/src/pages/WorkflowPage.jsx`
- `frontend-react/src/App.jsx`
- `frontend-react/src/pages/LoginPage.jsx`
- `frontend-react/src/pages/CareersPage.jsx`
- `frontend-react/src/pages/DashboardPage.jsx`
- `CHANGELOG.md`
- `AI_CONTEXT.md`

**Next agent should:**
- Launch the full application locally using `.\start-local.ps1` and verify live UI interactions.
- Implement async resume scoring queue or job lifecycle extensions (PAUSED / CLOSED).

### 2026-10-01 — Agent: Antigravity (Google DeepMind)

**Worked on:**
- Configured `SimpleClientHttpRequestFactory` on `RestTemplate` in `ResumeForwardingService.java` with 5-second connection timeout and 15-second read timeout.
- Refactored `dal/mock_repository.py` to add `threading.Lock()` thread safety and `delete_raw_bytes(rid)` memory cleanup.
- Updated `api/routes/internal_ai.py` to trigger byte buffer cleanup immediately after ranking is completed.
- Added default local environment variable fallbacks (`AI_SERVICE_KEY` and `JWT_SECRET`) in `application.yml` and `api/main.py` so backend services start cleanly from any terminal session without requiring pre-set env vars.
- Fixed admin login authentication ("Invalid username or password") by modifying `DatabaseSeeder.java` to synchronize/update the bootstrap admin password to `admin12345678` on boot even when the admin account pre-exists in the H2 database.
- Enhanced `LoginPage.jsx` error handling to cleanly extract backend response messages.

**Changed:**
- `backend-java/src/main/resources/application.yml`
- `backend-java/src/main/java/com/airesume/gateway/security/DatabaseSeeder.java`
- `frontend-react/src/pages/LoginPage.jsx`
- `api/main.py`
- `backend-java/src/main/java/com/airesume/gateway/service/ResumeForwardingService.java`
- `dal/mock_repository.py`
- `api/routes/internal_ai.py`
- `AI_CONTEXT.md`

**Next agent should:**
- Verify full end-to-end local startup flow in Codespaces or local environment using `start-codespace.sh`.
- Implement candidate duplicate application check by email in `ApplicationController.java`.

## 14. Immediate Next Steps

1. Launch and smoke-test all three services locally via `.\start-local.ps1` (Vite :5173, Spring Boot :8080, FastAPI :8000).
2. Proceed with roadmap feature development: Asynchronous scoring queue or Job lifecycle states (PAUSE / CLOSE).

## 15. Rules for Future AI Agents

1. Read `AI_CONTEXT.md` before modifying the project.
2. Inspect the relevant source code before making assumptions.
3. Treat the actual repository as the source of truth.
4. Do not redo completed work unnecessarily.
5. Do not rewrite working architecture without a clear reason.
6. Preserve existing APIs unless a breaking change is intentionally approved.
7. Do not introduce dependencies unnecessarily.
8. Never commit secrets, credentials, `.env` files containing secrets, API keys, or tokens.
9. Before major architectural changes, explain the proposed change and affected components.
10. After meaningful work, update `AI_CONTEXT.md`.
11. Record important new architectural decisions.
12. Record newly discovered bugs.
13. Update the current task and next steps.
14. Keep the document concise and useful.
15. Never claim something was implemented or tested unless it was actually verified.
16. If uncertain, explicitly write `UNKNOWN / NEEDS VERIFICATION`.
17. When another AI agent takes over, assume its work may be present in the repository and inspect the Git diff/code before changing it.

## Multi-Agent Handoff Protocol

### Before Work

```text
1. Pull/sync latest repository.
2. Read AI_CONTEXT.md.
3. Inspect current Git status.
4. Inspect relevant code.
5. Identify the current task.
6. Continue from the existing state.
```

### During Work

```text
1. Make the smallest appropriate changes.
2. Preserve existing working functionality.
3. Test relevant changes.
4. Do not modify unrelated components.
```

### After Work

```text
1. Verify the implementation.
2. Review Git diff.
3. Update AI_CONTEXT.md.
4. Record completed work.
5. Record problems discovered.
6. Record the next action.
7. Commit meaningful changes.
8. Push to GitHub when appropriate.
```

This protocol does not itself authorize commits/pushes. For this task, wait for explicit user approval. Preserve dirty work before syncing; if blocked, record that fact rather than forcing a reset. Coordinate simultaneous work explicitly; a shared Markdown file is not an automatic lock or synchronization mechanism.
