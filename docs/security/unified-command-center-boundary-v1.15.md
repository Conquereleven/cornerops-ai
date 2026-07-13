# Unified Command Center Security Boundary v1.15

- Operator authentication remains required for protected reads.
- Founder Action authentication remains separate and is never persisted by the frontend.
- No token, environment value, raw PII or database error is rendered into assets.
- No CORS origin, rate limit or runtime database grant is weakened.
- The browser never writes directly to PostgreSQL or Supabase.
- Status pages do not execute actions.
- External sends, publishing, spend, activation, RFQ, negotiation, purchasing, stock reservation, seller Auth and OpenClaw remain blocked.
- Approvals remain `executed:false`; Audit remains append-only.
