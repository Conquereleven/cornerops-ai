# CornerOps v1.16 reuse map

Canonical objective: **CornerMex Control Plane + Internal Marketing Intelligence**.
The architecture extends the v1.15 Unified Command Center; it does not add a
second dashboard or parallel API.

| Need | v1.15 capability | Classification | v1.16 treatment |
|---|---|---|---|
| Module registry | Typed 35-module registry | reuse unchanged | Keep the single navigation authority and its read-only boundary. |
| Frontend control-tower contract | `/api/control-tower/frontend/v1` | extend existing | Add canonical program state to existing sections and add only registry-aligned capability/environment sections. |
| Founder Daily | Existing section and operator command | extend existing | Replace static credential advice with deterministic canonical evidence synthesis. |
| CornerMex Ops | Existing `cornermex` section and module | extend existing | Include source SHA, deployments, governance, readiness, blockers and freshness. |
| B2B Leads | Existing module and repositories | extend existing | Accept only the missing canonical 10-account pack after validation. |
| Products | Existing product module/contracts | extend existing | Accept only the missing canonical 18-SKU pack after validation. |
| SupplyGraph | Existing seller evidence services | reuse unchanged | Remains evidence input; never becomes invented CornerMex catalog data. |
| Work Queue | Existing internal store/service | extend existing | Deterministic stable tasks from blockers/next actions with evidence checksum. |
| Drafts | Existing draft service/section | extend existing | v1.16 canonical quotes use `DRAFT_NOT_SENT`; external send remains impossible. |
| Approvals | Existing Approval Engine | extend existing | Founder decisions remain internal and never authorize external execution. |
| Audit Log | Existing sanitized append-only store | extend existing | Program imports/classifications/tasks/approvals preserve sanitized evidence. |
| Marketing Hub | Existing internal read-only module family | reuse unchanged | Internal intelligence only; publishing, spend and customer contact blocked. |
| Capability Status | Existing module/matrix | extend existing | Expose program adapter and explicit blocked capabilities. |
| Environment Doctor | Existing module/service | extend existing | Report source/freshness/auto-deploy posture without secret values. |
| Quote queue | No canonical queue | missing | Add internal validated queue; empty and blocked while canonical packs are absent. |
| External channels/publication | Disabled v1.15 paths | explicitly deferred | Email, WhatsApp, publication and external communications stay blocked. |

## Canonical input discovery

No complete authorized package containing exactly 10 B2B accounts and 18 SKUs
exists in the repository at implementation time. Runtime status is therefore
`canonical_input_pack_missing`. Validators and an empty fail-closed quote queue
are implemented; no account, contact, SKU, price, inventory or product is
invented.
