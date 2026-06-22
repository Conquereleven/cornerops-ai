# Internal Beta Readiness v0.6

- [x] CLI and Interactive Beta v0.5 remain available.
- [x] Control Tower includes operator-channel status.
- [x] Mock channel demo runs without credentials.
- [x] Telegram DM adapter and webhook setup are documented.
- [x] Exact user/chat allowlists are required for real providers.
- [x] Unknown senders and destinations are rejected before routing.
- [x] Write and external-send requests are blocked.
- [x] Replies are bound to the same approved destination.
- [x] Inbound and outbound events are audited without raw message text.
- [x] PII masking, dry-run and fail-closed defaults are active.
- [x] OpenClaw is optional and cannot bypass CornerOps policy.
- [x] Rollback is documented.
- [x] WhatsApp, customer/prospect channels, Slack events and proactive sends are disabled.
- [ ] Founder Telegram user/chat IDs and secrets configured in an approved environment.
- [ ] HTTPS webhook endpoint deployed and observed in dry-run.
- [ ] Durable/replay-resistant inbound event persistence.

Release decision: ready for mock beta and Telegram dry-run onboarding; not approved for real replies until environment-specific review.
