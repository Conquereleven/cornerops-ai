# Runbook: Context Privacy & Security

## PII Masking

Context outputs mask emails, phones and high-PII participants. Audit logs store query summaries and counts, not raw private conversations.

## Retention

Default retention is `CORNEROPS_CONTEXT_RETENTION_DAYS=180`. Changes require approval.

## Source Permissions

Each source declares allowed agents, allowed operations, PII level and approval requirements.

## Leaked Secrets

1. Disable source.
2. Remove record from local archive.
3. Rotate affected secret.
4. Add a security audit event.
5. Re-index only after review.

## Safe Operation

Never index personal WhatsApp/Slack/Telegram/Notion exports without explicit configuration. Do not enable native host tools without approval.
