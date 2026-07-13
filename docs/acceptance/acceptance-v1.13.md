# Acceptance v1.13

- Branch: `feature/authorized-seller-network-v1.13`
- Base: `6754ddd6669ecf3e1a169cfc262fe121c6fb3f54`
- Registry: 32 unique sellers; Intermex once; Casinetto once; seven extension scores null.
- Catalog: Intermex 190 reused; remaining seller captures pending or blocked, no invented products.
- Safety: all v1.13 flags default false; writes approval-gated; external contact and CornerMex mutations blocked.
- Persistence: one private-schema migration, append-only protections and least-privilege grants.
- Migration review: `approved_for_application`; SHA-256 `8e939326d561d9b1d66539486e146c8db9ce42709b35d5d24d33f714da5ade8f`; only `cornerops_internal` changes, no destructive SQL, public-table mutation, fake seller rows, runtime DDL or service-role grant.
- Comparison: deterministic, no market completeness or best-supplier claim.
- Production and frontend evidence will be appended after CI, migration, Railway and UI acceptance.

Current implementation status: `approved_for_application`; production evidence pending CI, migration and Railway activation.
