# Acceptance v0.8.1

## Delivery

- Branch: `feature/v0.8.1-release-hardening`
- Base: verified `main` at merge commit `b3c729c`
- PR stack: #19 merged first as `7757263`; #20 merged second as `b3c729c`
- Scope: release hardening only; no v0.9 actions or broad product features

## Changes

- Added `memory` / `file_json` persistence boundary and provider registry.
- Hardened JSON storage with root bounds, pre-write sanitization, atomic rename, file size limits, private permissions and corruption policy.
- Persisted approvals, three audit streams and operator sessions across local restarts.
- Reused the hardened store for replay, rejection and rate-limit state.
- Kept Control Tower, approvals, Telegram, OpenClaw, external sends and writes behind existing safe defaults.
- Added persistence tests, restart demo, architecture, QA, security, founder and rollback documentation.

## Files

Created:

- `src/core/persistence/{FileJsonStore,InMemoryStore,PersistenceProviderRegistry,index,persistenceTypes}.js`
- `tests/unit/persistence/persistenceV081.test.js`
- `scripts/demo-persistence-v0.8.1.js`
- v0.8.1 architecture, release, security, operator and acceptance documents

Modified:

- Environment, server bind, CI, README, package scripts and ignore rules
- Approval, audit, operator-session and security-store wiring
- Control Tower and operator-channel persistent safety checks
- Existing Approval Center demo wording

## Validation

- Syntax: 359 JavaScript files
- Backend: 78 suites / 333 tests
- Frontend: 4 files / 7 tests
- Typecheck and Vite build: passed
- Persistence demo: approval/audit recovered, zero temp files, no secret/PII exposure, no real execution
- Merged-baseline v0.8 demos and server/API smoke: passed
- Loopback bind and persisted audit recovery after process restart: passed
- GitHub branch and post-merge CI: passed

## Runtime posture

Enabled for local beta: mock/read-only agents, local authenticated Control Tower when explicitly enabled, dry-run approvals and sanitized durable local summaries.

Disabled: real approval execution, production writes, external messages, WhatsApp/customer channels, Telegram real mode, crawlers, native tools, ClawHub execution and real sources without explicit verified configuration.

## Known limitations

- File JSON supports one process only.
- Auth is a single local operator token.
- The target founder machine still needs visual acceptance and clean install verification.
- Future SQLite/Postgres work must retain this persistence boundary.

## Founder commands

```bash
npm install
npm --prefix frontend install
npm run qa
npm run demo:persistence
npm run demo:v0.8
npm run build
npm start
```

Recommended next sprint after supervised acceptance: `CornerOps Controlled Actions with Approvals v0.9`. Do not activate it until shared persistence, stronger auth and explicit action-by-action approvals are designed.
