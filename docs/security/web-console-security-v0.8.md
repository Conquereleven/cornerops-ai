# Web Console Security v0.8

## Threat model

Primary risks are accidental network exposure, stolen local tokens, browser history/session leakage, PII display, policy bypass, approval-to-execution confusion and unsafe reverse-proxy configuration.

## Controls

- Disabled by default and local-loopback only.
- Independent auth token required when enabled; missing auth fails closed.
- Origin allowlist checked when the browser supplies `Origin`.
- Read-only, dry-run and global fail-closed flags are mandatory.
- No business write routes are added.
- Approval decisions never execute underlying actions.
- Ask requests flow through `OperatorCommandRouter`, policies and audit.
- PII masking, private-content redaction, truncation and log sanitization apply.
- Tokens, credentials, raw messages and full sender identifiers are not returned.

Do not expose port 3000 publicly, place this behind an untrusted proxy, put the token in a `VITE_*` variable or reuse a production credential.

## Incident response

1. Set `CORNEROPS_WEB_CONSOLE_ENABLED=false` and restart.
2. Rotate the local console token.
3. Review denied/error events and persistent rejection counts.
4. Confirm write and external-send flags remained blocked.
5. Preserve sanitized audit IDs, not raw private payloads.
