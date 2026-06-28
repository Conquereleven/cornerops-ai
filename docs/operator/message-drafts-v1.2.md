# Message Drafts v1.2

Message drafts prepare local/internal text for review. They do not send anything.

## Draft Types
- `whatsapp_follow_up_draft`
- `email_follow_up_draft`
- `quote_follow_up_draft`
- `payment_review_draft`
- `b2b_lead_intro_draft`

## Rules
- Drafts are local/internal only.
- No WhatsApp API is called.
- No email API is called.
- PII is sanitized/masked by policy.
- Every draft is audited.
- Every draft returns `sendStatus=not_sendable_in_v1.2`.

Run:

```bash
npm run demo:message-drafts
```
