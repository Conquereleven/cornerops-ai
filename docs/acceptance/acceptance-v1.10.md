# Acceptance v1.10

- Starting main: `b29b3d217ba7ca1c250cb438400dbf98a22301cb`
- Branch: `feature/supplygraph-data-foundation-v1.10`
- Lovable credits/actions: 0
- Source: checksum-pinned 190-row repository snapshot
- Source checksum: `90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934`
- Synthetic stock policy: discarded; stored as unknown/null
- Migration review: `approved_for_application`
- Migration checksum: `bc9f1968fe7fc2883f2353a0b2b5a8f5b64ea0a2badfcf4ac8ff9f6c6f9fdcec`
- Safety: CornerMex writes, activation, external actions, outreach, purchasing and OpenClaw blocked
- Main merge: `bab302a` (PR #50); advisor remediation merge `27ce57c`; timestamp remediation merge `03f1e59`
- Current status: `supplygraph_v1_10_live`
- Advisor remediation: redundant canonical lookup index removed; unique constraint preserved
- Runtime remediation: PostgreSQL date values are serialized to ISO strings before API sanitization

## Initial capability matrix

| Capability | Available | Elevation | Planned use |
|---|---:|---|---|
| Repository read/write and tests | yes | repository write | implementation and validation |
| GitHub read/write/merge | yes | authenticated network | PR, CI and merge |
| Supabase read/admin | yes | authenticated connector | migration, advisors and probes |
| Railway read/variables/deploy | yes | authenticated network | flags, deployment and restart |
| Production API verification | yes | authenticated network | status, sync and demand gates |
| Lovable | available but excluded | none | zero actions |

## Production evidence

- Supabase migrations: `20260713005830_supplygraph_data_foundation_v110` and
  `20260713010315_supplygraph_remove_duplicate_index_v110`
- Tables: 5; broad Data API grants: 0; append-only trigger: present
- Runtime matrix: 14 allowed operations and 19 forbidden operations passed; `public.payments` is absent
- Rolled-back probe rows: 0; public schema ACL rows: 0
- Advisors: no SupplyGraph security finding; duplicate internal index remediated; fresh indexes unused as expected
- Railway deployments: activation `5aad45fd-82e5-4ea0-843d-0d325a4d8523`, restart
  `77f0863a-6752-472f-b744-cdd999b6cc7a`, timestamp fix `5dec21db-6010-4c9f-9869-a4c280897084`
- Status: HTTP 200, `ready`, provider `postgres`, durable, schema `cornerops_internal`
- First sync: 190 catalog items and 190 offer snapshots created; 0 skipped/errors
- Second sync: supplier reused, 190 catalog identities reused, 190 snapshots unchanged, 0 created
- Duplicates: 1 supplier total, 190 catalog identities total, 190 offer snapshots total
- Demand acceptance: opaque synthetic request, 2 items, 6 missing fields, status `needs_information`
- Demand update: version 1 to 2; stale version HTTP 409; closed at version 3 without deletion
- Work Queue: one deterministic internal-review item created, condition cleared on closure, persisted at version 2
- Audit: every mutation persisted; acceptance evidence remained after restart
- Restart: supplier, catalog item, offer snapshot, demand, demand item, Work Queue item and audit ID persisted
- Truthfulness: latest observation and required date return ISO timestamps; stock/MOQ/lead/shelf remain unknown
- CornerMex aggregates before/after: products 199, orders 5, customers 4, B2B leads 0
- CornerMex checks: `real_read_only_partial`/`real_read_only`; writes and external sends blocked
- Tests: latest CI 107 suites / 527 tests; lint 553 files, typecheck and build passed
- CI: PRs #50, #51 and #52 green
- Secret scan: passed; no local credentials tracked
- Lovable credits/actions: 0
- Final status: `supplygraph_v1_10_live`

No secrets, raw business rows, supplier recommendation, external action or product activation occurred.
