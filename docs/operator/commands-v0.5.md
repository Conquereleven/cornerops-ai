# Operator Commands v0.5

## CLI

| Command | Purpose |
| --- | --- |
| `npm run cornerops` | Interactive local session |
| `npm run cornerops -- help` | Commands, mode, sources and safety |
| `npm run cornerops -- ask "..."` | Natural-language operator request |
| `npm run cornerops -- briefing` | Executive daily briefing |
| `npm run cornerops -- control` | Control Tower beta summary |
| `npm run cornerops -- health` | Data-source health |
| `npm run cornerops -- approvals` | Pending approvals |
| `npm run cornerops -- approvals approve <id>` | Simulate approval; execute nothing |
| `npm run cornerops -- approvals reject <id>` | Reject proposal in memory |
| `npm run cornerops -- audit` | Last 20 sanitized audit events |
| `npm run cornerops -- audit denied` | Denied events |
| `npm run cornerops -- audit errors` | Error events |

Supported questions cover briefing, B2B leads/drafts, quotes, orders, manual payments, GitHub/Codex, security, Control Tower, data/context health, approvals and audit.

Every response reports source mode, suggested actions, approval state, warnings and audit ID. Briefings and drafts use specialized founder-readable formats.

## Optional API

The API is local-only, protected by existing internal auth and disabled unless `CORNEROPS_API_ENABLED=true`:

- `POST /api/operator/ask`
- `GET /api/operator/help`
- `GET /api/operator/status`
- `GET /api/operator/approvals`
- `GET /api/operator/audit-summary?filter=denied|errors`
- `GET /api/operator/sessions/:id`

Do not expose these routes publicly. The web operator UI remains disabled and future work.
