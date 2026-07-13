# SupplyGraph Evidence Production Activation v1.12

## Preconditions

1. CI and the full local gate pass.
2. Migration checksum matches the reviewed artifact.
3. Migration decision is `approved_for_application`.
4. Supabase security/performance advisors have no new critical issue.
5. Runtime privileges pass introspection and rolled-back forbidden-operation probes.

## Activation

1. Apply the reviewed migration once.
2. Set:
   - `SUPPLYGRAPH_SUPPLIER_EVIDENCE_ENABLED=true`
   - `SUPPLYGRAPH_EVIDENCE_APPLICATION_ENABLED=true`
   - `SUPPLYGRAPH_EVIDENCE_MAX_FACTS_PER_PACKAGE=100`
   - `SUPPLYGRAPH_EVIDENCE_EXPIRING_SOON_HOURS=72`
3. Deploy Railway once.
4. Verify health, SupplyGraph status and authenticated evidence reads.
5. Run Package A using an exact current catalog price/source/checksum; preview must show no material conflict.
6. Approve and apply through separate authenticated operations.
7. Run Package B as `acceptance_test`; verify production watermark, match fingerprint and confidence are unchanged.
8. Restart once and verify package, application, Approval, Work Queue and audit durability.

## Rollback

Set `SUPPLYGRAPH_EVIDENCE_APPLICATION_ENABLED=false` and redeploy only if required. If intake must also stop, set `SUPPLYGRAPH_SUPPLIER_EVIDENCE_ENABLED=false`. Do not reverse the migration or delete immutable history. Confirm v1.10 reads, v1.11 match history and CornerMex read-only counts remain available.
