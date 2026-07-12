# Acceptance v1.9.1

## Current state

- Starting main SHA: `528eb2ceec6db7c7eaa83d0282a716d009e37cd0`
- Branch: `ops/activate-internal-operations-v1.9.1`
- PR #47: merged with successful CI
- Migration checksum: `20e2f52e1e0735b110f6c480d960d256d2fdebaf71b81149e087caee553aa1f9`
- Migration: applied as `20260712001957_cornerops_internal_work_queue_v19`
- Internal schema: 3 tables, 11 indexes, 8 runtime grants
- Restricted login: provisioned; catalog permission matrix passes
- Railway activation: pending explicit production-change authorization
- Final status: pending

## Supabase advisors

No new critical finding was reported for `cornerops_internal`. New internal indexes are unused because the schema was just created. Preexisting public-schema findings remain unchanged, including security-definer read views and disabled RLS on `products_backup_pre_intermex_import`. They are not silently remediated in this sprint.

## Gates still required

- Direct restricted-login permission probes from Railway
- Founder-action token generation and hash verification
- Railway feature variables and deployment
- Production auth matrix
- Two syncs proving idempotency
- Optimistic version conflict
- Approval with `executed=false` and append-only audit
- Persistence across restart
- CornerMex before/after verification
- Two consecutive successful Prod Watch runs

## Safety state

The production persistence flag remains disabled. No CornerMex business record, customer channel, external send, product activation, payment, order, lead, or customer was mutated. OpenClaw remains disabled.
