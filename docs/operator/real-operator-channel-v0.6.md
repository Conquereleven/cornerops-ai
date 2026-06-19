# Real Operator Channel v0.6

v0.6 lets one allowlisted founder/operator ask CornerOps questions from a controlled chat channel. CornerOps remains the brain, source of truth, policy engine and audit owner. Telegram or OpenClaw only transports a message and its same-channel reply.

## Enabled and disabled

- Mock provider: implemented and selected by default.
- Telegram private DM: implemented, disabled and dry-run by default.
- OpenClaw bridge: implemented, disabled and dry-run by default.
- Slack: documented for a later phase.
- WhatsApp, groups, customer/prospect channels and proactive sends: disabled.
- Business writes, order/payment mutations, crawler syncs, deploys and host tools: disabled.

## Message flow

`Telegram/mock/OpenClaw -> OperatorChannelService -> allowlist/risk policy -> sanitized audit -> OperatorCommandRouter -> agent/policies -> compact formatter -> sanitized audit -> same chat`

Unknown users or chats are rejected before command routing. Unknown commands return help. Write and external-send requests return a blocked, approval-labelled explanation and execute nothing.

## Replies, sources and approvals

Chat responses show `Status`, `Source`, `Approval`, `Audit` and warnings. PII is masked and long output is shortened with a CLI/Control Tower handoff. Approval status describes review requirements; it never enables the underlying write in v0.6.

## Safe test

```bash
npm run demo:operator-channel
npm run demo:real-operator-channel
```

The first command uses mock data. The second checks configuration and exits without sending. See [`operator-channel-setup`](../runbooks/operator-channel-setup.md) before enabling Telegram.
