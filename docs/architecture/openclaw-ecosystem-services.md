# OpenClaw Ecosystem Services v0.1

CornerOps AI conserva control. OpenClaw services son capabilities limitadas por feature flags, policy, approvals y audit logs.

| Servicio | Decision v0.1 | Riesgo | Modo |
| --- | --- | --- | --- |
| Crabox | Adapter dry-run para sandbox/test suite | high | dry_run |
| Octopool | Relay GitHub read-only/mock | medium | read_only |
| ClawHub | Skill registry allowlist/read-only | high | read_only |
| Lobster | Workflow shell dry-run | medium | dry_run |
| ClawSweeper | Document-only futuro | medium | document_only |
| Crabfleet | Document-only futuro | critical | document_only |
| ClickClack | Document-only futuro | medium | document_only |

## Reglas

- No installs automaticos desde ClawHub.
- Skills con command execution, filesystem, network, browser o secrets son high/critical.
- Crabox no ejecuta host commands en v0.1.
- Lobster solo simula workflows.
- Crabfleet queda deshabilitado por defecto.

## Feature Flags

`OPENCLAW_ECOSYSTEM_ENABLED`, `CRABOX_ENABLED`, `OCTOPOOL_ENABLED`, `CLAWHUB_ENABLED`, `LOBSTER_ENABLED`, `CLAWSWEEPER_ENABLED`, `CRABFLEET_ENABLED`, `CLICKCLACK_ENABLED`.
