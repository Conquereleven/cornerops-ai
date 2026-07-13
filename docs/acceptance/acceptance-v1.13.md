# Acceptance v1.13

- Branch: `feature/authorized-seller-network-v1.13`
- Base: `6754ddd6669ecf3e1a169cfc262fe121c6fb3f54`
- Registry: 32 unique sellers; Intermex once; Casinetto once; seven extension scores null.
- Catalog: Intermex 190 reused; remaining seller captures pending or blocked, no invented products.
- Safety: all v1.13 flags default false; writes approval-gated; external contact and CornerMex mutations blocked.
- Persistence: private-schema migration plus one constraint-only compatibility hotfix; append-only protections and least-privilege grants.
- Migration review: `approved_for_application`; SHA-256 `8e939326d561d9b1d66539486e146c8db9ce42709b35d5d24d33f714da5ade8f`; only `cornerops_internal` changes, no destructive SQL, public-table mutation, fake seller rows, runtime DDL or service-role grant.
- Comparison: deterministic, no market completeness or best-supplier claim.
- Implementation PR: `#60`, merged as `fc26c698d83e47971a7800c989d8e1f8b70a5d56`.
- Production hotfix PRs: `#61` fixed the package fingerprint column and `#62` allowed the pinned authorized-seller comparison scope; both merged after green CI.
- Applied migrations:
  - `supplygraph_authorized_seller_network_v113`, SHA-256 `8e939326d561d9b1d66539486e146c8db9ce42709b35d5d24d33f714da5ade8f`.
  - `supplygraph_multi_seller_scope_v113`, SHA-256 `a76adaa126a05dc3d078f35bcbb975739ac31339c6be58ea549699ec6f9d5032`.
- Runtime privilege probes: `DELETE`, append-only `UPDATE` and DDL each failed with PostgreSQL `42501`.
- Supabase advisors: no `cornerops_internal` security lints; INFO-level missing-FK-index and unused-index observations remain as performance backlog. The private schema is not exposed to Data API roles; `anon`, `authenticated` and `service_role` have no grants on the v1.13 tables.
- Railway: v1.13 flags enabled except bounded external seller capture, which remains disabled. The service returned HTTP 200 after deployment and after one explicit durability redeploy.
- Onboarding: 32 independent packages created, 32 linked approvals approved, 32 applications persisted, 32 unique seller profiles present, one Intermex profile reused, and no seller/customer contact occurred.
- Catalogs: Intermex remains the only catalog-ready seller with 190 checksum-pinned products. The other 31 sellers remain profile-only; 24 official sources were reachable, three were blocked and five unavailable.
- Inventory: 190 idempotent initial ledger events and balances, 100 operational units per Intermex product, 19,000 total; zero products are represented as physically counted.
- Matching acceptance: a sanitized two-item demand produced one match and one unmatched item across 32 authorized profiles. The identical request reused the same run and fingerprint; a changed demand version produced a new run/fingerprint; stale version returned HTTP 409. Two immutable runs, 64 supplier-coverage rows, two pending non-executing approvals and audits survived redeploy.
- Comparison truth: split sourcing may be required, no preferred seller was selected, market completeness and best-seller claims remain false, and basket optimization remains unimplemented.
- CornerMex read-only regression: checks remained read-only with writes and sends blocked; the current public CornerMex read model still reports nine products and was not mutated by this sprint.
- Kill switches: focused tests verified fail-closed behavior; production was restored with authorized seller, onboarding, media, inventory and comparison flags enabled while external capture remained off.
- Frontend: source implementation typechecked and built in the implementation PR. Railway does not serve the SPA route (`/authorized-sellers` returned HTTP 404). The single Lovable execution was attempted against the existing private Control Tower and failed before editing with `403 insufficient_scope: projects:write`; no second attempt was made.
- Rollback: disable the v1.13 flags; historical reads, packages, profiles, inventory ledger, approvals, audits and match runs remain immutable and readable.

Current implementation status: `supplygraph_v1_13_live_partial_seller_catalogs_frontend`.
