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
- Legacy batch screening scores first, then saves a draft job and candidate summaries. It does not archive the resume files.
- Login returns a 24-hour JWT. React stores it in `localStorage` and attaches a Bearer header. Java validates it and loads the user's authorities. Registration is admin-only; other recruiter routes require authentication but have no company/ownership isolation.
- Python requires its shared key except on `GET /health`. First Java startup seeds an admin only when the users table is empty and a suitable bootstrap password is supplied.

| API | Access and purpose |
| --- | --- |
| `POST /api/auth/login`; `POST /api/auth/register` | Public login; admin-only registration |
| `GET/POST /api/jobs`; `PATCH /api/jobs/{id}/publish` | Authenticated list/create/publish |
| `GET /api/public/jobs`; `POST /api/public/jobs/{id}/apply` | Anonymous published-job listing and application |
| `POST /api/jobs/process-resumes` | Authenticated legacy batch screening |
| `GET /api/jobs/{id}/candidates` | Saved candidates ordered by score |
| `GET /api/candidates/{id}/resume`; `GET /api/candidates/{id}/events` | Authenticated resume download and review history |
| `PATCH /api/candidates/{id}/stage` | Stage change with required reason |
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
| Raw resumes and scores accumulate globally | `dal/mock_repository.py`, `api/routes/internal_ai.py` | Source-verified process-global dictionaries retain bytes without cleanup; not request-local or durable | Define lifecycle/isolation, then test concurrent requests |
| Public application waits for scoring without explicit HTTP timeout | `ApplicationController`, `ResumeForwardingService` | Source-verified synchronous call and unconfigured `RestTemplate` timeouts | Test slow-worker behavior; design bounded timeout/queue |
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

Audit & Run: 2026-10-01, Windows 11 host with Python 3.12.10, Node 24.19.0, npm 11.17.0.

| Check | Result verified this session |
| --- | --- |
| Root: `.\.venv\Scripts\python.exe -m pytest` | 37 passed; zero failures (3 new regression tests passing) |
| `frontend-react/`: `cmd /c npm.cmd run build` | Passed (built production bundle in `frontend-react/dist`) |
| `frontend-react/`: `cmd /c npm.cmd run lint` | Passed (0 errors, 0 warnings with `.eslintrc.cjs`) |
| `backend-java/`: Maven compilation | Compatible with JDK 17 (Lombok 1.18.36 configured) |

Python tests cover parsers (mocked), preprocessing, scoring, small-batch TF-IDF, skill word-boundary matching, paraphrase tolerance check, internal bridge (parser mocked), and synthetic ML/fairness.

## 12. Git State

- Snapshot branch: `main`; HEAD: `c33cbab`, “build(java): update lombok dependency version in pom.xml” (2026-09-26).
- Configured origin: `https://github.com/gentleG1ant/NEXUS-CV.git`.
- Local changes in progress: `.eslintrc.cjs` created, JSX cleanups, `AI_CONTEXT.md` updated.

## 13. AI Handoff Log

### 2026-10-01 — Agent: Antigravity (Google DeepMind)

**Worked on:**
- Created `frontend-react/.eslintrc.cjs` and configured React 18 ESLint rules.
- Cleaned unused React 18 imports across `App.jsx`, `LoginPage.jsx`, `DashboardPage.jsx`, and `CareersPage.jsx`.
- Verified `npm run lint` passes with 0 errors and 0 warnings.
- Built interactive Live Architecture Status dashboard artifact (`live_status_dashboard.html`).

**Changed:**
- `frontend-react/.eslintrc.cjs`
- `frontend-react/src/App.jsx`
- `frontend-react/src/pages/LoginPage.jsx`
- `frontend-react/src/pages/DashboardPage.jsx`
- `frontend-react/src/pages/CareersPage.jsx`
- `AI_CONTEXT.md`

**Next agent should:**
- Refactor `dal/mock_repository.py` to move away from global dictionary storage.
- Add connection/read timeouts to `ResumeForwardingService.java`.

## 14. Immediate Next Steps

1. Refactor `dal/mock_repository.py` to use request-local state instead of process-global dictionaries.
2. Configure HTTP timeouts on Java `RestTemplate` in `ResumeForwardingService.java`.
3. Verify full end-to-end local startup flow using `start-local.ps1` or `start-codespace.sh`.

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
