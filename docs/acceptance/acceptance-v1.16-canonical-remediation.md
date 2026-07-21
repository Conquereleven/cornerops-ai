# CornerOps v1.16 canonical remediation

CornerOps reads only `CURRENT_STATE.json` and `DEPLOYMENT_REGISTRY.json` from the directory configured by `CORNERMEX_PROGRAM_EVIDENCE_ROOT`. `CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS` accepts 1–604800000 milliseconds, defaults to 86400000, and emits a configuration warning when invalid. Paths and evidence documents are not returned to the browser.

Supported contracts are `joint-program-state-v1` and `cornermex-deployment-registry-v2`. Unknown versions fail closed. Evidence validity and runtime readiness remain separate. Production auto-deploy or a push/merge production trigger is a blocking drift condition.

Program work identity is `sha256(sourceRepository + conditionKind + normalizedCondition)` in `idempotencyKey`; mutable SHA, checksum, timestamp, and schema versions remain evidence. Database UUIDs remain database-generated. Cleared conditions are marked `conditionActive: false` and can return with append-only audit history.

Quote Queue uses Option A: Founder Daily and Drafts expose a read-only, fail-closed queue. Until a valid exact 10-account/18-SKU pack exists it is empty, blocked, `DRAFT_NOT_SENT`, and has no external send route.
