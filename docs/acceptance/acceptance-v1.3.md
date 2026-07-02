# Acceptance v1.3

Branch: `feature/lovable-control-tower-pack-v1.3`

## Scope
v1.3 prepares a Lovable frontend pack for `CornerOps Control Tower`. It does not build a separate React app in this repo and does not enable OpenClaw, WhatsApp sends, email sends, customer channels or production writes.

## Commands
- `npm run demo:control-tower-frontend-contract`
- `npm test -- controlTowerFrontendContractV13.test.js`

## Expected State
- Telegram founder polling remains available locally.
- CornerMex source mode is labeled as `repo_discovered` unless Supabase read-only credentials are configured.
- Supabase real read-only remains pending URL and anon key.
- WhatsApp/email drafts are local only and not sendable.
- All risky actions require approval.

## Founder Next Step
Create a new Lovable project named `CornerOps Control Tower` and paste the prompt at `docs/lovable/lovable-prompt-cornerops-control-tower-v1.3.md`.
