# Acceptance v1.4

Branch: `feature/cornermex-supabase-readonly-v1.4`

Merged prerequisite:

- PR #36 merged into `main`.
- Latest main after merge: `39a91a7d95f7a0cf628bfcdf1614db0fe870a292`

## Current Result

The v1.4 implementation is complete, but real activation is blocked because Supabase read-only credentials are not configured in the local environment.

Current mode:

- Check mode: `blocked_by_missing_supabase_readonly_config`
- Connector source mode: `repo_discovered`
- Data source: `lovable_repo_discovery`
- Supabase status: `not_configured`
- Table availability: `config_missing`
- PII masking: enabled
- Writes: blocked
- External sends: blocked

Missing founder/Railway config:

- `CORNERMEX_SUPABASE_ENABLED=true`
- `CORNERMEX_SUPABASE_URL`
- `CORNERMEX_SUPABASE_ANON_KEY`
- `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS` for the active Lovable preview/deploy origin

## Commands Run

```bash
curl -fsSL --max-time 20 https://supabase.com/changelog.md
Supabase project discovery through the connected Supabase app
Sanitized local `.env` presence check for CornerMex Supabase/Railway variables
node node_modules/jest/bin/jest.js tests/cornerMexSupabaseReadOnlyV113.test.js tests/cornermexSupabaseReadOnlyV14.test.js tests/controlTowerFrontendContractV13.test.js tests/controlTowerFrontendBridgeV133.test.js tests/railwayReadinessV135.test.js --runInBand
node node_modules/jest/bin/jest.js tests/cornermexSupabaseReadOnlyV14.test.js tests/controlTowerFrontendContractV13.test.js --runInBand
node scripts/cornermex-supabase-readonly-check.js
node scripts/demo-cornermex-real-readonly.js
node scripts/demo-v1.4.js
node scripts/check-syntax.js
git diff --check
curl -i -L --max-time 20 https://cornerops-ai-production.up.railway.app/api/health
```

Focused test result:

- v1.4 focused suite: 2 suites passed / 13 tests passed.
- Expanded regression slice: 5 suites passed / 35 tests passed.
- Syntax check: 501 JavaScript files OK.
- `git diff --check`: OK.

Demo/check result:

- `cornermex:supabase-readonly-check`: passed without credentials and reported `blocked_by_missing_supabase_readonly_config`.
- `demo:cornermex-real-readonly`: passed without credentials and used `repo_discovered`/mock fallback data with source labels.
- `demo:v1.4`: passed without credentials and propagated Supabase status through connector, flow engine, and frontend contract.

Supabase/Railway access result:

- Connected Supabase app discovery returned one accessible project, `cornerops-ai`, with status `INACTIVE`; it did not expose a CornerMex/Lovable marketplace Supabase project to use for v1.4.
- Local `.env` exists, but sanitized inspection shows `CORNERMEX_SUPABASE_URL` and `CORNERMEX_SUPABASE_ANON_KEY` are empty.
- No local Railway CLI or Railway token/project/service env was available for safe Railway variable configuration.
- Because the correct CornerMex Supabase URL/key are unavailable, v1.4 must not claim `real_read_only` or configure Railway.

External verification:

- Railway health endpoint returned HTTP 200 and reported `dataSource.mode=mock`, confirming the hosted backend is reachable but not using real Supabase data yet.
- Control Tower frontend API endpoints returned HTTP 200 with the local frontend token and no browser `Origin` header:
  - `/api/control-tower/frontend/v1/status`
  - `/api/control-tower/frontend/v1/cornermex`
  - `/api/control-tower/frontend/v1/flows`
- The same endpoints returned HTTP 403 when called with the active Lovable preview origin, with the expected warning to configure `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS` for that Lovable origin.
- Lovable project `CornerOps Control Tower` is ready, but live backend refresh from that preview remains blocked until the active origin is allowlisted.

GitHub PR status:

- PR #37: `https://github.com/Conquereleven/cornerops-ai/pull/37`
- Head commit: `90586f2c7aa58f7005ec85d85407dbd8360c7e9d`
- CI: 2/2 checks passing.
- Mergeability: clean at the time of acceptance update.

## Acceptance Criteria

- Supabase read-only check exists.
- Missing Supabase config degrades safely.
- Secrets are never printed.
- Service-role-like credentials are flagged.
- Writes remain blocked.
- No mutation methods are exposed on the read-only client.
- Table availability is reported per mapped entity.
- `real_read_only` is not claimed without successful safe selects.
- `real_read_only_partial` is supported.
- Control Tower/frontend contract propagates source mode, Supabase status, table availability, audit IDs, masking, and blocked-write flags.
- Demos run without credentials.
- Tests pass.

## Exact Founder Commands

After setting safe Supabase env locally or in Railway:

```bash
npm run cornermex:supabase-readonly-check
npm run demo:v1.4
```

If `real_read_only_partial` appears, inspect `tableAvailability` and fix table names, RLS, or Data API exposure for affected tables.

Railway/Lovable activation sequence:

1. Set `CORNERMEX_SUPABASE_ENABLED=true` in Railway.
2. Set `CORNERMEX_SUPABASE_URL` in Railway.
3. Set `CORNERMEX_SUPABASE_ANON_KEY` in Railway using only an anon/publishable key.
4. Keep all write flags disabled.
5. Add the active Lovable frontend origin to `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS`.
6. Redeploy Railway.
7. Re-run `npm run cornermex:supabase-readonly-check`.
8. Verify Lovable can refresh Control Tower data without 403 and without exposing secrets.

## Still Disabled

Production writes, Supabase writes, Lovable mutations, GitHub writes, WhatsApp sends, external emails, customer channels, proactive outbound, native tools, and OpenClaw execution remain disabled.
