# Audit Viewer v0.8

Audit Viewer combines domain reads, agent events, OpenClaw events and sanitized operator-channel rejections. Filters cover latest, denied, errors, approvals and Telegram.

Displayed fields are timestamp, event type, agent, source/channel, policy decision, status, audit ID, risk and a truncated sanitized preview. Secret-shaped fields are redacted, email/phone values are masked, and message/text/content fields are never displayed raw. Rejection events expose only their reason and never the rejected message preview.

Investigate an issue by filtering denied or errors, recording the `auditId`, checking the source and policy decision, and then comparing it with Control Tower security warnings. Do not copy private payloads into tickets.

The viewer is bounded by `CORNEROPS_AUDIT_VIEWER_MAX_EVENTS` and is disabled with `CORNEROPS_AUDIT_VIEWER_ENABLED=false`.
