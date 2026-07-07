# CornerOps AI Acceptance v1.4.8

Sprint: Supabase Real Read-Only Activation on Railway

Branch: `feature/railway-supabase-activation-v1.4.8`

Base: `main` includes PR #37 and v1.4.7 (`f4f060f`) plus the latest production watch workflow commit.

Final status: `blocked_by_lovable_refresh`

## Supabase Project

- Project name: `cornerops-ai`
- Project ref: `nhxpujypqxbjiqqddxqt`
- Project URL: `https://nhxpujypqxbjiqqddxqt.supabase.co`
- Key handling: anon/publishable key was loaded from local ignored secret storage and Railway stdin only. No key value was printed or committed.

## Local Validation

Command:

```bash
npm run cornermex:supabase-readonly-check
```

Result:

- `mode`: `real_read_only`
- `sourceMode`: `real_read_only`
- `connectorMode`: `real_read_only`
- `dataSource`: `cornermex_supabase`
- `supabaseStatus`: `connected`
- `readModelStatus`: `available`
- `writesBlocked`: `true`
- `externalSendsBlocked`: `true`
- `maskingApplied`: `true`
- `anonKeyPrinted`: `false`
- `serviceRoleKeySuspected`: `false`

Table availability:

| Contract | View | Status | Rows |
| --- | --- | --- | --- |
| products | `cornerops_products_v` | `available_masked` | 1 |
| leads | `cornerops_b2b_leads_v` | `available_empty` | 0 |
| quotes | not mapped in v1.4.8 table map | `available_empty` | 0 |
| orders | `cornerops_orders_v` | `available_masked` | 1 |
| customers | `cornerops_customers_v` | `available_masked` | 1 |
| payments | `cornerops_payments_v` | `available_masked` | 1 |
| fulfillment | `cornerops_fulfillment_v` | `available_masked` | 1 |

Known warning:

- Live schema discovery remains disabled; the runtime uses the reviewed migration/table map.

## Railway Production Activation

Linked Railway service:

- Project: `CornerOps AI`
- Environment: `production`
- Service: `cornerops-ai`
- Backend URL: `https://cornerops-ai-production.up.railway.app`

Configured Railway variables:

- `CORNERMEX_SUPABASE_ENABLED=true`
- `CORNERMEX_SUPABASE_URL` set to the expected Supabase project URL
- `CORNERMEX_SUPABASE_ANON_KEY` set via stdin without printing the value
- `CORNERMEX_SUPABASE_READ_ONLY=true`
- `CORNERMEX_SUPABASE_ALLOW_WRITES=false`
- `CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true`
- `CORNERMEX_SUPABASE_MASK_PII=true`
- `CORNERMEX_SUPABASE_FAIL_CLOSED=true`
- `CORNERMEX_SUPABASE_MAX_ROWS=50`
- `CORNERMEX_SUPABASE_REQUEST_TIMEOUT_MS=8000`
- `CORNERMEX_SUPABASE_TABLE_MAP_JSON` points to the six public read views
- `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS` includes the active Lovable preview origin
- `CONTROL_TOWER_FRONTEND_API_ENABLED=true`
- `CONTROL_TOWER_FRONTEND_AUTH_REQUIRED=true`
- `CONTROL_TOWER_FRONTEND_AUTH_MODE=operator_token`
- `CONTROL_TOWER_FRONTEND_TOKEN_HASH` configured with a SHA-256 hash only
- `NIXPACKS_NODE_VERSION=22`

Runtime compatibility fix:

- Added `package.json` `engines.node >=22` after Railway initially failed on Node 18 without native WebSocket support for the Supabase client stack.

Redeploy:

- Railway redeploy completed successfully after the Node 22 runtime fix.
- Latest observed deployment: `f723730b-5100-47f8-99a4-848b20476647`
- Service status: online.

## Production Endpoint Verification

Health:

- `GET /api/health`: HTTP 200
- Note: the legacy health endpoint still reports generic `dataSource.mode=mock`; the Control Tower frontend endpoints below are the authoritative v1.4.8 validation path for CornerMex Supabase read-only.

Protected frontend endpoints were called with:

- Lovable preview `Origin`
- local ignored Control Tower frontend token
- no token value printed

### Status

Endpoint:

```txt
GET /api/control-tower/frontend/v1/status
```

Result:

- HTTP 200
- `status`: `success`
- `sourceMode`: `mixed`
- `dataSource`: `cornermex_supabase`
- `supabaseStatus`: `connected`
- table availability includes masked products, orders, customers, payments and fulfillment
- `writesBlocked`: `true`
- `externalSendsBlocked`: `true`
- `auditId`: present

### CornerMex

Endpoint:

```txt
GET /api/control-tower/frontend/v1/cornermex
```

Result:

- HTTP 200
- `status`: `success`
- `sourceMode`: `real_read_only`
- `currentMode`: `real_read_only`
- `dataSource`: `cornermex_supabase`
- `supabaseStatus`: `connected`
- `readModelStatus`: `available`
- `contractConfidence.high`: 6
- row counts available for products, orders, customers, payments and fulfillment
- leads and quotes are safely empty
- `writesBlocked`: `true`
- no raw PII observed

### Flows

Endpoint:

```txt
GET /api/control-tower/frontend/v1/flows
```

Result:

- HTTP 200
- `status`: `success`
- `sourceMode`: `real_read_only`
- `dataSource`: `cornermex_supabase`
- `supabaseStatus`: `connected`
- Flow Engine returned source-labeled real read-only summaries.
- product quality records were masked.
- `writesBlocked`: `true`
- `externalSendsBlocked`: `true`
- `auditId`: present
- no raw PII observed

## Lovable Verification

Project:

- `CornerOps Dashboard`
- Project ID: `de6bc54c-b2d7-4527-b464-adf97760ec25`
- Editor URL: `https://lovable.dev/projects/de6bc54c-b2d7-4527-b464-adf97760ec25`
- Preview URL: `https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`

Observed preview status:

- App loads successfully.
- Title: `CornerOps Control Tower`.
- No console errors were observed.
- UI still displays `Mock Mode` and `source: repo_discovered`.
- UI still states Supabase `real_read_only` requires URL and anon key.
- Lovable project metadata still describes the backend API adapter as future/placeholder.

Classification:

- Backend activation is complete and production endpoints return real read-only data.
- Lovable has not refreshed or connected its adapter to the activated backend.
- Final sprint status is therefore `blocked_by_lovable_refresh`.

Next Lovable action:

1. Open the existing Lovable Control Tower project.
2. Configure or refresh the API adapter to call `https://cornerops-ai-production.up.railway.app`.
3. Use the protected frontend token only in private deployment configuration, never in source.
4. Keep mock fallback available.
5. Confirm Dashboard, CornerMex Ops and Flow Engine show `real_read_only`.
6. Confirm all send/action buttons remain disabled.

## Safety Posture

Still disabled:

- Supabase writes
- Lovable mutations
- GitHub writes
- WhatsApp sends
- external emails
- customer channels
- proactive outbound
- native tools
- ClawHub execution
- OpenClaw execution

Secret handling:

- No service role key used.
- No Supabase key value printed.
- No Railway token used or printed.
- No operator token value printed.
- No `.env` files committed.
- Local Control Tower token stored only in ignored local secret storage.

## Validation Commands

Completed during activation:

```bash
npm run cornermex:supabase-readonly-check
npm test -- tests/cornermexSupabaseReadOnlyV14.test.js
npm run lint
git diff --check
```

Final validation should rerun the same commands before merge.
