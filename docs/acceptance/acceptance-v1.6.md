# Acceptance v1.6 - Founder Review Loop

## Scope

v1.6 turns the v1.5 real operational intelligence layer into a founder review loop. It does not redesign the dashboard, enable writes, send messages, or change Supabase/Railway auth.

## What The Review Loop Does

- Builds a daily/manual founder review from read-only operational data.
- Reports source mode and data source clearly.
- Summarizes data quality and missing data.
- Lists urgent review-only actions.
- Surfaces anomaly candidates and case drafts.
- Highlights payment, fulfillment, inventory, and B2B lead follow-up signals.
- Recommends founder next steps without mutating CornerMex data.

## Data It Needs

The review is strongest when these read-only datasets are present:

- products
- B2B leads
- quotes
- orders
- customers
- payments
- fulfillment

When data is missing, the API returns a missing-data checklist instead of fake records.

## Safety Posture

- Runtime reads only.
- Supabase writes blocked.
- WhatsApp sends blocked.
- Email sends blocked.
- Customer channels disabled.
- OpenClaw execution disabled.
- Case drafts are review-only and approval-gated.
- PII is sanitized before output.

## Artifacts

- Service: `src/core/intelligence/FounderReviewService.js`
- Endpoint: `GET /api/intelligence/founder-review`
- Script: `npm run founder:review`
- Lovable prompt: `docs/lovable/prompts/control-tower-v1.6-founder-review-loop.md`
- Tests: `tests/founderReviewV16.test.js`

## Validation

Planned commands:

```bash
npm run lint
npm run typecheck
npm test -- tests/founderReviewV16.test.js
git diff --check
```

## What Is Still Partial

- Live quality depends on the manually imported CornerMex read-only data.
- Missing datasets remain visible in `missingData`.
- Review actions do not persist cases or execute operational changes in v1.6.

## Founder Manual Action

Run:

```bash
npm run founder:review
```

Then review:

- urgent actions
- missing data
- payment review signals
- fulfillment delays
- B2B follow-ups
- next founder step

## Next Step

After v1.6, the next sprint should connect Lovable display polish to the new founder review endpoint and decide whether approval-gated case persistence is needed.
