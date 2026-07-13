# Acceptance v1.15

## Baseline

- Starting main: `2fb83c8`
- Branch: `feature/unified-command-center-v1.15`
- Canonical frontend: repository React application
- Production: Railway
- Lovable: archived visual reference; zero calls, probes, prompts or credits
- Migration: `migration_not_required_existing_schema_sufficient`

## Implementation Gates

- 35 unique typed modules across seven groups
- canonical and legacy routes generated from one registry
- production fixture imports removed from operational hooks
- simulated chat/order/operator records removed
- failure states return unavailable rather than fake rows or zeroes
- Control Tower capabilities promoted to first-class routes
- Marketing foundation consumes existing internal read contracts only
- capability visibility is non-executing and fail-closed

## Production Evidence

- Implementation PR: `#72`, merged with both GitHub CI checks passing
- Main merge commit: `3fc97b5`
- Railway service: `cornerops-ai`, production, online
- Post-restart deployment: `9823c1db-ac50-4138-99c3-0b6e35d64714`
- Feature flags: unified command center, live Overview, Marketing foundation and Capability Status enabled
- Public routing: all 35 canonical routes returned HTTP 200
- API behavior: `/api/health` returned HTTP 200; an unknown API route returned JSON HTTP 404
- Protected frontend bridge: status, CornerMex, flows, approvals, audit, security, Telegram, drafts and actions returned HTTP 200 with operator authentication
- Safety envelope: `writesBlocked=true` and `externalSendsBlocked=true` on every protected response
- Source labeling: CornerMex endpoints reported `real_read_only`; internal governance endpoints reported `local_internal`
- Browser QA: Overview, Control Tower, Marketing Hub, Work Queue, Capability Status and Seller Catalog rendered with canonical navigation and no console errors
- Restart verification: authenticated status, CornerMex, flows, approvals, audit and actions remained available after one Railway restart
- CornerMex regression: read model remained `real_read_only`, PII masking enabled, writes blocked, 9 operational CornerMex product rows readable
- Semantic boundary: the 190-item verified supplier catalog is not presented as CornerMex operational products or physical stock
- Known warning: the optional `public.profiles` customer source is unavailable; the UI reports unavailable and does not substitute zero or mock records
- Migration: `migration_not_required_existing_schema_sufficient`
- Lovable: no calls, probes, prompts or credits used

## Final Validation

- Syntax: 595 JavaScript files
- Frontend: 8 files / 15 tests
- Backend: 123 suites / 623 tests
- TypeScript: passed
- Production build: passed
- Git diff check: passed
- Secret scan: no committed credentials

Final status: `cornerops_v1_15_live_unified_command_center`
