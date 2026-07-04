# Railway Control Tower Bridge Security v1.3.5

## Security Model

Railway hosts the CornerOps backend API. Lovable is only the visual Control Tower cockpit.

The bridge is:

- Read-only
- Operator-token protected
- CORS allowlisted
- Audited
- PII-masked
- Fail-closed

## Authentication

The backend stores only `CONTROL_TOWER_FRONTEND_TOKEN_HASH`.

The raw operator token is never committed and must never appear in:

- Git commits
- Pull requests
- Logs
- Screenshots
- Lovable source files
- Documentation

## CORS

Allowed origins are explicit:

- `https://lovable.dev`
- `https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`

No wildcard origin is used.

## Verified Failure Modes

- Missing token returns `401`
- Invalid token returns `403`
- Disallowed origin returns `403`
- API disabled would fail closed
- Full payload remains read-only and audited

## Disabled Capabilities

The following remain disabled:

- Production writes
- Supabase writes
- Lovable mutations
- GitHub writes
- WhatsApp sends
- External email sends
- Customer channels
- Proactive outbound
- OpenClaw execution

## Incident Response

If the operator token is suspected leaked:

1. Generate a new token and hash.
2. Replace the Railway hash.
3. Redeploy.
4. Clear Lovable browser session storage.
5. Retest `connection-test`.
6. Review audit events.

