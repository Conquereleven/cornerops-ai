# Railway Internal Persistence Activation v1.9.1

## Preconditions

1. Migration `cornerops_internal_work_queue_v19` is present in Supabase migration history.
2. The restricted login passes the direct-login permission matrix.
3. The founder-action token differs from the read-only operator token and its plaintext remains local.
4. Existing CornerMex read-only variables are unchanged.

## Railway variables

Configure names only through secret-safe CLI input:

- `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=true`
- `CORNEROPS_INTERNAL_PERSISTENCE_PROVIDER=postgres`
- `CORNEROPS_INTERNAL_DATABASE_URL` set to the restricted login URL
- `CORNEROPS_INTERNAL_DATABASE_CA_PATH=config/certs/supabase-root-2021-ca.pem`
- `CORNEROPS_INTERNAL_SCHEMA=cornerops_internal`
- `CORNEROPS_INTERNAL_STATEMENT_TIMEOUT_MS=8000`
- `CONTROL_TOWER_FOUNDER_ACTION_AUTH_REQUIRED=true`
- `CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH` set to the SHA-256 hash only
- `CONTROL_TOWER_FOUNDER_ACTION_RATE_LIMIT_PER_MINUTE=10`

Never use a service-role, publishable, anon, or PostgreSQL administrator credential for internal persistence.

For this project the verified IPv4-compatible endpoint is the Supabase Session Pooler at `aws-1-ap-south-1.pooler.supabase.com:5432`. The direct database endpoint is IPv6-only and Railway production cannot route to it. Do not substitute an inferred `aws-0` pooler host.

## Verification order

1. Deploy with the persistence kill switch disabled and prove restricted connectivity.
2. Prove allowed and denied privileges using the restricted login and rolled-back rows.
3. Enable persistence and redeploy.
4. Verify health, work queue status, operator/founder-action separation, sync idempotency, optimistic conflict, approval `executed=false`, and append-only audit.
5. Restart the service and verify the same IDs and versions remain.
6. Run CornerMex read-only checks and Prod Watch twice.

## Production evidence

- Current deployment: `b53f4a16-b2f7-4798-bf23-3cac380aef65`
- Health and authenticated Work Queue status: HTTP 200
- Persistence: `postgres`, durable, healthy
- Internal approval: approved, `executed=false`; conflicting second decision rejected with HTTP 409
- Restart verification: same work item, approval, version 2, and audit IDs survived redeploy
- CornerMex: read-only checks pass; writes and external sends remain blocked

## Rollback

1. Set `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=false`.
2. Redeploy and verify internal mutations fail closed.
3. Preserve `cornerops_internal` and all audit evidence.
4. Do not truncate, drop, or delete records.
5. Record the failed gate and sanitized diagnostics.
