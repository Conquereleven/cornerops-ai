# Control Tower v0.4

Control Tower is the internal operator report for beta readiness. It exposes system health, beta mode, business-data mode, schema discovery, contract confidence, agents, GitHub, OpenClaw, context, audit, approvals, security warnings and disabled risky sources.

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
