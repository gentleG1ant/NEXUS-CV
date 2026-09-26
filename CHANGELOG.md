# Changelog

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
