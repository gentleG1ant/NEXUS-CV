# Project status — 2026-09-26

## Current milestone

Phase 1 local foundation and an initial Phase 2 intake slice. Architecture: React :5173 → Spring Boot :8080 → internal FastAPI :8000. Java is the system of record; Flyway manages the file-backed H2 schema. Python scoring is advisory.

## Verified

- React production build and 34 Python tests passed in the previous milestone.
- Java workflow tests cover new V1/V2 migrations, private recruiter endpoints, draft/publish, anonymous application intake, file type rejection, protected resume download, reasoned review and audit history.
- Existing local H2 data baselined and upgraded through V2; Spring Boot started and served the public jobs endpoint.
- Live local smoke test passed: draft job (201) → publish (200) → candidate application (201) → saved candidate with score and private resume → authorized resume download (200).
- The previous milestone's live API smoke test passed login → PDF screening → saved review → audit.

## Implemented

- Jobs can be created independently of resume upload, then published to a local careers page.
- Candidate application records name/email, file hash, source and a server-generated resume filename. Files are stored privately and served only through a protected endpoint.
- Failed analysis does not lose an application; a recruiter sees that it needs manual review.
- Existing review stages and audit history remain available after restart.

## Next tasks

1. Run the new public-application flow from a clean Windows installation and verify file persistence after restart.
2. Add duplicate detection and parsing-failure states/queue; move analysis to an asynchronous job so an applicant receives confirmation promptly even for large documents.
3. Complete job validation and lifecycle (approval, pause, close, versioned criteria), plus reviewer assignment and interview scorecards.
4. Add backup/restore commands, retention/deletion controls, rate limits, malware scanning strategy and accessibility checks before any real usage.
5. Replace global Python mock storage with request-local state or a durable, isolated worker mechanism before concurrency testing.

## Current limitations

The careers page works on localhost; it is not a public internet job posting. External platform APIs require approved access. Email is not verified and there is no candidate status messaging yet. DOCX content is checked for a ZIP signature but deeper validation and malicious-file controls are still needed. Job criteria and scoring remain simplistic. Do not make automatic hiring decisions from the score or use live applicant data in this build.
