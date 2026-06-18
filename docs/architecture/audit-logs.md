# Audit Logs

CornerOps audita requests de agentes, routing, tool invocations, data reads, proposals, approvals, denials, webhooks y servicios OpenClaw.

## Sanitizacion

- Emails: `jo***@domain.com`
- Telefonos: `+52******1234`
- Tokens, passwords, secrets y authorization headers: `[REDACTED]`
- Payloads profundos se truncan.

## Consulta

- API: `GET /api/audit-logs`
- Tool: `readAuditLogsTool`
- Servicio: `auditLogService.list()`

## Riesgo

Eventos `security_denied`, approvals pendientes y servicios OpenClaw invocados deben revisarse como parte del `security-audit-agent`.

## Retencion Recomendada

In-memory actual: 500 eventos. Produccion futura: retencion por ambiente, cifrado, indices por requestId/correlationId y export controlado.

## Lo Que No Debe Guardarse

Credenciales, tokens, service role keys, Authorization headers, payloads grandes sin redaccion, datos personales innecesarios.
