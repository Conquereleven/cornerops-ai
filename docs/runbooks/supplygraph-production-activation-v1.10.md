# SupplyGraph production activation v1.10

## Preconditions

1. PR CI is green and migration review says `approved_for_application`.
2. Confirm project `nhxpujypqxbjiqqddxqt` and Railway production service `cornerops-ai`.
3. Record migration checksum and aggregate CornerMex counts; never read raw business rows.
4. Keep all SupplyGraph flags false.

## Activation

1. Apply `20260712220000_supplygraph_data_foundation_v110.sql`. If the advisor reports the reviewed
   duplicate canonical index, apply only `20260713010500_supplygraph_remove_duplicate_index_v110.sql`.
2. Run Supabase security and performance advisors.
3. Prove exact runtime grants and rolled-back allowed/forbidden operations.
4. Configure names only:
   - `SUPPLYGRAPH_ENABLED=true`
   - `SUPPLYGRAPH_INTERMEX_SYNC_ENABLED=true`
   - `SUPPLYGRAPH_DEMAND_INTAKE_ENABLED=true`
   - `SUPPLYGRAPH_OBSERVATION_STALE_AFTER_HOURS=168`
   - reviewed source path and checksum
5. Redeploy once and verify health/status/auth separation.
6. Run initial sync once and identical sync once.
7. Create, update, conflict-test and close one sanitized acceptance demand.
8. Verify Work Queue/audit, redeploy, and prove IDs/versions persist.
9. Re-run CornerMex read-only checks and compare aggregate counts.

## Rollback

Set all three SupplyGraph flags false and redeploy. Verify SupplyGraph mutations fail closed while v1.9.1
Work Queue and Approvals remain operational. Preserve all tables, snapshots and audit evidence. Never
truncate, drop or delete forensic data.

## Verified production state

SupplyGraph is enabled on Railway with provider `postgres` and durable private persistence. The initial
190-row sync and its idempotent repeat passed. One synthetic demand was closed after missing-field,
Work Queue, audit and optimistic-lock verification. A restart preserved all captured identities and
versions. Disable all three flags to roll back the feature without removing evidence.
