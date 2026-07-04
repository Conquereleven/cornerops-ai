# Railway Backend Live Bridge v1.3.5

## Summary

CornerOps backend is deployed on Railway for the Control Tower frontend live read-only bridge.

Railway service:

- Project: `perceptive-insight`
- Service: `cornerops-ai`
- Public URL: `https://cornerops-ai-production.up.railway.app`
- Source repo: `Conquereleven/cornerops-ai`
- Deployed branch for v1.3.5 verification: `feature/railway-hosted-backend-live-v1.3.5`

## Deployment Configuration

The backend uses:

- `Procfile`: `web: npm start`
- `railway.json`: backend-only Railway deploy configuration
- `CORNEROPS_BIND_HOST=0.0.0.0` in Railway
- `NODE_ENV=production`
- Healthcheck path: `/api/health`

Railway CLI was not available locally during this run, so Railway project setup and deployment were completed through the authenticated Railway web UI.

## Live Verification

Validated against `https://cornerops-ai-production.up.railway.app`:

- `GET /api/health`: `200`
- Missing operator token: `401`
- Invalid operator token: `403`
- Valid operator token: `200`
- CORS preflight from Lovable preview origin: `204`
- Disallowed origin: `403`
- Full payload `GET /api/control-tower/frontend/v1`: `200`

Full payload includes:

- `auditId`
- `sourceMode`
- `writesBlocked=true`
- `externalSendsBlocked=true`
- 10 frontend contract sections

## Safety Status

Still disabled:

- Production writes
- Supabase writes
- Lovable mutations
- GitHub writes
- WhatsApp sends
- External emails
- Customer channels
- Proactive outbound
- OpenClaw execution

No raw operator token was committed or documented.

