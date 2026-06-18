# Runbook: Local Archive Ops

Mock archive records live in `tests/fixtures/context`. Future SQLite archives must live under `./.cornerops/archives` and pass `FsSafeBoundary`.

Operations:

- List records: `GET /api/local-archives/records`.
- Read record: `GET /api/local-archives/records/:id`.
- Search: `GET /api/context/search?q=...`.

Do not manually place private exports in the archive path until source approvals, retention policy and masking are verified.
