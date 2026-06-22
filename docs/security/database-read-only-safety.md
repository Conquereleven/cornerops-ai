# Database Read-Only Safety

## Fail-closed policy

DatabaseSafetyPolicy accepts one explicit SELECT only. INSERT, UPDATE, DELETE, MERGE, CREATE, DROP, ALTER, TRUNCATE, GRANT, REVOKE, locking SELECT, unsafe PostgreSQL functions, multiple statements and unknown syntax are denied.

Repository APIs expose no mutation methods. Proposals and approvals do not create a DB execution capability.

## Credentials

- Use a dedicated least-privilege role on staging/read replica first.
- Grant SELECT only to required tables and metadata views.
- Enforce RLS for Supabase.
- Never use service-role, owner or migration credentials.
- Store secrets in the runtime secret manager, never `.env.example`, fixtures or logs.

## PII and audit

Mask email and phone before repository/agent output. Treat names, notes and addresses according to contract PII levels and avoid raw samples in logs. Every read records source, operation, table/field metadata, row count and policy decision. Audit unavailability blocks reads.

## Incident response

Disable `CORNEROPS_BUSINESS_DATA_ENABLED`, revoke the read-only credential, stop processes, preserve sanitized audit logs, inspect the access window, and verify no DB write grants existed. Rotate broader credentials if the supplied key was not truly read-only. Resume only after Control Tower is healthy and write-denial tests pass.
