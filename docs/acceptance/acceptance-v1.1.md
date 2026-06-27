# Acceptance v1.1

Branch: `feature/real-source-expansion-v1.1`

## Real vs Mock

- Real candidate: GitHub read-only, enabled only with safe credentials and feature flag.
- Prepared candidate: Business DB/Supabase read-only.
- Current no-credential mode: `mock`.

## Commands

```bash
npm run lint
npm test
npm run typecheck
npm run test:frontend
npm run build
npm run github:read-only-check
npm run business-data:read-only-check
npm run demo:github-read-only
npm run demo:business-data-read-only
npm run demo:real-sources
npm run demo:v1.1
```

## Validation Results

- Syntax: 410 JavaScript files OK.
- Backend Jest: 84 suites / 369 tests OK.
- Frontend TypeScript: OK.
- Frontend Vitest: 4 files / 7 tests OK.
- Frontend build: OK.
- `github:read-only-check`: OK without credentials, mode `mock`, writes blocked.
- `business-data:read-only-check`: OK without credentials, mode `mock`, writes blocked, PII masking on.
- `demo:v1.1`: OK without credentials, selected source `mock`, all real writes blocked.
- `acceptance:visual:v1.0`: OK and compatible with Control Tower v1.1.
- `git diff --check`: OK.
- Secret scan: no token patterns found.
- HTTP smoke: `/api/control-tower/v1.1/status` returned 401 without token and 200 with local console token.

## Founder Commands

```bash
npm run founder:setup-check
npm run founder:daily
npm run state:backup
npm run state:export-summary
```

## Remains Disabled

Production writes, GitHub writes, Business DB writes, WhatsApp, customer/prospect channels, external emails, native tools and ClawHub execution.
