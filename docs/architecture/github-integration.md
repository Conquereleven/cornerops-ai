# GitHub Integration v0.1

GitHub opera en dry-run por defecto.

## Variables

- `GITHUB_ENABLED=false`
- `GITHUB_DRY_RUN=true`
- `GITHUB_TOKEN=`
- `GITHUB_OWNER=`
- `GITHUB_REPO=cornerops-ai`
- `GITHUB_WEBHOOK_SECRET=`

## Flujo Create Issue

1. `createIssueDraft` genera titulo/body/labels/idempotency key.
2. Si `GITHUB_DRY_RUN=true`, `createIssue` devuelve `dry_run`.
3. Si `GITHUB_DRY_RUN=false`, exige approval aprobado.
4. En v0.1 la escritura real queda intencionalmente no cableada.

## Webhooks

`GitHubWebhookHandler` valida `x-hub-signature-256` con HMAC SHA-256, rechaza firmas invalidas y deduplica por delivery id. En Express actual se reconstruye el body desde JSON; antes de produccion se debe capturar raw body.

## Octopool

Si `OCTOPOOL_ENABLED=true`, lecturas de issues, PRs y workflows pueden usar `OctopoolGitHubRelayAdapter`. Sigue siendo read-only/dry-run.

## Errores

El cliente normaliza 401, 403, 404, 422 y 5xx para tests y manejo futuro de rate limits/retries.
