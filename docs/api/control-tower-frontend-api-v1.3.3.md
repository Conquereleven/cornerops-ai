# Control Tower Frontend API v1.3.3

Base path: `/api/control-tower/frontend/v1`

This API is the read-only backend bridge for the Lovable `CornerOps Control Tower` cockpit. CornerOps remains the brain. Lovable is only the browser UI.

## Security Model

The bridge is disabled by default and fails closed.

Required local configuration:

```env
CONTROL_TOWER_FRONTEND_API_ENABLED=true
CONTROL_TOWER_FRONTEND_AUTH_REQUIRED=true
CONTROL_TOWER_FRONTEND_AUTH_MODE=operator_token
CONTROL_TOWER_FRONTEND_TOKEN_HASH=
CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS=https://lovable.dev,https://*.lovable.app,http://localhost:3000
CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST=true
CONTROL_TOWER_FRONTEND_READ_ONLY=true
CONTROL_TOWER_FRONTEND_FAIL_CLOSED=true
CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS=true
CONTROL_TOWER_FRONTEND_MASK_PII=true
```

Generate the token hash locally:

```bash
npm run control-tower:frontend-token-hash
```

Only store `CONTROL_TOWER_FRONTEND_TOKEN_HASH` in `.env`. Never store the raw operator token in the repo or Lovable source.

## Auth

Requests must include one of:

```http
Authorization: Bearer <operator_token>
X-CornerOps-Frontend-Token: <operator_token>
```

Behavior:

- missing token: `401`
- invalid token: `403`
- missing token hash while auth is required: `503`
- disabled bridge: `503`
- unsafe bridge config: `503`

## CORS

The bridge uses an explicit allowlist. It never returns `Access-Control-Allow-Origin: *` when auth is enabled.

Allowed origins are configured with:

```env
CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS=
CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST=true
```

`https://*.lovable.app` style entries are matched to the concrete request origin and echoed back only when allowed.

## Endpoints

```txt
GET /api/control-tower/frontend/v1
GET /api/control-tower/frontend/v1/connection-test
GET /api/control-tower/frontend/v1/status
GET /api/control-tower/frontend/v1/founder-daily
GET /api/control-tower/frontend/v1/cornermex
GET /api/control-tower/frontend/v1/flows
GET /api/control-tower/frontend/v1/approvals
GET /api/control-tower/frontend/v1/audit
GET /api/control-tower/frontend/v1/security
GET /api/control-tower/frontend/v1/telegram
GET /api/control-tower/frontend/v1/drafts
GET /api/control-tower/frontend/v1/actions
```

Every endpoint returns sanitized JSON with:

- `status`
- `sourceMode`
- `readOnly`
- `dryRun`
- `writesBlocked`
- `externalSendsBlocked`
- `approvalRequired`
- `auditId`
- `warnings`
- `data`

## Connection Test

`GET /api/control-tower/frontend/v1/connection-test` returns safe metadata only:

```json
{
  "status": "success",
  "sourceMode": "repo_discovered",
  "readOnly": true,
  "dryRun": true,
  "writesBlocked": true,
  "externalSendsBlocked": true,
  "auditId": "audit-frontend-bridge-auth-ok-...",
  "warnings": ["Read-only bridge verified. Writes and external sends remain blocked."],
  "data": {
    "status": "ok",
    "backendTime": "2026-07-03T00:00:00.000Z",
    "apiVersion": "v1.3.3",
    "authMode": "operator_token",
    "readOnly": true,
    "writesBlocked": true,
    "externalSendsBlocked": true,
    "sourceMode": "repo_discovered",
    "lovableOriginAllowed": true,
    "bridgeMode": "read_only"
  }
}
```

No secrets, raw tokens, service role keys or unmasked PII are returned.

