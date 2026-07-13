# Authorized Seller Production Activation v1.13

1. Review the registry checksum and migration SHA-256.
2. Require `approved_for_application`, apply the single migration and run Supabase security/performance advisors.
3. Introspect grants and roll back forbidden update/delete probes.
4. Enable registry/onboarding flags in Railway; keep capture, application, media, inventory and comparison off until each gate is accepted.
5. Create and review 32 packages individually; approve/apply only valid packages.
6. Verify Intermex remains one supplier with 190 products and existing inventory is preserved.
7. Enable comparison only after two catalog-backed sellers exist. Restart once and verify durability.

Rollback: disable every `SUPPLYGRAPH_*_ENABLED` v1.13 switch. Historical reads remain available; never delete records.
