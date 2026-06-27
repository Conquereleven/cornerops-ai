# Acceptance v1.0

## Scope

Founder Operational Beta v1.0 prepares CornerOps for safe local daily use. It consolidates setup, daily workflow, Control Tower readiness, backup/export, docs, demos and validation.

## Required commands

```bash
npm run founder:setup-check
npm run founder:daily
npm run demo:v1.0
npm run state:backup
npm run state:export-summary
npm run acceptance:visual:v1.0
npm run qa
git diff --check
```

## Accepted behavior

- Founder setup validator exists and never prints secrets.
- `.env.founder.local.example` has safe local defaults.
- Control Tower v1.0 exposes Founder Beta Readiness.
- Daily workflow labels mock/read-only/dry-run/disabled/local_internal.
- Backups stay local under `.cornerops/backups`.
- Export summaries show counts and health, not raw private payloads.
- GitHub issue drafts remain dry-run by default.
- Local notes/tasks remain local/internal and approval gated.

## Observed validation

- Syntax check passed for 399 JavaScript files.
- Backend Jest passed: 83 suites, 362 tests.
- Frontend TypeScript passed: `tsc --noEmit`.
- Frontend Vitest passed: 4 files, 7 tests.
- Frontend production build passed: Vite transformed 1628 modules.
- `npm run founder:setup-check` equivalent passed with status `warning` only because `npm` is not on PATH in the Codex runtime; blocked count was 0.
- `npm run founder:daily` equivalent ran with mock/read-only/dry-run/disabled/local_internal labels.
- `npm run demo:v1.0` equivalent ran without credentials.
- `npm run state:backup` equivalent created a local sanitized backup under `.cornerops/backups`.
- `npm run state:export-summary` equivalent reported counts and no production DB/raw tokens.
- `npm run acceptance:visual:v1.0` equivalent passed with v1 endpoint, required sections and zero secret hits.
- `git diff --check` passed.
- Precise secret scan found no real tokens.
- Local HTTP smoke on `127.0.0.1:3100` passed for `/api/health`, unauthenticated `/api/control-tower/v1.0/status` returning 401, authenticated `/api/control-tower/v1.0/status` returning 200 and authenticated `/api/actions` returning 200.

## Blocked behavior

Production writes, payment/order/lead/quote mutations, WhatsApp/customer sends, external emails, native tools, ClawHub execution and real GitHub issue creation remain disabled by default.

## Visual/local acceptance

See `docs/acceptance/visual-acceptance-v1.0.md`.

## Known limitations

- File JSON is local single-process beta storage.
- Browser visual QA depends on an external plugin that is unavailable in this environment.
- Real GitHub issue creation requires a future supervised pilot.
