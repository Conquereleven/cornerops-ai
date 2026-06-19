# Operator Channel Security v0.6

## Threat model

The boundary assumes forged webhooks, unknown users, stolen chat IDs, prompt injection, oversized payloads, sensitive text, replay attempts, unsafe commands, misconfiguration and gateway failure. Telegram/OpenClaw are untrusted transport layers; CornerOps owns authorization and decisions.

## Controls

- Default-off global and provider flags.
- Exact user and chat/channel allowlists; missing real-provider allowlists deny all messages.
- Telegram webhook secret checked with constant-time comparison.
- Private DM by default; groups require explicit chat allowlisting.
- No proactive messages and no destination supplied by model output.
- Response destination copied from the authorized inbound message.
- Read-only, dry-run, approval, PII masking, log sanitization and fail-closed checks.
- External sends, WhatsApp, writes, payment/order changes, merges and deploys blocked before command routing.
- Sanitized inbound/outbound audits store metadata and lengths, never raw message text or payloads.
- OpenClaw bridge requires identity/destination metadata and cannot bypass policy, router or audit.

## Secrets and PII

Tokens and webhook secrets are read from environment only and sensitive-key sanitization redacts them from audit/log structures. Channel responses mask email and phone values, avoid raw logs/private messages and enforce a size limit.

## Failure behavior

Missing credentials keep Telegram disabled or dry-run. Missing audit or safety controls deny processing. OpenClaw unavailability does not affect the CLI or native mock path. Unknown senders receive no adapter reply; the rejection is audited internally.

## Incident response

1. Disable the global channel flag and provider flag.
2. Remove the provider webhook.
3. Rotate Telegram/OpenClaw credentials.
4. Review `operator_channel_inbound`, `operator_channel_outbound` and webhook-denied events.
5. Confirm Control Tower rejection counts and no write/external-send flags were enabled.
6. Re-enable only in dry-run with a newly verified allowlist.
