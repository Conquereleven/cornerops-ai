# Control Tower Frontend API v1.3

Base path: `/api/control-tower/frontend/v1`

The API is a stable read-only contract for the Lovable `CornerOps Control Tower` frontend.

## Envelope
Every response uses:

```json
{
  "status": "success",
  "sourceMode": "repo_discovered",
  "readOnly": true,
  "dryRun": true,
  "writesBlocked": true,
  "externalSendsBlocked": true,
  "approvalRequired": false,
  "auditId": "audit-...",
  "warnings": [],
  "data": {}
}
```

## Endpoints
- `GET /status`
- `GET /founder-daily`
- `GET /cornermex`
- `GET /flows`
- `GET /approvals`
- `GET /audit`
- `GET /security`
- `GET /telegram`
- `GET /drafts`
- `GET /actions`

`GET /api/control-tower/frontend/v1` returns all sections.

## Safety
Responses never include secrets, raw tokens, webhook secrets, service role keys or unmasked PII. All sections remain read-only and dry-run. Risky actions remain approval-gated.
