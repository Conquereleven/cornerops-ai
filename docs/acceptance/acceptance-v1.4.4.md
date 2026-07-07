# Acceptance v1.4.4

Sprint: Supabase Public Read Model + CornerMex Data Bridge Pack

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

## Result

Final status: `read_model_bridge_ready_manual_sql_required`

## Changes Made

- Added `CORNERMEX_SUPABASE_TABLE_MAP_JSON` support.
- Added ordered table/view candidates:
  1. explicit JSON or entity env override
  2. default `cornerops_*_v` read views
  3. legacy table names
- Added `connected_no_public_read_model` Supabase status.
- Added `missing_public_read_model` read model status.
- Added `create_cornerops_readonly_views` action requirement.
- Added safe Supabase key compatibility diagnostics.
- Added read-only SQL views pack and runbook.

## Railway Status

- Railway local browser-login mode is ready.
- Project: `CornerOps AI`
- Environment: `production`
- Service: `cornerops-ai`
- Railway variables were not changed.
- Railway was not redeployed.

## Supabase Status

- Supabase URL/key are present locally.
- Key type: publishable.
- service-role detected: no.
- safe for read-only client: yes.
- Current blocker: `missing_public_read_model`.

Current local check:

- mode: `missing_public_read_model`
- sourceMode: `schema_discovered`
- supabaseStatus: `connected_no_public_read_model`
- readModelStatus: `missing_public_read_model`
- actionRequired: `create_cornerops_readonly_views`
- writesBlocked: true
- externalSendsBlocked: true
- maskingApplied: true

## Marketplace Schema Inspection

Local CornerMex marketplace repo path was not available at:

`/Users/rodrigom./corner-mex-uae`

Result: `corner_mex_repo_not_available_locally`

Because concrete base table names were not available locally, the SQL pack is a reviewed template with placeholders.

## SQL Views Pack

Created:

- `docs/supabase/cornermex-readonly-views.v1.4.4.sql`
- `docs/supabase/cornermex-readonly-views-v1.4.4.md`

Target views:

- `cornerops_products_v`
- `cornerops_b2b_leads_v`
- `cornerops_orders_v`
- `cornerops_customers_v`
- `cornerops_payments_v`
- `cornerops_fulfillment_v`

## Tests

Focused Supabase tests:

```bash
npm test -- tests/cornermexSupabaseReadOnlyV14.test.js
```

Result:

- 1 suite passed
- 14 tests passed

## Safety

- Supabase writes: blocked
- Lovable mutations: blocked
- GitHub writes: blocked
- WhatsApp sends: blocked
- external emails: blocked
- customer channels: blocked
- OpenClaw: disabled
- `.env`: not committed
- service role: not used
- secrets printed: no

## Manual Founder Action Required

1. Open Supabase SQL Editor for the CornerMex project.
2. Review `docs/supabase/cornermex-readonly-views.v1.4.4.sql`.
3. Replace placeholders with actual base table names.
4. Remove fields that do not exist.
5. Keep PII masked or omitted.
6. Run reviewed SQL manually.
7. Rerun:

   ```bash
   npm run supabase:key-compatibility-check
   npm run cornermex:supabase-readonly-check
   ```

Only after the local check reaches `real_read_only` or `real_read_only_partial` should Railway variables be configured and production redeployed.
