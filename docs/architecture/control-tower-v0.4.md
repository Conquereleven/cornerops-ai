# Control Tower v0.4

Control Tower is the internal operator report for beta readiness. It exposes system health, beta mode, business-data mode, schema discovery, contract confidence, agents, GitHub, OpenClaw, context, audit, approvals, security warnings and disabled risky sources.

Since v0.6 it also exposes `operatorChannel`: selected provider, enabled state,
mode, dry-run/reply state, allowlist counts, last inbound/outbound timestamps,
rejections during the last 24 hours, Telegram readiness, Slack deferral and the
OpenClaw bridge state. Counters and timestamps are process-local in v0.6.

v0.7 adds persistent Telegram replay/rejection/rate-limit store health, group
rejection, action/reply modes and first-real-source readiness. In-memory
channel timestamps remain observational; rejection totals come from the
persistent store.

Commands:

```bash
npm run control:tower
npm run control:tower:beta
npm run demo:control-tower
```

API:

- `GET /api/control-tower/status`
- `GET /api/control-tower/beta`
- `GET /api/control-tower/data-contracts`
- `GET /api/control-tower/schema-discovery`
- `GET /api/control-tower/security`

`CORNEROPS_CONTROL_TOWER_REQUIRE_AUTH=true` enables the existing internal API-key middleware. The default beta report contains sanitized operational metadata only; production deployment must enable authentication before network exposure.

Mock mode is healthy when read-only, write blocking, PII masking and audit controls are intact. Requesting a real DB without a valid read-only connection is degraded. Any critical safety flag produces unhealthy status.

## v0.8 web console

v0.8 adds `ControlTowerV08ReportService` as the single sanitized contract for the React `/control-tower` page, versioned local API and static HTML report. Approval Center and Audit Viewer consume existing approval/audit sources; neither becomes a source of truth. The web guard requires explicit enablement, loopback, token auth, read-only, dry-run and fail-closed safety.

See `docs/operator/control-tower-web-console-v0.8.md` and `docs/security/web-console-security-v0.8.md`.
