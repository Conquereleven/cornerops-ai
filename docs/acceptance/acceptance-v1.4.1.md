# Acceptance v1.4.1

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

Retry objective: verify whether the newly activated/selected Supabase project can move CornerOps from `mock`/`repo_discovered` to `real_read_only` or `real_read_only_partial`.

## PR #37 Status

- State: open
- Draft: no
- Mergeability: `MERGEABLE`
- Head before retry doc: `7238fab4d294e67e241367d0d66d6a2188be58f7`
- CI before retry doc: 2/2 passing

## Supabase Project Discovery

Connected Supabase app discovery now shows one accessible project:

- Project name: `cornerops-ai`
- Status: `ACTIVE_HEALTHY`
- Region: `ap-south-1`
- Postgres version: 17.6

Safe schema inspection found CornerMex-relevant public tables with RLS enabled:

- `products`
- `customers`
- `orders`
- `order_items`
- `b2b_leads`
- `conversations`
- `messages`
- `ai_worker_runs`
- `worker_events`

Safe count-only SQL, with no row payloads and no raw PII, returned:

- products: 9 rows
- b2b_leads: 0 rows
- orders: 5 rows
- customers: 4 rows
- order_items: 5 rows

Interpretation:

- The selected Supabase project is active and contains useful schema/data evidence.
- This does not by itself prove anon/publishable Data API access or Railway runtime activation.
- A real `real_read_only` claim still requires the CornerOps read-only client to select through safe URL + anon/publishable key configuration.

## Local Config Status

Sanitized `.env` inspection:

- `CORNERMEX_SUPABASE_ENABLED`: present but `false`
- `CORNERMEX_SUPABASE_URL`: empty
- `CORNERMEX_SUPABASE_ANON_KEY`: empty
- `CORNERMEX_SUPABASE_READ_ONLY`: `true`
- `CORNERMEX_SUPABASE_ALLOW_WRITES`: `false`
- `CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED`: `true`
- `CORNERMEX_SUPABASE_PII_MASKING`: `true`
- `CORNERMEX_SUPABASE_MASK_PII`: missing
- `CORNERMEX_SUPABASE_FAIL_CLOSED`: missing
- `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS`: missing locally

No Supabase key, Railway secret, operator token, or raw PII was printed.

Sanitized `~/.cornerops-secrets/supabase.env` inspection:

- file: present
- `CORNERMEX_SUPABASE_URL`: present, stored as a project ref rather than a full HTTP URL
- `CORNERMEX_SUPABASE_ANON_KEY`: present
- safe read-only flags: not stored in the file; supplied in-memory for checks

The project ref was converted in memory to a Supabase project URL for verification. The derived URL was not printed or written to the repo.

## Railway Env Access

- Railway CLI: not available locally
- Railway CLI after retry: installed, version 5.23.3
- Railway auth: unauthorized; local `RAILWAY_TOKEN` is invalid or lacks access
- `RAILWAY_PROJECT_ID`: missing
- `RAILWAY_SERVICE_ID`: missing
- `RAILWAY_ENVIRONMENT_ID`: missing

Because Railway variable access is unavailable locally, this retry could verify the live backend but could not configure Railway env vars.

## Local v1.4 Check Result

Command:

```bash
npm run cornermex:supabase-readonly-check
```

Result:

- mode: `blocked_by_missing_supabase_readonly_config`
- sourceMode: `schema_discovered`
- connectorMode: `repo_discovered`
- supabaseStatus: `not_configured`
- missing: `CORNERMEX_SUPABASE_URL`, `CORNERMEX_SUPABASE_ANON_KEY`
- unsafe: none
- writesBlocked: true
- externalSendsBlocked: true
- maskingApplied: true

Command:

```bash
node --env-file=.env scripts/cornermex-supabase-readonly-check.js
```

Result remained blocked because URL/key are empty and `CORNERMEX_SUPABASE_ENABLED=false`.

Command with values sourced from `~/.cornerops-secrets/supabase.env`, read-only flags supplied in-memory, and no values printed:

```bash
node scripts/cornermex-supabase-readonly-check.js
```

Result:

- mode: `blocked_by_supabase_read_failure`
- readFailureReason: `invalid_anon_key`
- supabaseStatus: `error_sanitized`
- tableAvailability: `error_sanitized` for all mapped entities
- credentials: URL present, anon key present, anon key not printed, service-role-like key not suspected
- writesBlocked: true
- externalSendsBlocked: true
- maskingApplied: true

Interpretation:

- The local secret file now provides values, but the current anon/publishable key is not accepted by Supabase for safe reads.
- This must be fixed before any Railway deployment can honestly report `real_read_only` or `real_read_only_partial`.

## Tests

Focused tests:

```bash
npm test -- 'cornermexSupabaseReadOnly*.test.js' controlTowerFrontendContractV13.test.js controlTowerFrontendBridgeV133.test.js railwayReadinessV135.test.js
```

Result after rerun outside sandbox due local listener EPERM:

- 3 suites passed
- 18 tests passed

Explicit Supabase suites:

```bash
npm test -- tests/cornermexSupabaseReadOnlyV14.test.js tests/cornerMexSupabaseReadOnlyV113.test.js
```

Result:

- 2 suites passed
- 17 tests passed

Lint/checks:

```bash
npm run lint
git diff --check
```

Result:

- Syntax check passed for 501 JavaScript files.
- `git diff --check`: OK.

## Railway Curl Verification

Base URL: `https://cornerops-ai-production.up.railway.app`

Operator token was read from the local secret file and was not printed.

Lovable preview origin used:

`https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`

Results:

- `/api/health`: HTTP 200, sourceMode `mock`
- `/api/control-tower/frontend/v1/status`: HTTP 200, sourceMode `mock`, writesBlocked true, externalSendsBlocked true
- `/api/control-tower/frontend/v1/cornermex`: HTTP 200, sourceMode `mock`, writesBlocked true, warnings present
- `/api/control-tower/frontend/v1/flows`: HTTP 200, sourceMode `mock`, writesBlocked true, audit ID present

Interpretation:

- The Lovable origin is accepted by the Railway backend.
- Railway live backend is still in `mock`; it is not yet reading Supabase.
- This likely means Railway has not been configured with the v1.4 Supabase read-only variables and/or is still running a deployment that does not include PR #37.

## Table Availability

CornerOps read-only runtime table availability remains config-blocked:

- products: `config_missing`
- leads: `config_missing`
- quotes: `config_missing`
- orders: `config_missing`
- customers: `config_missing`
- payments: `config_missing`
- fulfillment: `config_missing`

Supabase MCP schema/count evidence:

- products: available structurally, 9 rows
- leads: available structurally as `b2b_leads`, 0 rows
- quotes: mapped to `b2b_leads`, 0 rows
- orders: available structurally, 5 rows
- customers: available structurally, 4 rows
- payments: mapped to `orders`, 5 rows
- fulfillment: mapped to `orders`, 5 rows

This is schema/data evidence, not anon read-only runtime activation.

## Lovable Verification

Lovable project:

`https://lovable.dev/projects/de6bc54c-b2d7-4527-b464-adf97760ec25`

Status from backend verification:

- The active Lovable preview origin is accepted by Railway.
- Dashboard/CornerMex/Flow Engine source mode remains `mock` through Railway endpoints.
- No secret values were exposed.
- Writes and external sends remain blocked.

Lovable cannot honestly show `real_read_only` until Railway returns `real_read_only` or `real_read_only_partial`.

## Final Status

`blocked_by_supabase_read_failure`

Secondary blocker:

`blocked_by_railway_env_access`

Reason:

- Supabase project is active and contains relevant tables/data.
- Local secret file contains URL/key, but the read-only check classifies the current key as `invalid_anon_key`.
- Railway env access is unavailable locally because the token is unauthorized, so env vars cannot be configured from this run.
- Railway live endpoints remain `mock`.

## Founder Next Steps

1. Replace `CORNERMEX_SUPABASE_ANON_KEY` in `~/.cornerops-secrets/supabase.env` with an active anon/publishable key for the selected Supabase project.
2. Keep using only anon/publishable credentials, never service role.
3. Re-run the local check before touching Railway.
4. Replace or re-authenticate the local Railway token so `railway whoami` and `railway status` work for service `cornerops-ai`.
5. Merge or deploy PR #37 to Railway, or ensure Railway builds the PR branch for testing.
6. In Railway project/service `cornerops-ai`, open Variables.
7. Add or confirm:

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=<selected Supabase project URL>
CORNERMEX_SUPABASE_ANON_KEY=<anon or publishable key only>
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true
CORNERMEX_SUPABASE_MASK_PII=true
CORNERMEX_SUPABASE_FAIL_CLOSED=true
```

8. Keep `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS` including:

```txt
https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app
```

9. Redeploy Railway.
10. Re-run:

```bash
npm run cornermex:supabase-readonly-check
npm run demo:v1.4
```

11. Verify Railway endpoints return `real_read_only` or `real_read_only_partial`.

## Still Disabled

Supabase writes, Lovable mutations, GitHub writes, WhatsApp sends, external emails, customer channels, proactive outbound, native tools, and OpenClaw execution remain disabled.
