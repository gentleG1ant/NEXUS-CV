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
| Small-batch TF-IDF removes shared vocabulary | `vectorization/tfidf_engine.py` | Reproduced: two documents sharing “python” score zero context; identical documents raise `ValueError` after pruning with `max_df=0.95` | Add small-corpus regression tests and review fitting strategy |
| Skill matching gives false credit | `scoring/skill_matcher.py` | Reproduced: “JavaScript” extracts Java too; required “Rust” with a Python resume yields required score 1.0 because taxonomy misses Rust | Test token boundaries and explicit unknown requirements |
| Raw resumes and scores accumulate globally | `dal/mock_repository.py`, `api/routes/internal_ai.py` | Source-verified process-global dictionaries retain bytes without cleanup; not request-local or durable | Define lifecycle/isolation, then test concurrent requests |
| Public application waits for scoring without explicit HTTP timeout | `ApplicationController`, `ResumeForwardingService` | Source-verified synchronous call and unconfigured `RestTemplate` timeouts | Test slow-worker behavior; design bounded timeout/queue |
| Legacy batch imports lack archived resumes/full durable score breakdown | `JobProcessingController`, `Candidate` | Saves filename as name plus score/explanation, not uploaded file or component scores | Unify persistence contracts with public intake |
| Frontend lint cannot run | `frontend-react/package.json` | `npm run lint` fails: no ESLint configuration | Add reviewed config and generated-output exclusions |
| Fresh Windows startup remains fragile | `start-local.ps1`, `backend-java/mvnw.cmd` | Wrapper JAR is untracked; current launcher rejects its absence before wrapper download; wrapper needs JAVA_HOME while launcher only checks java | Verify clean setup; preserve/review pre-existing launcher diff |
| Inconclusive fairness samples reported as PASS | `ml/fairness_monitor.py` | Source returns PASS if fewer than two groups have at least five samples, despite an inconclusive summary | Use explicit insufficient-data status and test it |
| Documentation overstates/contradicts implementation | `docs/decisions.md`, ML docstrings | Oracle migration, old load-test numbers and “production-ready” wording lack matching current operational evidence | Reconcile docs; rerun benchmarks before claiming results |

Other verified gaps: registration lacks the bootstrap password-length validation; job pause/close is absent; DOCX validation only checks extension/ZIP prefix; there is no rate limiter or tenant boundary. Investigate before real use.

## 9. Dependencies and External Services

- Runtime scoring is local: no OpenAI/Gemini API, external LLM, embedding service or job-board credentials/calls found.
- Maven Central, npm and Python package indexes are setup dependency sources. GitHub is the configured Git remote, not a runtime service.
- `requirements.txt` includes unpinned `httpx2`; clean installation compatibility is **UNKNOWN / NEEDS VERIFICATION**. Existing-environment test success is not proof of reproducible installation.
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

V1 creates four tables; V2 adds job criteria/status and application source/hash. Fresh in-memory H2 reached V2 during this audit's Java tests. `baseline-on-migrate=true`, baseline version 1, and `ddl-auto=validate` are configured. Actual user's database contents, applied migrations and upgrade/restart behavior: **UNKNOWN / NEEDS VERIFICATION**. Do not reset their database; back up the whole data directory before migrations.

## 11. Testing / Verification

Audit run: 2026-09-26, Linux workspace with Python 3.12.14, Node 24.19.0, JDK 17.0.20.1 and separately available Maven 3.9.9. No dependency installations/upgrades were performed.

| Check | Result verified this audit |
| --- | --- |
| Root: `PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -q -p no:cacheprovider` | 34 passed; six scikit-learn deprecation warnings |
| `backend-java/`: Maven 3.9.9 `mvn -o test -B` with JDK 17 | 2 passed, zero failures/errors; fresh Flyway V1/V2 applied |
| `frontend-react/`: `npm run build` | Passed using existing dependencies |
| `frontend-react/`: `npm run lint` | Failed, exit 2: missing ESLint configuration |
| Synthetic direct scoring probes | Reproduced TF-IDF/skill problems in section 8; not yet committed regression tests |

Python tests cover parsers (mocked), preprocessing, scoring, a paraphrase tolerance check, internal bridge (parser mocked), and synthetic ML/fairness. Java tests use MockMvc, in-memory H2, mocked scoring and mock users; they are not a real JWT-login or full-service end-to-end run. Parser OCR, actual hiring fairness and throughput are not established.

No failing pytest/JUnit tests observed in these runs. The Java run warns about Flyway's tested H2 version range. Windows/PowerShell, wrapper Maven 3.6.3, Java 27, clean dependency installation, browser flows, persistence after restart and old benchmark claims: **UNKNOWN / NEEDS VERIFICATION**.

Setup/run references (not executed as a full stack this audit):
- Root: `python -m venv .venv`, then on Windows `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`.
- Frontend: `npm.cmd ci`, then `npm.cmd run dev`.
- Python, root: `.\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000`.
- Java, `backend-java/`: `.\mvnw.cmd spring-boot:run` with JAVA_HOME and required runtime values set.
- Combined Windows launcher, root: `.\start-local.ps1`; see its known prerequisite issues.
- Browser routes: `/login`, `/dashboard`, `/careers` at localhost:5173.

Earlier success claims in `PROJECT_STATUS.md`/`CHANGELOG.md` are historical documentation, not newly rerun evidence.

## 12. Git State

- Snapshot branch: `main`; HEAD: `4e94fc6315aa`, “Build local recruitment platform foundation” (2026-09-26).
- Configured origin: `https://github.com/gentleG1ant/NEXUS-CV.git`.
- No upstream configured for this local branch. Remote HEAD/other branches: **UNKNOWN / NEEDS VERIFICATION**; `git ls-remote --heads origin` failed because credentials were unavailable.
- Before this task: `start-local.ps1` already modified (22 insertions, 4 deletions). It adds local Python/Node discovery, compatible random-secret generation, missing-wrapper check and service-specific exit messages. Preserved unchanged.
- This task adds only untracked `AI_CONTEXT.md`; no commits or pushes. Test/build outputs are ignored artifacts.
- Last locally verified code milestone: local recruitment foundation plus job publication/application-intake slice, represented by HEAD and the changelog. Do not infer later agent work from this snapshot.

## 13. AI Handoff Log

### 2026-09-26 — Agent: ChatGPT/Codex

**Worked on:**
- Repository/source/configuration audit and initial shared handoff.

**Changed:**
- Added only `AI_CONTEXT.md`; preserved the pre-existing launcher diff.

**Completed:**
- Mapped architecture/schema/API and separated mock/partial features.
- Reran Python/Java tests, frontend build/lint and targeted scoring probes.

**Issues discovered:**
- Lint failure, small-batch scoring and skill-matching defects; other source-confirmed gaps in section 8.
- Latest remote/Windows state could not be verified.

**Next agent should:**
- Reconcile with an authorized up-to-date checkout; review this file and existing changes before choosing the next task. Do not assume startup or real-world fairness is verified.

## 14. Immediate Next Steps

These are recommendations, not already authorized implementation work.

1. Sync/inspect the actual latest checkout without discarding other agents' work; refresh this snapshot.
2. Review the launcher diff and verify clean Windows setup plus login, intake, resume download and persistence after restart.
3. Add regressions and fix TF-IDF small-batch behavior and skill-matching false credit.
4. Establish ESLint configuration and reproducible Python dependency installation.
5. Remove process-global resume retention; introduce bounded scoring behavior and explicit analysis failure/retry states.
6. Before real applicants/SaaS, review access isolation, upload abuse controls, retention/backup and fairness evaluation; keep decisions human-reviewed.

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
