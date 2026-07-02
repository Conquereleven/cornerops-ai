# Paste-Ready Lovable Prompt: CornerOps Control Tower v1.3

Build a new internal Lovable app named `CornerOps Control Tower`.

This is a separate Lovable project from the CornerMex marketplace. CornerOps backend is the brain and source of truth. This Lovable app is only the visual cockpit.

Use mock data first from these backend-provided sample shapes:

- `control-tower-status.sample.json`
- `founder-daily.sample.json`
- `cornermex-status.sample.json`
- `flows.sample.json`
- `approvals.sample.json`
- `audit.sample.json`
- `security.sample.json`
- `telegram.sample.json`
- `drafts.sample.json`

Do not store secrets. Do not add token fields for Telegram, Supabase, GitHub or service role keys. Do not use Supabase service role. Do not call WhatsApp send APIs. Do not call email send APIs. Do not mutate production data. Do not build direct mutation paths for orders, payments, leads, quotes, products or customers.

Every backend-shaped response includes:

- `status`
- `sourceMode`
- `readOnly`
- `dryRun`
- `writesBlocked`
- `externalSendsBlocked`
- `approvalRequired`
- `auditId`
- `warnings`
- `data`

Show these fields visibly where useful, especially source mode, audit ID, writes blocked, external sends blocked and approval required.

## Phase 1: Layout And Mock Data
Create a dark-mode internal dashboard shell with sidebar navigation:

- Dashboard
- CornerMex Ops
- Flow Engine
- Drafts
- Approvals
- Audit Log
- Security
- Telegram
- Settings

Load mock data locally. Add a Settings toggle for mock mode, but do not ask users for secrets.

## Phase 2: Components
Build reusable components:

- Status pill
- Source mode badge
- Safety rail card
- Audit ID chip
- Warning list
- Approval-gated action button
- Disabled send button with reason
- Empty state for missing Supabase real read-only config
- Compact data table
- Flow summary card

Use a premium internal operating system style: clean cards, high contrast status pills, Linear/Stripe clarity, fast scanning. No noisy gradients or gimmicks.

## Phase 3: API Adapter Placeholders
Create an API adapter module with placeholders for:

- `GET /api/control-tower/frontend/v1/status`
- `GET /api/control-tower/frontend/v1/founder-daily`
- `GET /api/control-tower/frontend/v1/cornermex`
- `GET /api/control-tower/frontend/v1/flows`
- `GET /api/control-tower/frontend/v1/approvals`
- `GET /api/control-tower/frontend/v1/audit`
- `GET /api/control-tower/frontend/v1/security`
- `GET /api/control-tower/frontend/v1/telegram`
- `GET /api/control-tower/frontend/v1/drafts`
- `GET /api/control-tower/frontend/v1/actions`

Keep mock data as the default. The API base URL should be configurable later by deployment environment.

## Phase 4: Polish
Make the UI responsive. Ensure long text is summarized. Show disabled states for WhatsApp/email sends and production writes. Show approval-gated UI for risky operations. Include empty states for Supabase pending credentials and Telegram missing config.

Preserve structure and avoid unnecessary refactors. Build incrementally and keep the app maintainable.
