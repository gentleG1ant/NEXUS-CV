# Changelog

## 2026-11-22 — Restored Single Admin Sign-In & Maintained Demo Password Button Removal

- **Reverted to Single Admin Login**:
  - Simplified [LoginPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/LoginPage.jsx) back to a dedicated, clean sign-in card (username + password) without registration tabs or public signup flows.
  - Re-secured `/api/auth/register` to `hasRole("ADMIN")` in [SecurityConfig.java](file:///c:/Users/HP/Downloads/NEXUS-CV-main/backend-java/src/main/java/com/airesume/gateway/security/SecurityConfig.java).
- **Kept Demo Button Removed**:
  - The demo credentials fill button remains completely removed.
- **Retained Enhancements**:
  - Kept password show/hide visibility toggle (`<Eye />` / `<EyeOff />`).
  - Kept "Remember username" preference option with clean browser password manager support.

## 2026-11-22 — Recruiter Authentication: User Registration, Password Validation, Remember Credentials & Demo Removal

- **New Recruiter Registration & User Signup**:
  - Implemented tabbed authentication modal in [LoginPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/LoginPage.jsx) toggling seamlessly between **Sign In** and **New Registration**.
  - Permitted public self-service recruiter signup on `/api/auth/register` in [SecurityConfig.java](file:///c:/Users/HP/Downloads/NEXUS-CV-main/backend-java/src/main/java/com/airesume/gateway/security/SecurityConfig.java).
  - Backend validation in [AuthController.java](file:///c:/Users/HP/Downloads/NEXUS-CV-main/backend-java/src/main/java/com/airesume/gateway/controller/AuthController.java) and [AuthService.java](file:///c:/Users/HP/Downloads/NEXUS-CV-main/backend-java/src/main/java/com/airesume/gateway/service/AuthService.java) ensuring minimum 6-character passwords and duplicate username collision checks with descriptive error responses.
- **Password Validation & Visibility**:
  - Added password confirmation field for new registrations with real-time matching indicator (`✓ Passwords match` / `✕ Passwords do not match`).
  - Added length criteria indicator (`✓ At least 6 characters`).
  - Added password show/hide visibility toggle with `<Eye />` and `<EyeOff />` icons.
- **Remember Password & Credential Persistence**:
  - Added "Remember username & password" checkbox storing user preferences across sessions.
  - Standardized HTML5 `<form autoComplete="on">` attributes to trigger native browser password manager save/update prompts.
- **Removed Demo Fill Button**:
  - Completely removed the demo credentials fill button and associated state.

## 2026-11-22 — Unified Candidate Output: Removed Separate Direct Batch Ranking Box

- **Consolidated Candidate Pipeline Output**:
  - Removed the separate duplicate `Direct Batch Ranking Output` section from [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx).
  - All screened candidates (whether ingested via standalone batch upload or received directly from the Career Portal) appear unified in one single place: the primary Recruitment Pipeline list, equipped with stage filters, search, criteria calibration, and review & stage actions.

## 2026-11-22 — Removed Requisition & Application Number `#no` Tags Across Portal & Dashboard

- **Removed Application Reference Numbers & Requisition IDs**:
  - In [CareersPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/CareersPage.jsx):
    - Removed `#{selected?.id}` from the application confirmation message, replaced with the clean job title: `Thank you for applying. Your resume has been securely received for [Job Title]`.
    - Removed the `Tracking Reference: #{receipt.applicationId}` box entirely.
    - Removed `REQ-XXX` number badges from all requisition cards.
  - In [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx):
    - Removed `(#{job.id})` and `#{job.id}:` from both the active pipeline and batch ingestion requisition dropdowns.
    - Removed `(#{candidate.jobId})` and `Application #{id}` from candidate pipeline cards and evaluation modals.
    - Removed `#{id}` from all draft, publish, and batch ingestion notification messages.

## 2026-11-22 — Job Role Lifecycle: Permanent Candidate Deletion on Job Removal & Candidate Retention across Requisitions

- **Candidate Retention While Role is Active**:
  - Ensured that candidate applications and total applicant counts are strictly retained and stay attached to their requisition across all lifecycle states (`DRAFT`, `PUBLISHED`, `PAUSED`).
  - Improved type matching (`Number(c.jobId) === numId`) in pipeline filtering and requisition selection to prevent applicants from ever being hidden or dropped when filtering or refreshing.
  - Updated Active Pipeline KPI ribbon indicator to accurately label total vs. role-specific applicants (`applicants across all roles` vs `applicants in role`).
- **Complete Candidate Loss on Job Role Deletion**:
  - Added dedicated **"Delete Job Role"** action across all job states (`PUBLISHED`, `PAUSED`, and `DRAFT`) with red destructive styling and confirmation modal informing recruiters of the exact count of candidates being wiped.
  - Backend: Enhanced `JobManagementController.java` to perform explicit transactional flushes (`candidates.flush()`, `jobs.flush()`), guaranteeing all candidates, resume files on disk, and review audit events attached to the deleted role are permanently wiped.
  - Frontend: On role deletion, immediately clears batch results, closes candidate modals, resets target batch job if matching, resets active selection to `'ALL'`, and refreshes pipeline totals so all candidate applications for that deleted job are lost from metrics and UI.

## 2026-11-22 — Candidate Review & Stage View: Removed Independent Requisition Scope Explanation Notice

- **Removed Independent Requisition Scope Notice in Candidate Evaluation Modal**:
  - Removed the explanatory notice callout (`Independent Requisition Scope`) from the candidate review modal in [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx).
  - Kept all core review and staging functionality 100% intact: recruiters can view candidate details, evaluation dimension breakdowns, match scores, strengths/gaps, decision audit history, and advance or reject candidates with custom justifications.

## 2026-11-22 — Formal Enterprise Typography (Plus Jakarta Sans & JetBrains Mono) & Executive Format Elevation

- **Formal Enterprise Typography Stack**:
  - Integrated **Plus Jakarta Sans** (weights 300 to 800) as the primary font family across the application via Google Fonts and Tailwind font stack configuration.
  - Integrated **JetBrains Mono** (weights 400 to 700) for numerical metrics, percentage scores, requisition tracking codes (`REQ-001`), and data tokens.
  - Configured tightened letter-tracking (`-0.012em`) and anti-aliased font smoothing for an editorial enterprise aesthetic.
- **Executive Visual Format Elevation**:
  - **Career Portal**:
    - Replaced generic saturated background blobs with a subtle radial mesh vignette.
    - Upgraded navigation header with formal brand mark, live intake badge, and discreet recruiter access button.
    - Formalized Requisition Cards with structured metadata headers (status indicator dot, `Full-Time`, department tags, and monospace requisition code `REQ-XXX`).
    - Elevated technical competency badges to refined dark slate borders.
    - Polished action button: high-contrast `Apply for Position` with directional arrow icon.
  - **Recruiter Dashboard**:
    - Upgraded KPI ribbon with high-contrast monospace metrics (`text-3xl font-extrabold font-mono text-white`) and uppercase micro-labels.
    - Updated candidate score badges to display tabular monospace percentages (`font-mono font-bold {pct}%`).
    - Standardized stage badges (`INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `NEW`) with dark-slate enterprise styling.

## 2026-11-22 — Unified Career Portal Branding & Star Symbol Removal

- **Unified Career Portal Branding**:
  - Renamed the candidate-facing portal header, page title, and tab title uniformly to **Career Portal** across all screens (replacing previous variations of "Public Careers Portal" and "Job Portal").
  - Updated all navigation links and toast notifications in [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx), [LoginPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/LoginPage.jsx), and [WorkflowPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/WorkflowPage.jsx) to reference **Career Portal**.
  - Simple, bold heading on the portal: **Career Portal** (`<h1>Career Portal</h1>`).
  - No footers on the Career Portal page.
- **Removed Star Symbol from Screening Button**:
  - Removed the star/sparkle icon from the **Select Resumes to Screen** / **Screen & Ingest Resumes** button in [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx) to ensure clean, mature button styling.
  - Also replaced the sparkle icon on the login demo-credentials button with a clean user icon.
- **Removed Star Marks Across Website**:
  - Removed star marks (`★`) from the requisition selector (`All Requisitions`).
  - Confirmed 0 star symbols across the entire application codebase.
- **Removed System Architecture Navigation Buttons**:
  - Removed the `System Architecture` link from the main navbar in [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx).
  - Removed the `System Workflow & Architecture` link from [LoginPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/LoginPage.jsx).

## 2026-11-22 — Standalone Batch Resume Ingestion & Distinct Requisition Separation

- **Separation of Job Requisition Creation and Batch Resume Ingestion**:
  - Decoupled resume screening from job creation into two distinct, dedicated features on the recruiter dashboard.
  - **Requisition Authoring**:
    - Pure authoring workflow: Preset templates, Role Title, Required Skills, and Job Description/Qualifications.
    - Two clean actions: "Save as Draft" (`saveDraft`) and "Publish Live Now" (`createAndPublish`) without any resume upload inputs.
  - **Standalone Batch Resume Ingestion**:
    - **Target Requisition Selection**: Recruiters can select any existing job opening from a dropdown and immediately view a live criteria summary card (Title, Status, and Required Skills chips).
    - **Multi-File Resume Dropzone**: Drag-and-drop and file-browser dropzone supporting batch `.pdf` and `.docx` uploads.
    - **Queued File Management**: Real-time list of staged files showing names, sizes in KB, and individual remove buttons with a "Clear all" option.
    - **Direct AI Screening**: One-click screening (`uploadResumesToJob`) that scores and attaches all resumes directly to the chosen requisition, immediately updating the talent pipeline without creating duplicate requisitions.
  - **Recruiter Pipeline Shortcuts**:
    - Added `[ ⚡ Batch Screen Resumes for this Role ]` shortcut in the empty pipeline state to immediately stage candidate resumes for that job.
- **Backend Batch Ingestion API**:
  - Implemented `POST /api/jobs/{jobId}/screen-resumes` in `JobProcessingController.java`:
    - Validates target requisition exists and is not closed/unpublished.
    - Saves uploaded files to disk via `ResumeStorageService.store(file)` so they are downloadable from the dashboard.
    - Forwards files to `resumeForwardingService.forwardToAiService(...)` to score against the target job's title, description, and required/preferred skills.
    - Persists candidates with serialized multi-component AI feedback JSON, match scores, file paths, and hashes under the target `job_id`.
- **Python Skill Taxonomy & Role Synonym Expansion**:
  - Updated `scoring/skill_matcher.py` with role title synonyms and equivalents (`sde`, `swe`, `software development engineer` $\to$ `software developer`, `front end`/`back end`/`full stack` variants) in `SKILL_TAXONOMY` and `SKILL_SYNONYMS`.
  - All 37 unit tests in Python test suite passed (`pytest`: 37/37 passed in 5.52s).

## 2026-11-22 — Interactive "What-If" Weight Simulator & Real-Time Candidate Re-Ranking

- **Interactive "What-If" Weight Simulator**:
  - Implemented clean client-side talent match simulation engine in [DashboardPage.jsx](file:///c:/Users/HP/Downloads/NEXUS-CV-main/frontend-react/src/pages/DashboardPage.jsx) focused on direct slider control:
    - **Required Technical Skills**: 0% – 100%
    - **Experience & Seniority**: 0% – 100%
    - **Education Criteria**: 0% – 100%
    - **Preferred Stack Fit**: 0% – 100%
    - **Semantic & Domain Context**: 0% – 100%
  - **Real-Time Client-Side Re-Ranking**:
    - Instant dynamic composite score recalculation: $Score_{sim} = \frac{\sum w_i s_i}{\sum w_i}$.
    - Real-time re-sorting of candidate pipeline with live rank position badges (`#1`, `#2`, etc.).
    - **Rank Shift Indicators**: Visual tracking comparing baseline ranking vs. simulated ranking (`▲ +2`, `▼ -1`, or `=` unchanged).
    - **Visual Weight Distribution**: Multi-color stacked balance bar showing normalized component distribution in real time.
    - **KPI Ribbon Sync**: Average Match KPI updates with live simulation indicators (`simulated model`).
    - **Review Modal Sync**: Review & Stage modal reflects both simulated score and baseline score.
- Verified test suite (`mvnw test`: 5/5 tests passing), `npm run lint` (0 errors, 0 warnings), and Vite production build (0 errors).

## 2026-11-22 — Detailed Skill Match Breakdown, Role-Scoped Candidate Isolation & Single Application Intake

- **Detailed Skill Match Breakdown**:
  - Implemented structured skill match breakdown serialization in `ApplicationController.java` and `JobProcessingController.java`, persisting rich match telemetry into `aiFeedback`:
    - `skills_required_score`, `skills_preferred_score`, `experience_score`, `education_score`, `global_context_score`.
    - Key verified strengths (`strengths`), missing competencies/skill gaps to probe (`skill_gaps`), and domain keywords (`top_matching_terms`).
    - Recruiter explanation text (`explanation`).
  - Added robust parser `parseCandidateExplanation` in `DashboardPage.jsx` supporting both structured JSON and legacy text fallbacks.
  - **Candidate Cards**: Added compact skill match highlight chips directly on applicant cards (Emerald checks for top verified competencies, Rose for identified gaps, and Slate/Sky for domain keyword tags).
  - **Review & Stage Modal**: Integrated full **Skill & Component Dimension Breakdown**:
    - Progress bars visualizing Required Skills Coverage, Preferred Skills Fit, Experience Alignment, Education Criteria, and Semantic Relevance.
    - Verified Competencies & Strengths chip grid (Emerald pills).
    - Skill Gaps & Competencies to Probe chip grid (Rose/Amber pills).
    - Top Matching Domain Keywords (Sky/Indigo tags).
    - Recruiter Advisory Note with synthesized AI feedback.
- **Independent Candidate Staging & Role Isolation**:
  - Confirmed that candidates are evaluated strictly on a per-requisition application basis (`candidate_id` / `job_id`). Rejection or selection in one role does not alter, label, or impact their status in other roles.
  - Added clear role badge (`Role: <JobTitle> (#<JobId>)`) on candidate cards and requisition context in the Review & Stage modal.
  - Added an explicit **Independent Requisition Scope** notification in the modal confirming that stage decisions (`NEW`, `INTERVIEW`, `REJECTED`, etc.) are isolated to the specific requisition and candidates remain eligible and unencumbered for other positions.
- **Single Application Intake Per Active Job Role (Case-Insensitive Email)**:
  - In `ApplicationController.java`, normalized email intake (`email.trim().toLowerCase(Locale.ROOT)`) and enforced single submission per active job role using `candidates.existsByEmailIgnoreCaseAndJobId(normalizedEmail, jobId)`.
  - Added derived Spring Data JPA query `existsByEmailIgnoreCaseAndJobId` in `CandidateRepository.java`.
  - Returns HTTP 409 Conflict with friendly message: `"You have already submitted an application for this position. You may apply for other open roles, but only one application is permitted per role."`
  - In `CareersPage.jsx`, added dedicated Amber warning banner for duplicate applications, guiding candidates to apply for any of the other open positions available.
- **Automated Verification**:
  - Added integration test `singleApplicationPerActiveJobRoleWithCaseInsensitiveEmail` to `RecruitmentWorkflowTest.java`, validating:
    - First application with mixed-case email to Job 1 succeeds (201 Created).
    - Second application with lowercase email to Job 1 fails with 409 Conflict.
    - Application with identical email to Job 2 succeeds (201 Created), validating candidate cross-role eligibility.
  - Verified full test suite (`mvnw test`): **5/5 tests passed with 0 failures, 0 errors**.
  - Verified frontend code quality: `npm run lint` (0 errors, 0 warnings), Vite production build (built in 12.7s).

- **Permanent Recruitment Closure (`CLOSED`)**:
  - Implemented `PATCH /api/jobs/{id}/close`: Permanently wipes all candidate database records (`candidates`), immutable review event history (`review_events`), and stored resume files on disk (`storage.delete`) associated with the closed requisition.
  - The closed job is completely removed from the public careers portal (`/careers`).
  - **Cleared from Recruiter Requisition Lists**: Closed and unpublished job postings are now completely cleared from the active requisition dropdown and KPI counts on the recruiter dashboard (`DashboardPage.jsx`), and filtered out in `ReviewController.java` (`GET /api/jobs`).
  - **Database Cleanup**: Executed cleanup removing legacy unpublished jobs (`#1`, `#33`, `#98`), cascading deletion across candidate records, review history, and uploaded resume files on disk.
  - **Re-publish protection**: Requisitions in `CLOSED` status cannot be republished (`400 Bad Request`). Only requisitions in `PAUSED` status retain the ability to resume and publish live again.
- **Independent Candidate Staging Verification**:
  - Verified and confirmed that candidates are evaluated strictly on a per-application basis (`candidate_id` / `job_id`). Rejection in one job requisition does not affect or reject the same candidate's applications in any other requisition.
  - Added full test coverage in `RecruitmentWorkflowTest.java`:
    - `candidateRejectedInOneJobIsNotRejectedInAnotherJob()`: Proves that rejecting a candidate in Job 1 leaves their application in Job 2 unchanged (`NEW`).
    - `closeRecruitmentPermanentlyDeletesCandidateDataAndPreventsRepublish()`: Proves that closing a job wipes all candidate rows from database and blocks republishing attempts.
- Verified test compilation (`mvnw test-compile`: BUILD SUCCESS) and React frontend build (`npm run build`: 0 errors).

## 2026-11-10 — Requisition Lifecycle: Pause and Unpublish controls

- Implemented Job Requisition lifecycle status controls (`PUBLISHED`, `PAUSED`, `UNPUBLISHED`, `DRAFT`) across backend and frontend:
  - **Pause (`PAUSED`)**: Hides the requisition completely from the public `/careers` portal, preventing incoming applications while keeping all existing applicant history intact in the recruiter dashboard.
  - **Unpublish (`UNPUBLISHED`)**: Keeps the requisition visible on the public `/careers` portal with a clear **"Recruitment Closed"** badge, disables the "Apply for Role" action, and returns HTTP 400 with "Recruitment for this role is closed" if an intake request is submitted.
  - **Resume / Republish (`PUBLISHED`)**: Reopens and unpauses candidate intake at any time with a single click.
- Backend additions:
  - Added `PATCH /api/jobs/{id}/pause` and `PATCH /api/jobs/{id}/unpublish` endpoints in `JobManagementController.java`.
  - Added `findByStatusInOrderByCreatedAtDesc` in `JobRepository.java` to filter public openings cleanly.
  - Added closed-intake validation in `ApplicationController.java`.
- Frontend additions:
  - Added `pauseJob` and `unpublishJob` API services in `api.js`.
  - Added **Pause** (amber) and **Unpublish** (rose) action buttons with live status badges in `DashboardPage.jsx`.
  - Added **"Recruitment Closed"** badge and disabled button states in `CareersPage.jsx`.
- Verified compilation and code quality: `mvnw test-compile` (BUILD SUCCESS), `npm run lint` (0 errors, 0 warnings), and Vite production build (0 errors).

## 2026-11-10 — Executive UI redesign (Slate & Indigo Enterprise ATS)

- Modernized user interface across all three primary application views (`LoginPage.jsx`, `DashboardPage.jsx`, and `CareersPage.jsx`) to a sleek, cohesive "Slate & Indigo" enterprise aesthetic.
- **`LoginPage.jsx`**: Redesigned as an executive dark card with subtle ambient indigo glows, Lucide icons, security guarantee badge, and a `[Fill Demo Credentials]` helper for quick evaluation.
- **`DashboardPage.jsx`**:
  - Overhauled layout with 4 KPI summary metric cards (Active Requisitions, Active Pipeline, Average Match, Interview Stage).
  - Added Requisition Authoring presets (Frontend Engineer, Backend Java Developer, Data Scientist, Cloud DevOps Engineer).
  - Implemented candidate search and stage filter toolbar (`ALL`, `NEW`, `REVIEW`, `INTERVIEW`, `OFFER`, `REJECTED`).
  - Added color-coded match score badges (Emerald >=80%, Indigo 60-79%, Amber <60%).
  - Added company-wide "★ All Requisitions" pipeline view to `DashboardPage.jsx` defaulting to show all candidate applications across all roles, with dynamic per-role applicant counters in the dropdown and role badges on candidate cards, ensuring applicants from `/careers` are visible immediately.
  - Implemented automatic selection and aggregation across requisitions upon loading the dashboard.
  - Added helpful interactive empty states guiding the recruiter to publish requisitions or view public careers when no applications exist yet.
  - Completely eliminated native browser `window.prompt` in favor of a dedicated in-app `StageDecisionModal` with quick-fill justification presets and immutable audit trail logging.
- **`CareersPage.jsx`**:
  - Replaced legacy basic layout with enterprise-grade careers portal featuring real-time requisition search/filtering by skills and role.
  - Implemented modern drag-and-drop resume dropzone with file size formatting and preview.
  - Added Human-in-the-Loop transparency guarantee badge and structured application receipt modal with reference ID.
- Verified frontend code quality: `npm run lint` passing with 0 errors/0 warnings; Vite production build passing with 0 errors.

## 2026-11-10 — Humanized workflow copy and UI cleanup

- Improved `start-local.ps1` process monitoring loop to handle normal service exit codes (`ExitCode 0`) gracefully without throwing unhandled script exceptions during teardown.
- Removed fire emojis across navigation links in `LoginPage.jsx`, `CareersPage.jsx`, `DashboardPage.jsx`, and `WorkflowPage.jsx` for clean, academic presentation styling.
- Completely rewrote all Workflow stage definitions, summaries, and technical explanations using clear, human engineering language instead of automated jargon.
- Verified production build and ESLint with 0 errors/warnings.

## 2026-11-10 — Interactive animated workflow page and system hardening

- Hardened `start-local.ps1` process launcher to dynamically reload User & Machine `PATH` and inject `JAVA_HOME`, ensuring `mvnw.cmd` and `npm.cmd` spawn properly across terminal sessions without missing environment variables.
- Built interactive, animated Workflow & Architecture page (`frontend-react/src/pages/WorkflowPage.jsx`) featuring flame-themed particle patterns, step-by-step pipeline walkthrough, simulation player, 3-tier system breakdown, and advisory score weight charts.
- Added `/workflow` public route to `App.jsx` and integrated navigation links in `LoginPage.jsx`, `CareersPage.jsx`, and `DashboardPage.jsx`.
- Verified Vite production bundle build (14.18s) and ESLint with 0 errors/warnings.
- Re-verified all 37 Python tests in `pytest` passing (100%).

## 2026-11-10 — Windows environment setup and launcher hardening

- Pinned compatible dependency versions in `requirements.txt` (`pandas>=2.2.0,<3.0.0`, `numpy>=1.26.0,<2.0.0`, `scipy>=1.13.0,<1.14.0`, `scikit-learn>=1.5.0,<1.6.0`) resolving NumPy 2.x / Pandas 3.x CAPI initialization incompatibility.
- Hardened `start-local.ps1` for built-in Windows PowerShell 5.1 compatibility: replaced .NET Core-only `[Security.Cryptography.RandomNumberGenerator]::GetBytes` call with deterministic default fallback secrets aligned with `application.yml`, `api/main.py`, and `start-codespace.sh`.
- Added automatic resolution of `.venv\Scripts\python.exe` and dynamic `$env:JAVA_HOME\bin` PATH injection in `start-local.ps1`.
- Verified all 37 Python test suite cases in `pytest` passing (100%).
- Verified Java backend compilation and `RecruitmentWorkflowTest` (Flyway V1 & V2 migrations) passing via `.\mvnw.cmd test`.
- Verified React production build and ESLint checks passing with 0 errors/warnings.
- Updated `AI_CONTEXT.md` handoff log and test verification audit tables.

## 2026-09-26 — Phase 1/2: job drafts and application intake

- Added Flyway V1/V2 migrations and switched Hibernate from schema update to validation.
- Verified fresh migration in Java tests and upgrade of the previous file-backed H2 development database.
- Added independent job creation, publish action, public local careers page and application form.
- Added protected resume storage/download, applicant identity/source fields and manual-review fallback when scoring fails.
- Added Java workflow tests for access control, job publication, anonymous intake, invalid files, review transitions and audit history.
- Verified a live Java/Python local flow for draft, publication, application, scoring and protected resume retrieval; React production build passed.
- Updated local setup and status documentation. Public deployment and job-board connectors remain pending.

## 2026-09-26 — Local recruiter review foundation

- Selected React + Java gateway + Python scoring as the active architecture; retired Streamlit, Oracle and Colab artifacts from this copy.
- Made H2 storage file-backed and removed seeded default password and checked-in JWT secret.
- Restricted registration to admins, protected Python routes with a service key, and stopped displaying a misleading ML confidence badge.
- Added saved job/candidate API, persistent stage changes with required reasons, and a review-event audit API.
- Connected dashboard review buttons to saved actions and added a Windows startup script with process cleanup.
- Verified React build, 34 Python tests, Java compilation and a local API smoke flow.
