# Control Tower Frontend Bridge Security v1.3.3

## Principle

The Lovable Control Tower is a browser cockpit. Browser code is not trusted with permanent secrets. The backend remains the authority for policies, audit, approvals, source labeling and read-only enforcement.

## Auth

The frontend sends a founder-entered runtime operator token. The backend stores only:

```env
CONTROL_TOWER_FRONTEND_TOKEN_HASH=
```

The raw token is never committed, never printed by scripts, and never embedded in Lovable.

## CORS

The bridge uses an allowlist. It does not use wildcard `*` with authenticated requests.

Allowed origins should include only:

- exact Lovable preview/deploy origin
- `https://lovable.dev` if needed for editor preview
- localhost during local testing

## Read-Only Enforcement

The bridge exposes only `GET` and `OPTIONS` on `/api/control-tower/frontend/v1`.

No endpoint performs writes. Responses always include:

- `readOnly: true`
- `writesBlocked: true`
- `externalSendsBlocked: true`

## Sanitization

The bridge response sanitizer:

- masks PII-like fields
- converts secret-like fields to booleans
- blocks known secret-shaped payloads
- caps response size
- returns fail-closed error envelopes when needed

## Lovable Rules

Lovable must not store:

- Telegram bot tokens
- Supabase keys
- GitHub tokens
- backend operator tokens in source
- service role keys

Runtime token storage defaults to `sessionStorage`. Local storage is explicit lower-security remember-device mode.

## Incident Response

If a frontend operator token is exposed:

1. Generate a new token.
2. Run `npm run control-tower:frontend-token-hash`.
3. Replace `CONTROL_TOWER_FRONTEND_TOKEN_HASH`.
4. Restart the backend.
5. Clear Lovable/browser token storage.
6. Review audit logs for denied or suspicious bridge requests.

