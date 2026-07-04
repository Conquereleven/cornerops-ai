# Acceptance v1.3.5

## Branch

`feature/railway-hosted-backend-live-v1.3.5`

## PR #35

PR #35 was merged before v1.3.5 deployment work continued.

Latest `main` before this branch:

`3f723a4 feat: verify Control Tower live backend bridge v1.3.4`

## Commits

- `044b221 chore: add Railway backend readiness v1.3.5`
- `987b752 fix: skip frontend build on Railway backend deploy`
- `20e6744 fix: expose frontend bridge root safety envelope`

## Railway

- Project: `perceptive-insight`
- Service: `cornerops-ai`
- Public URL: `https://cornerops-ai-production.up.railway.app`
- Deployed branch: `feature/railway-hosted-backend-live-v1.3.5`
- Status: `Online`

## Validation Commands

Focused tests:

```bash
npm test -- railwayReadinessV135.test.js controlTowerLiveBridgeV134.test.js controlTowerFrontendBridgeV133.test.js controlTowerFrontendContractV13.test.js
```

Result:

- 4 suites passed
- 21 tests passed

Railway HTTPS matrix:

- `/api/health`: `200`
- Missing token: `401`
- Invalid token: `403`
- Valid token connection test: `200`
- CORS preflight: `204`
- Disallowed origin: `403`
- Full `/api/control-tower/frontend/v1`: `200`

Full payload verified:

- `auditId`: present
- `sourceMode`: present
- `writesBlocked`: `true`
- `externalSendsBlocked`: `true`
- sections: 10
- token echo: no

## Lovable

Project:

`https://lovable.dev/projects/de6bc54c-b2d7-4527-b464-adf97760ec25`

Preview origin:

`https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`

Settings > Backend Bridge v1.3.3 result:

```txt
Live Backend Connected - Read-Only Bridge Active.
```

Live SPA verification after the connection test:

- Dashboard retained `source: live_backend`.
- Telegram retained `source: live_backend`.
- Security retained `source: live_backend`.
- Flow Engine retained `source: live_backend`.
- Drafts retained `source: live_backend`.
- Source labels were visible.
- Audit IDs were visible.
- `writes blocked` was visible.
- `external sends blocked` was visible.
- Draft send buttons remained disabled.

The raw operator token was used only for the session test and cleared afterward. Reloading without the session token falls back to mock mode, as expected.

## Current Mode

- Backend bridge: live read-only
- Lovable frontend: live connection verified
- CornerMex data: mock/source-labeled until Supabase read-only credentials are configured
- Supabase real read-only: pending founder credentials

## Still Disabled

- Production writes
- Supabase writes
- Lovable mutations
- GitHub writes
- WhatsApp sends
- External emails
- Customer channels
- Proactive outbound
- OpenClaw execution

## Founder Next Commands

Use Lovable Settings:

1. Backend URL: `https://cornerops-ai-production.up.railway.app`
2. Operator token: use local/private token only.
3. Mode: Live Read-Only.
4. Click `Connection Test`.
5. Confirm `Live Backend Connected - Read-Only Bridge Active.`
