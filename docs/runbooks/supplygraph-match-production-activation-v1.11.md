# SupplyGraph match production activation v1.11

1. Confirm target Supabase project and review migration checksum.
2. Apply only `20260713020000_supplygraph_match_engine_v111.sql`.
3. Run security/performance advisors and inspect exact runtime grants.
4. Probe allowed inserts/selects and denied updates/deletes/truncate/DDL in a rolled-back transaction.
5. Set `SUPPLYGRAPH_MATCHING_ENABLED=true` and `SUPPLYGRAPH_MATCH_MAX_CANDIDATES_PER_ITEM=5` in Railway.
6. Redeploy once and verify health, SupplyGraph status and authentication matrix.
7. Run the sanitized acceptance demand, repeat it, change its version, test stale version and approval.
8. Restart once and verify immutable persistence and unchanged CornerMex counts.

Rollback: set `SUPPLYGRAPH_MATCHING_ENABLED=false` and redeploy. Match POST must return 503; historical
reads and v1.10 SupplyGraph remain available. Never drop matching tables.
