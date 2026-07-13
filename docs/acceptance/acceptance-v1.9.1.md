# Acceptance v1.9.1

## Current state

- Starting main SHA: `528eb2ceec6db7c7eaa83d0282a716d009e37cd0`
- Branch: `ops/activate-internal-operations-v1.9.1`
- PR #47: merged with successful CI
- Migration checksum: `20e2f52e1e0735b110f6c480d960d256d2fdebaf71b81149e087caee553aa1f9`
- Migration: applied as `20260712001957_cornerops_internal_work_queue_v19`
- Internal schema: 3 tables, 11 indexes, 8 runtime grants
- Restricted login: provisioned; catalog and live Railway permission matrices pass
- Railway restricted URL: configured through verified Session Pooler
- Railway deployment: `b53f4a16-b2f7-4798-bf23-3cac380aef65`, online with internal persistence enabled
- Founder-action token: generated locally, hash verified, mode `0600`, distinct from operator credential
- Work Queue status: `ready`, provider `postgres`, durable `true`, schema `cornerops_internal`
- Read authentication: missing 401, invalid 403, valid operator 200
- Mutation authentication: missing founder token 401, invalid founder token 403, founder-only 403, non-JSON 415, disallowed origin 403
- First sync: 3 scanned, 3 created, 0 reused, 0 errors
- Second sync: 3 scanned, 0 created, 3 reused, 0 errors
- Optimistic locking: version 1 to 2; stale version rejected with HTTP 409; audit persisted
- Internal approval: approved with the required reason; `executed=false`, external sends and production mutations blocked; conflicting decision rejected with HTTP 409; three related audit events persisted
- Persistence after redeploy: passed first on deployment `c3d87cac-0445-4fa9-982c-733c73e2cd73` and again after the approval decision on `b53f4a16-b2f7-4798-bf23-3cac380aef65`; the same work item, approval, version 2, and audit IDs remained present; provider `postgres`, durable and healthy; no memory/file fallback
- Railway baseline: existing read-only configuration untouched
- Final status: `v1_9_1_live_internal_persistence`

## Supabase advisors

No new critical finding was reported for `cornerops_internal`. New internal indexes are unused because the schema was just created. Preexisting public-schema findings remain unchanged, including security-definer read views and disabled RLS on `products_backup_pre_intermex_import`. They are not silently remediated in this sprint.

## Acceptance gates

- All production activation gates passed.

## Safety state

The production persistence flag is enabled only for `cornerops_internal`. The restricted runtime login has no privilege on public business tables. Exact aggregate counts after activation are products 199, orders 5, customers 4, and B2B leads 0. The configured read model exposes 9 active products and remains read-only; this difference is documented and no catalog data was changed. No customer channel, external send, product activation, payment, order, lead, or customer mutation was executed by CornerOps. OpenClaw remains disabled.

## Prod Watch

The encrypted GitHub Actions secret `CONTROL_TOWER_OPERATOR_TOKEN` is configured without exposing its value. Consecutive manual runs `29210416852` and `29210433180` passed public health, authenticated Work Queue status, and the repository Supabase read-only check. The authenticated step executed in both runs.
