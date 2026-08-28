# CornerOps Commerce OS — foundation v1

## Decision

Incubate Commerce OS inside `cornerops-ai` until the tenant-neutral contracts and at least two real
distributor profiles are stable. Do not fork the existing commercial engine or create a second
dashboard. The first product boundary is a profile and connector layer over proven CornerOps
capabilities; extraction into separate repositories happens only after the contract is exercised.

## Reuse assessment

| Existing module | Decision | Commerce OS role |
|---|---|---|
| `core/commercial` | Reuse behind an anti-corruption layer | Accounts, quotes, orders, payments, fulfillment, exceptions and evidence integrity |
| `core/work-queue` | Reuse unchanged | Human tasks, idempotency and operational exceptions |
| Approval Engine | Reuse unchanged | Approval gate for quotes, writes and customer-facing actions |
| Audit and security services | Reuse unchanged | Sanitized evidence, replay protection and actor attribution |
| PostgreSQL persistence | Reuse and extend by migration | Durable tenant-scoped operational state |
| Data contracts and normalizers | Reuse patterns | Canonical inputs from Shopify, Zoho, CSV and future systems |
| Control Tower/module registry | Extend | One multi-tenant operating surface and capability status |
| SupplyGraph | Optional module | Supplier discovery and catalog evidence, not transactional truth |
| CornerMex and Intermex integrations | Do not generalize in place | Tenant adapters and reference implementations only |
| Telegram/operator channels | Optional adapter | Internal alerts and approvals, never the system of record |

The existing commercial state names containing `INTERMEX` are a valid CornerMex implementation,
not a generic distributor contract. Commerce OS must translate generic warehouse events through a
tenant adapter rather than exporting those names to every customer.

## Target architecture

```text
Storefronts / marketplaces / sales imports
                  |
        Connector adapters (Shopify first)
                  |
   Commerce OS canonical profile + event contracts
                  |
   Commercial core | Work Queue | Approvals | Audit
                  |
       Zoho Inventory / Zoho Books / warehouse adapters
                  |
        Control Tower and exception dashboard
```

Connectors are replaceable capabilities. A profile declares which capabilities a tenant needs,
which adapter supplies each one and whether it is manual, read-only or read-write. Credentials
never live in profiles. Missing connectors remain `configuration_required`; the platform does not
invent availability, prices, invoices or fulfillment facts.

## Repository separation

### Now: one incubation repository

Keep the following in `cornerops-ai` while contracts change together:

- `src/core/commerce-os`: tenant-neutral profile, capability and orchestration contracts.
- Existing `src/core/commercial`, work queue, approvals, audit and persistence.
- Connector implementations under a future `src/integrations/commerce` boundary.
- Reference profiles as secret-free fixtures only.

This avoids duplicating security and persistence code and allows one atomic test suite.

### Extraction trigger

Split only after two live tenants use different systems or fulfillment models and the canonical
contracts survive both without tenant conditionals in core code.

1. `cornerops-platform`: versioned internal packages for approvals, audit, work queue, evidence and
   connector SDK.
2. `cornerops-commerce-os`: product API, dashboard, commercial orchestration and official adapters.
3. `cornerops-tenant-config` (private): deployment manifests and secret references; no business
   logic and no raw credentials.

Use pinned package versions and contract tests between repositories. Intermex-specific behavior
belongs in an adapter package; La Despensa, REZFOOD and future distributors receive profiles, not
forks.

## First vertical slice

`Shopify order -> canonical order intake -> approval/exception policy -> Zoho Inventory sales order
-> Zoho Books VAT invoice -> fulfillment status -> customer notification draft`

The first release should remain read-only or draft-only at every external boundary until discovery
confirms identifiers, tax treatment, inventory ownership, fulfillment evidence and approval roles.
Implementation sequence: profile and capability plan (this change), canonical order event contract,
Shopify read adapter, Zoho Inventory/Books sandbox adapters, idempotent orchestration, then dashboard.
