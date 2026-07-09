# Acceptance v1.6.1 - Pre-Launch Founder Review Mode

## Why This Exists

CornerMex has not launched yet. The target launch date is `2026-08-17`, so missing live orders, payments, fulfillment, and customers should not be treated as production failures.

v1.6.1 adds an explicit `pre_launch` operating stage so Founder Review focuses on launch readiness.

## Configuration

```env
CORNERMEX_OPERATING_STAGE=pre_launch
CORNERMEX_LAUNCH_DATE=2026-08-17
```

Supported stages:

- `pre_launch`
- `soft_launch`
- `live`
- `paused`

If `CORNERMEX_OPERATING_STAGE` is not configured, Founder Review keeps v1.6 live-operations behavior.

## How Founder Review Changes

In `pre_launch` mode, Founder Review prioritizes:

- catalog readiness
- product data quality
- inventory readiness
- pricing/margin completeness when fields are available
- SEO/content readiness when fields are available
- compliance readiness
- payment test readiness
- fulfillment rehearsal readiness
- B2B lead readiness
- marketing readiness
- launch countdown
- founder launch actions

## Data Still Needed

The strongest launch review needs:

- readable products
- stock/inventory fields
- price/margin fields
- image and description fields
- SEO metadata fields
- supplier/source fields
- compliance status fields
- B2B launch lead list
- internal payment test evidence
- internal fulfillment rehearsal evidence

Unavailable fields are reported as unknown/pending rather than invented.

## Intentionally Not Treated As Live Production Failure

Before launch, these can be expected gaps:

- no live customer rows
- no live order rows
- no live payment rows
- no live fulfillment rows

They are launch rehearsal/readiness warnings, not production incident signals.

## Safety Posture

- Runtime reads only.
- Supabase writes blocked.
- WhatsApp sends blocked.
- Email sends blocked.
- Customer channels disabled.
- OpenClaw execution disabled.
- PII remains sanitized.
- Launch actions are review-only.

## Artifacts

- Config: `CORNERMEX_OPERATING_STAGE`, `CORNERMEX_LAUNCH_DATE`
- Service: `src/core/intelligence/FounderReviewService.js`
- Endpoint: `GET /api/intelligence/founder-review`
- Script: `npm run founder:review`
- Lovable prompt: `docs/lovable/prompts/control-tower-v1.6.1-pre-launch-founder-review.md`
- Tests: `tests/founderReviewV161.test.js`

## Validation

Planned commands:

```bash
npm run cornermex:supabase-readonly-check
CORNERMEX_OPERATING_STAGE=pre_launch CORNERMEX_LAUNCH_DATE=2026-08-17 npm run founder:review
npm run lint
npm run typecheck
npm test -- tests/founderReviewV161.test.js
git diff --check
```

## Founder Next Action

Run:

```bash
CORNERMEX_OPERATING_STAGE=pre_launch CORNERMEX_LAUNCH_DATE=2026-08-17 npm run founder:review
```

Then review:

- launch readiness score
- catalog readiness
- launch risks
- launch actions
- missing launch data
- next founder step
