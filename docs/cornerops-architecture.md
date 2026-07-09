# CornerOps Architecture

CornerOps AI is the internal AI operating system for CornerMex operations. It is not the CornerMex marketplace and it is not the Lovable dashboard.

## System Roles

| System | Role |
| --- | --- |
| CornerOps AI repo | Backend brain, policies, read-only summaries, approvals, audit, operator commands and intelligence contracts |
| Lovable CornerOps Dashboard | Visual cockpit/product dashboard that consumes CornerOps backend APIs |
| CornerMex Lovable marketplace | Customer/storefront and admin product layer |
| Supabase | CornerMex operational data source exposed to CornerOps through reviewed read-only views |
| OpenClaw | Future gateway/capability layer, disabled in this sprint |

## Current v1.4 Live Read-Only Flow

```txt
CornerMex operational records
  -> Supabase read-only public views
  -> Railway CornerOps backend
  -> Control Tower frontend bridge
  -> Lovable CornerOps Dashboard
```

Writes remain blocked. External sends remain blocked. PII is masked before operator/dashboard surfaces.

## v1.5 Real Operational Intelligence Layer

v1.5 adds an AI-ready, rule-based intelligence core:

- Data onboarding templates for products, inventory, B2B leads, orders, order items, payments and fulfillment.
- Manual Supabase import SQL/docs for founder/admin review only.
- Intelligence domain contracts for clients, signals, anomalies, cases, playbooks and connectors.
- A CornerMex `anomaly_events` ingestion contract.
- Safe read-only `/api/intelligence/*` endpoints.
- Frontend TypeScript contracts for dashboard integration.

## Anomaly Lifecycle

```txt
Read-only signal
  -> rule-based anomaly candidate
  -> case draft
  -> founder review
  -> future approval-gated action
```

Implemented now:

- signal normalization from existing CornerMex Flow Engine
- rule-based anomaly candidates
- case drafts
- playbook recommendations

Not implemented now:

- live sync from CornerMex `anomaly_events`
- persistent case mutation
- automated AI scoring
- outbound messages
- production writes

## Case Lifecycle

```txt
draft
  -> open
  -> investigating
  -> dismissed or resolved
```

In v1.5, status changes are dry-run only and return draft responses. No database write occurs.

## Future Anomaly Flow

```txt
CornerMex anomaly_events
  -> CornerOps AI ingestion contract
  -> normalized anomalies
  -> case drafts/cases
  -> Lovable Dashboard
```

## Safety Posture

- CornerOps backend remains read-only for CornerMex.
- Supabase writes remain disabled.
- Lovable mutations remain disabled.
- WhatsApp and email sends remain disabled.
- Customer channels remain disabled.
- OpenClaw remains disabled.
- No service-role key is used in app code.
- No raw PII should be exposed in Lovable.
