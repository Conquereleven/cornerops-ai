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

## Verified production posture

- Runtime role: `SELECT, INSERT`; no update, delete, truncate, or schema create.
- External database roles: no access to `cornerops_internal` matching tables.
- Current scope: one verified supplier and 190 checksum-pinned catalog observations.
- Fulfillment facts remain unknown until supplier evidence exists.
- Supplier/customer contact, quotes, purchasing, activation, CornerMex writes, WhatsApp, email, and OpenClaw
  remain blocked.
- Lovable remains optional presentation only; backend operation is not dependent on it.
