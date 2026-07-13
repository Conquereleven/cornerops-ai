# CornerMex x CornerOps Boundary A1

## Decision

The operating model is `single_merchant_with_internal_supplier_network`. CornerMex is the commerce system of record. CornerOps is the operations-intelligence system of record. The canonical machine contract is `contracts/cornermex-cornerops-boundary-v1.json` (SHA-256 `b87acfbdeac1427e141677616a0d8fbda5ecabc10a4c84012a9bd5d8bc98249a`).

## Data sources

| Role | Project ref | Evidence | Classification |
| --- | --- | --- | --- |
| CornerMex active commerce | `ywyiejqnbyzjfatojvkh` | Repository Supabase config and production deployment references | `active_production` |
| CornerMex candidate | `wlrfknmrhowldygmvtvn` | Supabase project inspection; empty public schema and storage | `target_production` |
| CornerOps | `nhxpujypqxbjiqqddxqt` | CornerOps production configuration | `operations_intelligence` and `external_read_replica` for the current limited CornerMex read model |

The candidate project must not replace production automatically. CornerOps reads a limited replicated model, not the active CornerMex database directly. Every response must expose source project, source mode, freshness, masking and warnings. Unavailable data remains unavailable, never zero and never a mock production fallback.

## Ownership

CornerMex owns customer identity and PII, sellable products, prices, commercial inventory, checkout, orders, payments, fulfillment, published marketing, reviews and raw commerce analytics. CornerOps owns supplier evidence, SupplyGraph listings, sourcing and procurement analysis, planning inventory, internal drafts, Work Queue, approvals and audit.

Supplier listings are not sellable products. CornerOps planning units are not physical or sellable stock. Cross-system references are immutable IDs; names, email addresses and phone numbers are not linking keys. No fuzzy automatic linking is allowed.

## Integration

Current direction is CornerMex to CornerOps: `read_only_masked_or_aggregated`. The reverse direction is blocked. There is no mapping table and no command bridge. A future command bridge requires separate credentials, signed allowlisted commands, optimistic versioning, idempotency, expiry, replay protection, audit, compensation and a kill switch.

Marketing Intelligence v1.16 remains deferred until A1 acceptance. OpenClaw and all external execution remain disabled.
