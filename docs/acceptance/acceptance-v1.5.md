# CornerOps AI Acceptance v1.5

Sprint: Real Operational Intelligence Layer

Branch: `feature/real-operational-data-v1.5`

## Data Layer Prepared

- Real operational onboarding docs were added for CornerMex products, inventory, B2B leads, orders, order items, payments, fulfillment and future anomaly events.
- CSV templates were added under `data/cornermex/onboarding-v1.5/`.
- Manual Supabase import SQL was added as reviewed/admin-only template SQL.
- Schema notes document current read views and missing/future views.

No real data was imported by CornerOps in this sprint.

## Current Read-Only Status

Latest validation:

- `mode`: `real_read_only`
- `sourceMode`: `real_read_only`
- `dataSource`: `cornermex_supabase`
- `supabaseStatus`: `connected`
- `readModelStatus`: `available`
- `writesBlocked`: `true`
- `externalSendsBlocked`: `true`
- `maskingApplied`: `true`

Current row counts:

- products: 1
- leads: 0
- quotes: 0
- orders: 1
- customers: 1
- payments: 1
- fulfillment: 1

## CornerMex Anomaly Contract

`CornerMexAnomalyEvent` contract exists and maps future `anomaly_events` records into CornerOps anomalies and case drafts.

Status: contract prepared, live sync pending.

## Intelligence Engine Foundation

Implemented:

- severity normalization
- confidence normalization
- rule-based anomaly scoring
- hypothesis templates
- recommended actions
- anomaly to case draft conversion
- intelligence overview builder

No external AI calls are used.

## Backend Summaries and API Contracts

Added protected read-only intelligence endpoints:

- `GET /api/intelligence/overview`
- `GET /api/intelligence/clients`
- `GET /api/intelligence/signals`
- `GET /api/intelligence/anomalies`
- `GET /api/intelligence/cases`
- `POST /api/intelligence/cases/from-anomaly`
- `PATCH /api/intelligence/cases/:id/status`
- `GET /api/intelligence/playbooks`
- `GET /api/intelligence/connectors`

POST/PATCH endpoints are dry-run/draft only and do not persist.

API docs:

- `docs/api/intelligence-api-v1.5.md`

## Frontend Compatibility

Frontend TypeScript types and API helpers were added for:

- ClientSummary
- SignalSummary
- AnomalySummary
- CaseSummary
- PlaybookSummary
- ConnectorSummary
- IntelligenceOverview

No full frontend redesign was done.

## Lovable Prompt

Added:

- `docs/lovable/prompts/control-tower-v1.5-real-operational-intelligence.md`

Lovable manual action remains required to adjust display if desired.

## Railway Status

Railway backend remains the existing production service:

`https://cornerops-ai-production.up.railway.app`

No Railway auth change or token rotation was performed in v1.5.

## Safety Posture

Still disabled:

- Supabase writes
- Lovable mutations
- GitHub writes
- WhatsApp sends
- external emails
- customer channels
- OpenClaw
- service-role use in app code

## Next Action

Founder/admin may fill the CSV templates and manually review import SQL/schema mapping before any Supabase admin import.

Lovable can use the v1.5 prompt to display the new intelligence contracts from the existing Railway API.
