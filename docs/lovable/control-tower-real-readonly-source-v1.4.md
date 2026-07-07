# Lovable Control Tower Real Read-Only Source v1.4

The Lovable Control Tower must treat CornerOps backend as the brain and use the frontend contract as its source.

Relevant backend fields:

- `sourceMode`
- `dataSource`
- `supabaseStatus`
- `tableAvailability`
- `readOnly`
- `writesBlocked`
- `externalSendsBlocked`
- `maskingApplied`
- `auditId`
- `lastReadAt`
- `warnings`

## Display Rules

- Show `repo_discovered` when the CornerMex Lovable repo/migrations are known but no live Supabase read succeeded.
- Show `real_read_only` only when the backend reports it.
- Show `real_read_only_partial` with per-table warnings.
- Show `blocked_by_missing_supabase_readonly_config` or `not_configured` as an activation blocker, not as an error in the UI.
- Never imply live orders, leads, customers, quotes, products, or payments are real unless `sourceMode` is `real_read_only` or `real_read_only_partial`.

## UI States

- `available` / `available_empty` / `available_masked`: green or neutral read-only state.
- `missing_table`: founder setup needed.
- `rls_blocked`: RLS/anon permissions need review.
- `timeout`: retry later or reduce table mapping scope.
- `error_sanitized`: safe failure; show warning without raw backend details.
- `config_missing`: prompt founder to add Supabase URL and anon key.

## Disabled Controls

Keep these disabled:

- WhatsApp sends
- Email sends
- Customer channels
- Proactive outbound
- Supabase writes
- Lovable mutations
- GitHub writes
- OpenClaw execution

Draft and approval UI may be visible, but risky buttons must remain disabled or approval-gated.
