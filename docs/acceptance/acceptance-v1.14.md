# Acceptance v1.14

## Delivery State

- Starting main: `a81cc9c6bb4c656f424c85f9d5a532cec3d83c14`
- Branch: `feature/wave1-catalog-activation-frontend-v1.14`
- Migration: `migration_not_required_existing_schema_sufficient`
- Lovable execution decision: `not_required`
- Basket Optimizer: deferred to v1.15

## Capture Evidence

- Exactly 14 Wave 1 profiles; Intermex appears once and is reused.
- Six new official catalogs captured: La Tiendita, Maiz Tacos, FreshOnTable, Greenheart Organic Farms, Emirates Bio Farm and Burro Blanco.
- 299 new products and prices captured; 278 official image references discovered.
- Seven blocked/profile-only sellers preserve truthful blockers and create no products.
- Snapshot validator passes for all 13 non-Intermex snapshots.

## Implementation Evidence

- Shared bounded offline capture service plus 13 seller adapter definitions.
- Public web and public menu price types preserved.
- Existing package, Approval, application, media, inventory, Work Queue, matching and audit architecture reused.
- One +100 operational inventory seed per new item; physical count remains false.
- Wave 1, capture, media, inventory, comparison and frontend kill switches remain available.
- SPA hosting serves only non-API HTML GET routes and preserves JSON API 404s.
- Live frontend routes implemented without mocks or embedded secrets.

## Pre-Production Validation

- Focused backend/regression tests: 5 suites / 28 tests passed before final hardening.
- JavaScript syntax: 594 files passed.
- Frontend TypeScript and production build: passed.
- Backend Jest: 122 suites / 619 tests passed.
- Frontend Vitest: 4 files / 7 tests passed.
- `git diff --check` and secret-pattern diff scan: passed.

## Production Gates

Pending after green implementation PR:

1. Merge and configure Railway flags.
2. Deploy once and verify backend plus five SPA routes.
3. Create, preview, approve and apply six catalog-extension packages.
4. Import validated managed media.
5. Verify 299 idempotent inventory seeds and unchanged Intermex balances.
6. Run one multi-seller production comparison.
7. Restart once and verify persistence.
8. Run CornerMex read-only regression.

## Safety

No CornerMex mutation, seller/customer contact, email, WhatsApp, Auth account, RFQ, purchase, quote, activation, OpenClaw execution or complete-market claim is enabled.
