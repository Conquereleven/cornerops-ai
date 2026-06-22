# IA en Mexico Sprint Context

## Confirmed Context

CornerOps AI is the internal AI operating system for CornerMex. It coordinates
support, sales, order lookups, B2B lead capture, internal operations, workers,
memory, tools and human-approved automation.

Sprint 4-6 delivered:

- Intent routing for support, sales, orders, B2B, handoff and unknown flows.
- Repository-backed workers with deterministic fallbacks.
- Supabase-ready persistence for conversations, messages, leads, customers,
  products, orders and worker events.
- Command Center dashboard for operators.
- Internal API protected by `x-internal-api-key`.
- WhatsApp placeholder adapter and roadmap.
- RAG roadmap using product keywords now and pgvector later.

## Decisions

- CornerOps AI remains the source of business truth.
- External gateways and tools must not own business memory or policy.
- Workers must not invent prices, stock, order states or delivery dates.
- All integrations must degrade to local memory/mocks.
- Sensitive actions require human approval.

## Pending Internal Context

TODO: Complete with notes from the original "IA en Mexico" conversation if
more private sprint history becomes available.

## Risks And Debt

- RBAC is not implemented; internal API key is an initial control only.
- WhatsApp does not yet validate HMAC or send through Meta.
- OpenClaw is not connected to real channels.
- `worker_events` persistence requires running `supabase/schema.sql` in staging.

## Recommended Next Sprints

1. OpenClaw foundation in dry-run mode.
2. Human approvals UI and audit persistence.
3. Real channel routing with allowlists.
4. RAG with pgvector and evaluation.
5. RBAC and production-grade operator auth.
