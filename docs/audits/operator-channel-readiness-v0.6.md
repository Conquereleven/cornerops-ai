# Operator Channel Readiness v0.6

## Decision

Telegram founder DM is the first real provider prepared by v0.6. The selected runtime provider remains `mock` and the real channel remains disabled by default. Slack is deferred; WhatsApp and every customer/prospect surface remain prohibited.

## Current surfaces

| Surface | State | Notes |
| --- | --- | --- |
| CLI | Ready | Primary fallback; read-only, dry-run, audited. |
| Internal API | Disabled | Existing auth applies when explicitly enabled. |
| Mock operator channel | Ready | Credential-free demo and tests. |
| Telegram DM | Ready to configure | Native webhook handler, secret validation, user/chat allowlists and dry-run replies. |
| Slack | Pending | Tokens existed only as general placeholders; no stronger native event path than Telegram. |
| OpenClaw bridge | Ready, disabled | Strict metadata bridge; cannot bypass channel policy, router or audit. |
| WhatsApp | Disabled | Customer-facing risk is outside v0.6. |

## Repository findings

- Express and existing webhook conventions make a Telegram webhook feasible without a new framework.
- `ChannelRouter` recognized Telegram and Slack names but did not authenticate a founder, enforce chat allowlists or provide native replies.
- `OperatorCommandRouter`, approvals, sanitized domain audit and Control Tower were available from v0.5 and are reused.
- No durable operator-channel event store exists; status timestamps and rejection counters are process-local.
- No Telegram or Slack production credentials were found or created.

## Required Telegram configuration

- bot token from BotFather
- high-entropy webhook secret
- founder Telegram user ID
- private chat ID
- public HTTPS webhook endpoint terminating at `POST /api/operator-channel/telegram/webhook`

## Security boundaries

All inbound messages pass normalization, provider selection, user/chat allowlists, length and risk policy, sanitized inbound audit, `OperatorCommandRouter`, existing agent policies, chat formatting and sanitized outbound audit. Replies are destination-bound to the originating approved message. Missing metadata, allowlists, audit, PII masking or fail-closed controls deny processing.

## Risks and remaining disabled scope

- Process-local channel status is lost on restart.
- Telegram authenticity depends on HTTPS termination and the configured webhook secret.
- Real reply delivery is implemented but remains off through global/provider flags and dry-run defaults.
- Slack, group chat, proactive messaging, customer channels, WhatsApp, writes, syncs, host automation and ClawHub execution remain disabled.

## Implementation plan completed

1. Generic channel registry, normalizer, policy, router, service and response service.
2. Mock adapter and credential-free demo.
3. Native Telegram DM adapter and disabled webhook.
4. Strict OpenClaw operator bridge.
5. Control Tower status, tests, security documentation and rollback runbook.
