# Runbook: GitHub Webhooks

Endpoint: `POST /api/github/webhook`.

Headers requeridos:

- `x-github-delivery`
- `x-github-event`
- `x-hub-signature-256`

Configurar `GITHUB_WEBHOOK_SECRET`. El handler valida firma, deduplica delivery id y audita recepcion. Antes de produccion, configurar raw body middleware para validar exactamente el payload recibido.
