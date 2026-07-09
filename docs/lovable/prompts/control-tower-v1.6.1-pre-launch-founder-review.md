# CornerOps Control Tower v1.6.1 - Pre-Launch Founder Review Mode

Update the existing CornerOps Control Tower dashboard. Do not create a new Lovable project and do not duplicate backend logic.

## Source Of Truth

CornerOps backend remains the brain. Lovable is only the visual cockpit.

Primary endpoint:

```txt
GET /api/intelligence/founder-review
```

Use the existing backend API adapter and operator token flow. Do not store secrets in Lovable source code.

## Business Context

CornerMex is pre-launch.

- Operating stage: `pre_launch`
- Launch date: `2026-08-17`
- Missing live orders, live payments, fulfillment, and customers may be expected before launch.
- Products/catalog are the primary pre-launch asset.

## Display Requirements

Show a Founder Review section optimized for launch readiness:

- Pre-launch mode badge
- Launch countdown
- Launch readiness score and status
- Catalog readiness
- Inventory readiness
- Payment test readiness
- Fulfillment rehearsal readiness
- Compliance readiness
- B2B/marketing readiness
- Top launch risks
- Founder launch actions
- Missing launch data
- Safety posture

## Required Fields

Render these fields when present:

- `operatingStage`
- `launchDate`
- `daysToLaunch`
- `launchReadinessStatus`
- `launchReadinessScore`
- `catalogReadiness`
- `inventoryReadiness`
- `paymentReadiness`
- `fulfillmentReadiness`
- `complianceReadiness`
- `b2bReadiness`
- `marketingReadiness`
- `launchRisks`
- `launchActions`
- `missingData`
- `nextFounderStep`

## UX Rules

- Label every data section with `sourceMode`.
- Show read-only and writes-blocked status.
- Show missing live orders/payments as expected pre-launch gaps, not production failures.
- Disable all send/write buttons.
- Treat launch actions as review-only checklist items.
- Keep the existing dark Control Tower style.

## Do Not

- Do not enable writes.
- Do not enable Supabase runtime writes.
- Do not send WhatsApp or email.
- Do not enable customer channels.
- Do not enable OpenClaw execution.
- Do not expose raw PII or secrets.
- Do not modify the CornerMex marketplace project.
