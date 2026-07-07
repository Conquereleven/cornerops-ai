# Acceptance v1.4.6

Sprint: Founder Table Mapping Intake to Concrete Supabase Read Views SQL

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

## Result

Final status: `blocked_by_incomplete_table_mapping`

## Mapping Intake Status

The founder intake file was updated with base table names:

- products: `products`
- B2B leads: `b2b_leads`
- orders: `orders`
- customers: `customers`
- payments: `payments`
- fulfillment: `fulfillment`

The intake is still incomplete because primary key columns and available operational columns were not provided.

## Supabase Metadata Check

Project inspected: `corner-mex-uae`

Project ref: `asndzpfysugxlvswryvl`

Safe metadata-only checks were performed. No customer rows, raw PII, keys, tokens, or service-role secrets were read or printed.

Observed result:

- `public.products`: not found
- `public.b2b_leads`: not found
- `public.orders`: not found
- `public.customers`: not found
- `public.payments`: not found
- `public.fulfillment`: not found

The Supabase project currently reports no application tables in the `public` schema. Only platform schemas such as `auth`, `storage`, `realtime`, and `vault` were visible through metadata inspection.

## Entity Readiness

- products: `required_missing`
- b2b_leads: `required_missing`
- orders: `required_missing`
- customers: `required_missing`
- payments: `required_missing`
- fulfillment: `required_missing`

No entity is ready for concrete view generation.

## Execution SQL

Status: not generated

Reason: generating concrete SQL would require guessing table schemas. The v1.4.6 gate explicitly forbids creating executable SQL from guesses.

No SQL was executed automatically.

## Table Map JSON

Status: not generated

Reason: the provided table names were not found in the visible `public` schema and no confirmed read views were provided.

## Manual SQL Checklist

Status: not generated

Reason: there is no concrete SQL ready for manual execution yet.

## Founder Manual Action Required

Complete `docs/supabase/cornermex-table-mapping-intake-v1.4.5.md` with non-secret schema details.

For each operational entity, provide:

- schema name, if not `public`
- base table or read view name
- primary key column
- available column names
- missing or renamed columns
- whether the entity is `not_used`

Required entities:

- products
- b2b_leads
- orders
- customers
- payments
- fulfillment

For customers, confirm PII policy:

- expose masked email only
- or omit email entirely

Do not provide:

- Supabase URL or keys
- service-role keys
- database passwords
- JWT secrets
- Railway tokens
- raw customer rows
- raw email lists
- raw phone lists
- sample customer data

## Post-SQL Validation Command

After complete mappings are provided, concrete SQL is generated, and the founder manually runs reviewed SQL in Supabase SQL Editor, rerun:

```bash
npm run cornermex:supabase-readonly-check
```

Proceed only when the result is:

- `real_read_only`
- or `real_read_only_partial`

## Railway Activation Readiness

Status: `not_ready`

Railway variables were not changed.

Railway was not redeployed.

Do not proceed to Railway activation until concrete views exist and local read-only validation passes.

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
npm test -- tests/cornermexSupabaseReadOnlyV14.test.js
npm run lint
git diff --check
```

Results:

- Focused Jest: 1 suite passed, 14 tests passed.
- Lint/syntax: passed for 502 JavaScript files.
- `git diff --check`: passed after removing an extra blank line at EOF from the intake file.
- Secret diff scan: clean; no real secret values were found.

## Final Status

`blocked_by_incomplete_table_mapping`
