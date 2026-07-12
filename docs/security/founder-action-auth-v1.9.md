# Founder-Action Authentication v1.9

## Separation

`CONTROL_TOWER_FRONTEND_TOKEN_HASH` continues to protect read-only GET routes. It cannot authorize a
POST or PATCH by itself. Controlled internal writes additionally require a different secret whose
SHA-256 hash is stored as `CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH`.

Generate it locally with:

```bash
npm run control-tower:founder-action-token-hash -- --generate
```

The script never prints plaintext. It writes the token to the ignored local secrets directory with
mode 0600 and prints only its hash. Store the hash in Railway. Enter plaintext only into the private
Control Tower, where it must remain in `sessionStorage` or component memory, never `localStorage`.

## Request controls

- Exact Lovable origin CORS allowlist remains required.
- Founder writes require `Content-Type: application/json`.
- Express limits JSON bodies to 32 KB.
- Founder actions are independently rate-limited and fail closed.
- Missing, invalid, and rate-limited authentication attempts are audited when persistence is ready.
- Tokens, hashes, connection URLs, and raw PII are never returned by the APIs or Environment Doctor.

## Internal write boundary

The adapter accepts only `cornerops_internal.work_items`, `approval_requests`, and `audit_events`.
It rejects any other schema/table before SQL is constructed. The DB runtime role has no grants to
CornerMex `public` tables. Audit events allow SELECT/INSERT only and reject UPDATE/DELETE by trigger.

The following remain blocked: product activation, inventory/price/order/payment/lead/customer
mutation, WhatsApp/email/customer sends, campaign publication, GitHub writes, Lovable mutation, and
OpenClaw execution.
