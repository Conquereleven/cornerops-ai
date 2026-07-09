# CornerOps Control Tower v1.6 - Founder Review Loop Display

Update the existing CornerOps Control Tower dashboard. Do not create a new Lovable project and do not duplicate backend logic.

## Source Of Truth

Use the CornerOps backend as the brain. The Lovable UI is only the cockpit.

Primary endpoint:

```txt
GET /api/intelligence/founder-review
```

Keep the existing operator token auth flow. Do not store secrets in source code. Do not ask the founder for Supabase service-role keys.

## UI Goal

Add a Founder Review view or dashboard panel that displays:

- Founder Review
- Urgent Actions
- Recommended Actions
- Data Quality
- Anomaly Candidates
- Case Drafts
- Missing Data
- Next Founder Step

## Required Safety Display

Every section must show:

- `sourceMode`
- `readOnly`
- `writesBlocked`
- `externalSendsBlocked`
- `auditId` when present
- PII masking status

## Behavior

- Use mock UI state only when the backend is unavailable.
- Never imply mock/repo-only data is live operational truth.
- Render `missingData` as a checklist.
- Render `urgentActions` and `recommendedActions` as review-only cards.
- Render `caseDrafts` as draft/approval-gated. Do not show enabled mutation buttons.
- Show disabled buttons for WhatsApp/email sends with copy: `Disabled in v1.6`.
- Keep the existing Control Tower navigation and visual language.

## Do Not

- Do not enable writes.
- Do not enable Supabase runtime writes.
- Do not send WhatsApp or email.
- Do not create customer channels.
- Do not enable OpenClaw execution.
- Do not expose raw PII or secrets.
- Do not modify the CornerMex marketplace project.

## Suggested Layout

1. Top summary card: executive summary, source mode, data quality.
2. Urgent actions: highest priority review-only cards.
3. Operational metrics: products, leads, quotes, orders, payments, fulfillment.
4. Risk columns: inventory, payment, fulfillment, lead follow-up.
5. Case drafts: draft-only, approval required.
6. Missing data checklist.
7. Next founder step.
