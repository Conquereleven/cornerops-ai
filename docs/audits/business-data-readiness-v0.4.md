# Business Data Readiness Audit v0.4

## Decision

CornerOps is ready for an internal beta using sanitized mock business data. Real database onboarding is **not enabled** because no dedicated read-only credential or provider is configured. This is intentional and does not block QA.

## Current adapter status

| Component | Status | Evidence |
| --- | --- | --- |
| Mock adapter | Ready | Leads, quotes, orders, approvals and audit fixtures |
| ReadOnlyDatabaseAdapter | Ready | SELECT-only policy, timeout, row limit, PII masking and audit |
| Supabase | Readiness only | URL and legacy anon/service-role configuration exist locally; `SUPABASE_READONLY_KEY` is absent |
| Postgres | Safe stub | `READONLY_DATABASE_URL` is absent and no runtime query executor is installed |
| Schema discovery | Mock ready | Real discovery remains behind `CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=false` |

The service-role key is never consumed by the v0.4 business-data adapter. It is not proof of read-only access and must not be substituted for `SUPABASE_READONLY_KEY`.

## Entities

Mock discovery exposes `leads`, `quotes`, `orders`, `audit_logs` and `approvals`. Canonical templates exist for Lead, Quote/QuoteItem, Order/OrderItem, AuditLog and Approval. Real AuditLog/Approval mappings remain inactive until the production schema is discovered and approved.

## Missing mappings

- Confirm production table names; the application also has legacy names such as `b2b_leads` and potentially ecommerce order tables.
- Confirm item relationships and whether quote/order items are JSON or child tables.
- Confirm timestamp, currency and status enums.
- Map production audit/approval tables only after retention and access policy review.

## Safety and PII risks

- Service-role credentials can bypass RLS and are prohibited for this adapter.
- Email, phone, contact/customer name, notes and addresses are PII-bearing fields.
- Schema samples can leak PII; samples are sanitized and never logged raw.
- A low-confidence contract is rejected for real use.
- Enabling legacy `USE_SUPABASE` is independent from this onboarding and does not enable v0.4 reads.

## Read-only verification plan

1. Create a staging DB role/token with SELECT and metadata privileges only.
2. Prove INSERT, UPDATE, DELETE, DROP and ALTER fail using the onboarding runbook.
3. Configure only `READONLY_DATABASE_URL` or `SUPABASE_READONLY_KEY`.
4. Keep `CORNEROPS_DB_ALLOW_WRITES=false` and `CORNEROPS_BUSINESS_DATA_DRY_RUN=true` for discovery.
5. Run schema discovery, inspect contracts and audit events.
6. Enable real reads only after all required mappings are high confidence.

## Rollback

Set `CORNEROPS_BUSINESS_DATA_ENABLED=false`, remove the read-only credential, restart, run `npm run control:tower:beta`, and verify source mode returns to `mock`. No migration or production schema rollback is needed because v0.4 performs no schema changes.

## Recommended onboarding path

Use a separate Supabase staging project or a Postgres replica with a dedicated read-only principal. Supabase is the shortest path because the dependency already exists, but only a least-privilege read token with enforced RLS is acceptable.
