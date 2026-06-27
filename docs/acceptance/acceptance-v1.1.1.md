# Acceptance v1.1.1

Branch: `feature/lovable-cornermex-connector-v1.1.1`

## Scope

v1.1.1 corrects the v1.1 real-source model around the actual CornerMex architecture in Lovable. Lovable remains the app/project builder layer; CornerOps remains the operational brain and source of truth.

## Commands to run

```bash
npm run lint
npm test
npm run typecheck
npm run test:frontend
npm run build
npm run demo:lovable-discovery
npm run demo:cornermex-connector
npm run demo:v1.1.1
npm run demo:v1.1
npm run founder:daily
```

## Results from this branch

- Syntax: 429 JavaScript files OK.
- Backend Jest: 85 suites / 378 tests OK.
- Frontend TypeScript: OK.
- Frontend Vitest: 4 files / 7 tests OK.
- Frontend build: OK.
- `github:read-only-check`: OK without credentials, mode `mock`, writes blocked.
- `business-data:read-only-check`: OK without credentials, mode `mock`, writes blocked.
- `demo:lovable-discovery`: OK without credentials, source mode `missing_config`, no real Lovable call.
- `demo:cornermex-connector`: OK without credentials, source mode `mock`, 4 products / 1 lead / 1 quote / 2 orders / 2 customers.
- `demo:v1.1.1`: OK without credentials, Telegram v1.2 not started.
- `founder:setup-check`: warning only because `npm` is not on PATH in this shell; bundled Codex Node runtime was used for validation.
- `founder:daily`: OK and now reports `cornerMexLovableMode=mock`.

## Expected results

- PR #24 is merged and `main` includes v1.1.
- Lovable project config: missing unless founder provides it.
- Lovable repo config: missing unless founder provides it.
- Supabase config: missing unless founder provides it.
- Connector data reads: `mock` by default.
- Project discovery: `missing_config` by default.
- Repo discovered mode: available when `CORNERMEX_LOVABLE_GITHUB_REPO` is configured.
- Real read-only mode: available only with Supabase anon/read-only config and write blocking.

## Remains disabled

Production writes, Lovable project mutations, Supabase writes, GitHub writes, WhatsApp/customer channels, external emails, native tools, ClawHub execution and Telegram v1.2.

## Founder next steps

1. Provide Lovable project URL/name.
2. Provide connected GitHub repo.
3. Provide Supabase URL and anon/read-only key.
4. Provide schema/table names or Lovable `.env.example` if known.
5. Rerun `npm run demo:v1.1.1`.
