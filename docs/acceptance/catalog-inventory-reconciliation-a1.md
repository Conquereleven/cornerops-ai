# Catalog and Inventory Reconciliation A1

Observed on 2026-07-13. Counts are acceptance evidence, not runtime constants.

| Scope | Count | Meaning |
| --- | ---: | --- |
| CornerMex Operational Products | 9 | Rows readable from the limited CornerOps Supabase read replica |
| CornerMex Active Products | 9 | Active rows in that limited read model |
| CornerMex products with price and stock fields | 9 | Field presence only; not independent physical verification |
| SupplyGraph Supplier Listings | 489 | Supplier-side listings across the verified internal network |
| Intermex Supplier Listings | 190 | Checksum-pinned Intermex subset |
| Non-Intermex Supplier Listings | 299 | Remaining supplier listings |
| Managed supplier media | 278 | Internal supplier media assets |
| CornerOps Operational Planning Inventory products | 489 | Planning records, not commercial inventory |
| CornerOps Operational Planning Inventory units | 48,900 | Initialized planning quantity, not physical stock |
| Physically Verified Inventory | 0 | No explicit physical evidence |

The nine, 190 and 489 counts measure different scopes and must not be merged. The historical stock value `50` appears in `20260606013014_dc708c0e-8aed-42e8-bdc0-03b193c62a44.sql`, a historical fixture/seed migration. It is `unsafe_legacy` for runtime inventory decisions and is not authoritative. The 100-unit CornerOps initialization is planning-only and must never be copied to CornerMex.

Current evidence does not support exact CornerMex total sellable units, duplicate SKU, orphan inventory or orphan media conclusions from the active production project; these remain `unknown`, not zero. Supplier identity and catalog checks report no known production blocker, while physically verified inventory remains zero.

Activation remains manual: supplier listing -> internal candidate -> Founder Approval -> CornerMex draft -> compliance review -> price review -> explicit inventory allocation -> activation. Automatic synchronization and activation are blocked.
