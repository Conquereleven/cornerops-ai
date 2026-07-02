# Control Tower Frontend Integration Plan v1.3

The Lovable frontend starts with mock data. It later connects to the CornerOps backend API.

## Backend API
Stable frontend contract:

- `/api/control-tower/frontend/v1/status`
- `/api/control-tower/frontend/v1/founder-daily`
- `/api/control-tower/frontend/v1/cornermex`
- `/api/control-tower/frontend/v1/flows`
- `/api/control-tower/frontend/v1/approvals`
- `/api/control-tower/frontend/v1/audit`
- `/api/control-tower/frontend/v1/security`
- `/api/control-tower/frontend/v1/telegram`
- `/api/control-tower/frontend/v1/drafts`
- `/api/control-tower/frontend/v1/actions`

The backend may run locally, on Railway, Render, a VPS or another private host. No domain is required for the mock frontend.

Useful future domains:

- `ops.cornermex.com`
- `control.cornermex.com`

## Security Before Public Deployment
- Require authentication.
- Use HTTPS.
- Use token-based backend access.
- Restrict CORS.
- Consider Cloudflare Access or Tailscale for private access.

## Boundaries
The Lovable frontend does not store secrets, does not use Supabase service role keys, does not send WhatsApp/email, and does not mutate CornerMex production data. CornerOps remains the operational brain.
