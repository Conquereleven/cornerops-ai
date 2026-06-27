# Controlled Actions v0.9 Architecture

CornerOps remains the brain, source of truth, policy engine and audit owner. OpenClaw is not involved in action decisions and cannot bypass this layer.

## Flow

```txt
operator/agent proposal
  -> ControlledActionRegistry
  -> ControlledActionPolicy + DataAccessPolicy
  -> immutable sanitized payload + SHA-256 checksum
  -> existing ApprovalService / HumanApprovalService
  -> explicit operator decision
  -> checksum verification
  -> ActionIdempotencyService reservation
  -> ControlledActionExecutor
  -> allowlisted handler
  -> audit + terminal lifecycle state
```

Unknown, disabled, high/critical, production-impact or unaudited actions fail closed.

## Allowlist

| Action | Risk | Side effect | Default |
| --- | --- | --- | --- |
| `github.issue.create` | medium | external GitHub issue | disabled, dry-run, approval required |
| `cornerops.note.create` | low | local CornerOps store | disabled, dry-run, approval required |
| `cornerops.task.create` | low | local CornerOps store | disabled, dry-run, approval required |

No dynamic action registration is exposed through the API.

## Approval lifecycle

Decision state remains compatible with existing `pending/approved/rejected`. `executionStatus` adds:

```txt
pending -> approved -> executing -> executed
pending -> approved -> executing -> dry_run_executed
pending -> approved -> executing -> execution_failed
pending -> rejected
pending -> expired
```

The stored action payload and checksum are immutable inputs to execution. Terminal approvals cannot execute twice.

## Idempotency

The key hashes action id, normalized title/body, source request id, approval id and operator id. A critical persistent store reserves execution before handlers run. Duplicate attempts are audited and return the prior terminal state. Real external execution fails closed if this store is unavailable.

## Dry-run and real execution

Dry-run validates policy, approval, checksum, handler and idempotency but invokes no side effect. Real execution additionally requires global and action-specific flags. Local real writes require `CORNEROPS_ALLOW_LOCAL_INTERNAL_WRITES=true`; they only reach isolated `internal-notes` and `internal-tasks` stores.

GitHub real execution requires every GitHub flag, repository identity, token and approved checksum. PR merges, workflow triggers, branch/code writes and repository settings have no handlers and remain denied.

## API

Authenticated local-console endpoints live under `/api/actions`. The execute endpoint still passes the complete policy/checksum/idempotency pipeline; it is not a privileged bypass.
