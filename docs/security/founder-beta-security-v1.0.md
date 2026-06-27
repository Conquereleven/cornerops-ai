# Founder Beta Security v1.0

CornerOps v1.0 is a local/internal beta. It is designed for founder daily operations without opening broad automation.

## Guarantees

- Local-only bind: `127.0.0.1`.
- Web console auth token required when console is enabled.
- Dry-run defaults remain active.
- Read-only posture remains active.
- Controlled actions require approvals and idempotency.
- GitHub real issue creation is disabled by default.
- WhatsApp, customer/prospect channels and external email are disabled.
- Production business DB writes are blocked.
- Native tools and ClawHub execution remain disabled.
- Backups are local and sanitized.

## Incident response

If setup check reports `Blocked`, do not run daily operations. Fix the unsafe setting first.

If idempotency, audit, approval or persistence storage is unhealthy, keep controlled actions disabled and preserve `.cornerops/state` for review.

If a token is printed or committed, rotate it immediately and remove it from history before sharing the branch.
