# Acceptance v1.14

## Delivery State

- Starting main: `a81cc9c6bb4c656f424c85f9d5a532cec3d83c14`
- Production evidence base: `cb37394`
- Implementation and hardening PRs: `#64` through `#68`, merged with green CI
- Lovable execution: not required; the existing repository frontend was extended
- Basket Optimizer: deferred to v1.15

## Production Evidence

- Railway health and SPA routes returned HTTP 200 for Authorized Sellers, Seller Catalog, Seller Inventory and Seller Comparison.
- Exactly 14 Wave 1 seller profiles exist; Intermex UAE is reused once.
- Seven sellers are catalog-ready. Six new official catalogs contribute 299 products; unchanged Intermex contributes 190, for 489 persisted products total.
- Seven profile-only sellers remain blocked with explicit evidence gaps and no invented catalog rows.
- 278 official image references were validated and imported into the private `seller-product-assets` bucket: 278 unique paths, 278 import audits and zero pending sources.
- Operational inventory covers 489 products and 48,900 initialized units. Physical and seller-confirmed stock remain false.
- A sanitized multi-seller demand produced five candidates across three seller identities. Repeating identical input reused the same demand and match run.
- Eleven idempotent internal Work Queue recommendations remain non-executing and externally blocked.
- Restart/deploy verification preserved packages, catalogs, inventory, match graph, approvals and audits.
- CornerMex regression remained `real_read_only`: 9 products and zero leads, quotes, orders, customers, payments or fulfillment records; no business counts changed.

## Media Boundary

- Migration: `supplygraph_private_seller_media_bucket_v114`
- Migration SHA-256: `0b4e4948a94da20d8286900f59da47171dc1a7c2691b229ce189dcaf1f6602a8`
- Bucket is private, limited to 5 MB JPEG/PNG/WebP and has no public, anon or authenticated object policy.
- Import used an existing key only in an ephemeral offline process; no key value was logged, committed or retained in temporary files.
- Frontend uses managed evidence when available and the validated official source URL only as a display fallback; it never represents the fallback as managed storage.

## Validation

- JavaScript syntax: 594 files passed.
- Backend Jest: 122 suites / 619 tests passed on the implementation release candidate.
- Frontend Vitest: 4 files / 7 tests passed on the implementation release candidate.
- Frontend TypeScript and production build passed.
- Private-media hardening: 15 focused tests passed, plus green GitHub CI.
- Product-total hotfix: focused frontend regression added, plus green GitHub CI.
- Visual production QA: four SupplyGraph routes loaded with source/safety labels and zero console errors.
- `git diff --check` and secret-pattern scans passed before each merged release change.
- Supabase security/performance advisors showed no new bucket-specific critical finding; existing unrelated advisories remain documented technical debt.

## Safety Result

No CornerMex mutation, seller/customer contact, email, WhatsApp, Auth account, RFQ, purchase, quote, product activation, OpenClaw execution, complete-market claim or physical-stock claim was enabled.

Final status: `supplygraph_v1_14_live_partial_wave1_catalogs_frontend`
