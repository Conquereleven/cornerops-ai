# Business Data Read-Only Architecture

CornerOps remains the policy and decision boundary. Database providers expose facts only; they never execute business actions.

```text
Agent / Control Tower
  -> BusinessDataService
  -> Lead | Quote | Order ReadOnlyRepository
  -> BusinessDataContractRegistry
  -> ReadOnlyDatabaseAdapter
  -> DatabaseSafetyPolicy
  -> mock | Supabase read-only | injected Postgres read-only executor
  -> AuditLogService
```

## Providers and activation

Mock is always the fallback. Supabase real reads require the business-data flag, `read_only` mode, dry-run disabled, DB read-only enabled, writes disabled, URL, dedicated read-only key and an available client. Postgres additionally requires an injected read-only executor; v0.4 ships this as a safe readiness stub.

The adapter never falls back to the service-role key. Missing credentials degrade to mock with an explicit warning.

## Safety policy

- Only a single explicit `SELECT` is accepted.
- Mutation, DDL, locking SELECT, unsafe functions and multiple statements are denied.
- Identifiers are validated and Postgres values are parameterized.
- Queries time out after `CORNEROPS_DB_QUERY_TIMEOUT_MS`.
- Results are capped by `CORNEROPS_DB_MAX_ROWS`.
- Audit unavailability fails the read closed when auditing is required.

## PII and metadata

Email and phone values are masked before reaching repositories or agents. Audit events contain table, selected columns, filter names, row count and source mode, never raw rows. Repository responses include `source`, `readOnly`, `rowCount`, `truncated` and `warnings`.
