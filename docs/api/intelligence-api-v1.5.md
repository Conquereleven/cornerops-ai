# Intelligence API v1.5

The v1.5 Intelligence API exposes read-only, dashboard-ready operational intelligence for CornerOps AI.

Base path:

```txt
/api/intelligence
```

Auth:

- Same Control Tower frontend bridge auth.
- Send `Authorization: Bearer <operator_token>`.
- Backend stores only `CONTROL_TOWER_FRONTEND_TOKEN_HASH`.

Safety:

- Read-only by default.
- Writes blocked.
- External sends blocked.
- PII masking expected from underlying connector.
- POST/PATCH endpoints are dry-run/draft only.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/overview` | Full intelligence overview for dashboard cards |
| GET | `/clients` | CornerOps client summaries |
| GET | `/signals` | Read-only operational signals |
| GET | `/anomalies` | Rule-based anomaly candidates |
| GET | `/cases` | Case drafts derived from anomalies |
| POST | `/cases/from-anomaly` | Dry-run case draft creation |
| PATCH | `/cases/:id/status` | Dry-run case status change |
| GET | `/playbooks` | Recommended response playbooks |
| GET | `/connectors` | Connector status summaries |

## Current Scope

Implemented now:

- CornerMex as the first pilot client.
- Read-only signals from existing CornerMex Flow Engine.
- Rule-based anomaly candidates.
- Draft cases.
- Playbooks for payment, inventory/product quality and fulfillment review.

Not implemented now:

- Live `anomaly_events` sync.
- Persistent case writes.
- AI scoring calls.
- WhatsApp/email sends.
- Supabase writes.
