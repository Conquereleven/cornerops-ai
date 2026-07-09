# Lovable Prompt: CornerOps Control Tower v1.5 Real Operational Intelligence

Use this prompt in the existing `CornerOps Dashboard` Lovable project only.

Do not create a new Lovable project.
Do not modify the CornerMex marketplace project.
Do not store secrets.
Do not use Supabase service-role keys.
Do not call WhatsApp or email send APIs.
Do not enable production writes.

## Goal

Update the existing CornerOps Dashboard so it displays the v1.5 real operational intelligence contracts from the CornerOps Railway backend.

Backend base URL:

```txt
https://cornerops-ai-production.up.railway.app
```

Use the existing operator token setting. Keep it in browser/local private storage only.

## API Contracts

Read these endpoints with `Authorization: Bearer <operator_token>`:

- `GET /api/intelligence/overview`
- `GET /api/intelligence/clients`
- `GET /api/intelligence/signals`
- `GET /api/intelligence/anomalies`
- `GET /api/intelligence/cases`
- `GET /api/intelligence/playbooks`
- `GET /api/intelligence/connectors`

Dry-run only endpoints:

- `POST /api/intelligence/cases/from-anomaly`
- `PATCH /api/intelligence/cases/:id/status`

Do not treat dry-run case endpoints as persisted writes.

## Views to Add or Adjust

Add an `Intelligence Overview` area with:

- source mode
- data source
- products count
- active products
- low stock/product quality signals
- B2B lead count
- pending payment review count
- fulfillment delayed count
- anomaly candidate count
- tracked anomaly case count
- top operational alerts
- recommended founder actions
- data freshness
- PII masking status

Add or align tabs/cards for:

- Clients
- Signals
- Anomalies
- Cases
- Playbooks
- Connectors

## UI Rules

- Label every section with source mode.
- Show `real_read_only` clearly when returned.
- Keep write/action buttons disabled unless the backend explicitly returns controlled dry-run support.
- Show case creation/status changes as `dry_run` only.
- Show audit IDs when returned.
- Keep PII masked.
- Never invent backend logic in Lovable.
- Never duplicate CornerOps AI core logic in Lovable.
- Lovable is only the cockpit; CornerOps backend is the brain.

## Empty States

If `anomaly_events` is not live yet, show:

`Anomaly Events: contract prepared, live sync pending.`

If counts are zero, show:

`No records available in the current read-only view. Use the v1.5 onboarding templates to add reviewed operational records.`
