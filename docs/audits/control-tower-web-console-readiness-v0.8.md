# Control Tower Web Console Readiness v0.8

## Current state

- Control Tower v0.7 already aggregates agents, data/context sources, Telegram security, first-source readiness, approvals, audit summaries and strict-security warnings.
- Express serves an existing React 19/Vite command center, so the recommended path is a minimal `/control-tower` page backed by versioned local APIs.
- The existing `OperatorCommandRouter` already provides policy-routed, audited, read-only operator requests.
- Approval records are process-local and approval decisions do not execute their underlying action.
- Domain, agent and OpenClaw audit services are available; persistent Telegram rejections can be included without exposing sender identifiers.

## Chosen implementation path

Use the existing frontend and API. Add a unified v0.8 report, guarded read-only endpoints, a React console page and a generated local HTML fallback. Reuse existing services; do not create another source of truth.

## Readiness by surface

- Auth/local-only: ready after explicit enablement and a private console token. Disabled by default and fail-closed when the token is missing.
- Approval Center: ready for in-memory approve/reject simulation only. Real execution remains blocked.
- Audit Viewer: ready with normalized, truncated and PII-masked previews.
- Security Dashboard: ready from existing Control Tower and persistent operator-security health.
- Operator Ask: ready through `OperatorCommandRouter`; approval commands are blocked from the ask box.

## Risks

- Auth is a local bearer token, not multi-user identity or SSO.
- Approval and most audit state are process-local.
- JSON replay/rejection/rate-limit stores are single-process only.
- Localhost checks must not be placed behind an untrusted reverse proxy.
- A static HTML report is a point-in-time snapshot and has no interactive controls.

## Disabled scope

Production writes, order/payment mutations, external sends, proactive Telegram, WhatsApp, customer channels, crawler syncs, native host tools, ClawHub execution and approval-triggered execution remain disabled.

## Plan

1. Introduce safe web-console configuration and guard middleware.
2. Build a unified v0.8 report plus Approval Center and Audit Viewer services.
3. Expose versioned local-only APIs and policy-routed Ask.
4. Add the React cockpit and static HTML fallback.
5. Validate report, API, UI, demos, masking and fail-closed behavior.
