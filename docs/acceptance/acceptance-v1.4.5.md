# Acceptance v1.4.5

Sprint: Supabase Read Model Execution Prep + Local Validation Gate

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

## Result

Final status: `manual_table_mapping_required`

## SQL Pack Status

Classification: `placeholder_sql_needs_founder_table_mapping`

The v1.4.4 SQL pack exists, but it is not executable yet:

- `docs/supabase/cornermex-readonly-views.v1.4.4.sql`

It still contains placeholders such as:

- `<base_products_table>`
- `<base_b2b_leads_table>`
- `<base_orders_table>`
- `<base_customers_table>`
- `<base_payments_table>`
- `<base_fulfillment_table>`

No executable SQL was created in this sprint because the real CornerMex base table names and column mappings are not confirmed.

## Founder Manual Action Required

Review and complete:

- `docs/supabase/cornermex-table-mapping-intake-v1.4.5.md`

Provide only non-secret schema information:

- products base table and available columns
- B2B leads base table and available columns
- orders base table and available columns
- customers base table and PII masking preference
- payments base table and available columns
- fulfillment base table and available columns

Do not provide service-role keys, database passwords, JWT secrets, Railway tokens, or customer PII.

## Post-Mapping Gate

After table mappings are confirmed, the next safe step is to create reviewed concrete SQL for the `cornerops_*_v` read views or configure `CORNERMEX_SUPABASE_TABLE_MAP_JSON`.

Only then should the founder manually run reviewed SQL in the Supabase SQL Editor.

## Post-SQL Validation

After reviewed SQL is manually executed, rerun:

```bash
npm run supabase:key-compatibility-check
npm run cornermex:supabase-readonly-check
```

Expected passing statuses before Railway activation:

- `real_read_only`
- `real_read_only_partial`

Current expected status before mappings are provided:

- `sourceMode`: `schema_discovered`
- `supabaseStatus`: `connected_no_public_read_model`
- `readModelStatus`: `missing_public_read_model`
- `actionRequired`: `create_cornerops_readonly_views`

Observed local validation in this Codex environment:

- `mode`: `blocked_by_missing_supabase_readonly_config`
- `sourceMode`: `schema_discovered`
- `connectorMode`: `repo_discovered`
- `dataSource`: `lovable_repo_discovery`
- `supabaseStatus`: `not_configured`
- `readModelStatus`: `unknown`
- missing env vars:
  - `CORNERMEX_SUPABASE_URL`
  - `CORNERMEX_SUPABASE_ANON_KEY`
- writes blocked: true
- external sends blocked: true
- masking applied: true

This does not change the sprint blocker. The SQL pack still cannot be executed until founder table mappings are provided.

## Railway Activation Readiness

Status: `not_ready`

Railway variables were not changed.

Railway was not redeployed.

Do not configure Railway or redeploy until local validation confirms the read model exists and is readable by the publishable key.

## Safety

- Supabase writes: blocked
- Lovable mutations: blocked
- GitHub writes: blocked
- WhatsApp sends: blocked
- external emails: blocked
- customer channels: blocked
- OpenClaw: disabled
- service-role key: not used
- secrets committed: no
- SQL executed automatically: no

## Validation Commands

```bash
npm run cornermex:supabase-readonly-check
npm test -- tests/cornermexSupabaseReadOnlyV14.test.js
npm run lint
git diff --check
```

Results:

- Supabase read-only check: safe failure, missing local Supabase URL/key in this environment.
- Focused Jest: 1 suite passed, 14 tests passed.
- Lint/syntax: passed for 502 JavaScript files.
- `git diff --check`: passed.
- Secret diff scan: documentation-only variable names and safety warnings were present; no real secret values were found.

## Final Status

`manual_table_mapping_required`
