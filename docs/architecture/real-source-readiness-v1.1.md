# Real Source Readiness v1.1

CornerOps AI remains the brain, source of truth, orchestrator, memory, permission layer and audit system. Real sources are read-only inputs.

| Source | Enabled by default | Required env | Credential type | Read-only verification | Write blocking | PII risk | Agent impact | Control Tower | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GitHub | No | `GITHUB_ENABLED`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED` | Fine-grained read-only token | `GITHUB_READ_ONLY=true`, audit reads on, real read check | Issue creation, PR writes and workflow triggers false | Low | `dev-codex-github-agent`, daily briefing, security audit | v1.1 GitHub status | Set `GITHUB_ENABLED=false` |
| Business DB / Supabase / Postgres | No | `CORNEROPS_BUSINESS_DATA_ENABLED`, `READONLY_DATABASE_URL` or Supabase read-only key | Read-only DB/Supabase key | `CORNEROPS_DB_READ_ONLY=true`, row limits, PII masking | `CORNEROPS_DB_ALLOW_WRITES=false`, no migrations | High | daily briefing, B2B, quotes/orders, security audit | v1.1 DB readiness | Set `CORNEROPS_BUSINESS_DATA_ENABLED=false` |
| Telegram operator channel | No | Telegram allowlist/token vars | Bot token | Read-only/operator dry-run flags | Replies dry-run, allowlist required | Medium | Operator access path only | Telegram panel | Disable Telegram flags |
| OpenClaw gateway | No | `OPENCLAW_*` | Gateway token/password | Dry-run/sandbox mode | Tool execution requires approval | Medium | Gateway only, not brain | OpenClaw panel | `OPENCLAW_ENABLED=false` |
| Local archives/context | No | `CORNEROPS_LOCAL_ARCHIVES_*` | Local files | Local internal only | No external mutation | Medium | Context enrichment later | Context health | Disable archive flag |
| Slack/Notion | Documented only | Future context vars | Workspace tokens | Not enabled in v1.1 | Must stay read-only | Medium/high | Future | Disabled sources | Keep disabled |
| WhatsApp | Blocked | None for v1.1 | N/A | N/A | Explicitly blocked | High | None | Safety grid | Keep disabled |

## Decision

GitHub is the first selected real read-only source for v1.1 when credentials are present. If credentials are missing, CornerOps uses mock/readiness mode and does not block tests or demos. Business DB/Supabase readiness is prepared second and remains disabled until safe read-only credentials and schema confidence exist.
