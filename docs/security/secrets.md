# Secrets

Never commit `.env`, API keys, tokens, passwords, OAuth grants or provider
credentials.

Use `.env.example` as the public contract. Real credentials must live in the
runtime environment or secret manager. Logs and audit records redact token,
password, secret and key-shaped fields.
