# CornerOps Control Tower Lovable Spec v1.3

## App
Name: `CornerOps Control Tower`

Purpose: internal founder cockpit for operating CornerMex through CornerOps AI.

CornerOps backend remains the brain, source of truth, policy layer, approvals layer and audit owner. This Lovable project is only the visual Control Tower UI. The existing CornerMex Lovable app remains the marketplace/storefront project.

## Data Model
Start with the JSON files in `docs/lovable/mock-data`. Later replace the mock loader with the CornerOps backend API under `/api/control-tower/frontend/v1`.

Every card must show:

- `sourceMode`
- read-only/dry-run state
- writes blocked
- external sends blocked
- approval required when true
- audit ID when present
- warnings when present

## Views
### Dashboard
- Founder daily summary
- Urgent actions
- Telegram polling status
- CornerMex source mode
- Writes blocked
- External sends blocked
- Audit status

### CornerMex Ops
- Leads
- Quotes
- Orders
- Payments
- Products
- Customer follow-up
- Fulfillment review
- Source labels on every section

### Flow Engine
- `b2b_lead_flow`
- `quote_follow_up_flow`
- `order_attention_flow`
- `manual_payment_review_flow`
- `product_quality_flow`
- `customer_follow_up_flow`
- `fulfillment_review_flow`

### Drafts
- WhatsApp drafts
- Email drafts
- Quote follow-up drafts
- Payment review drafts
- Always show `not_sendable_in_current_version`

### Approvals
- Pending approvals
- Approved
- Rejected
- Dry-run actions
- Controlled actions

### Audit Log
- Sanitized events only
- Filters by source, action, status and date
- Audit ID visible

### Security
- Writes blocked
- External sends blocked
- Secrets status
- High-risk capabilities disabled
- Telegram allowlist
- Supabase read-only status
- OpenClaw disabled/pending

### Telegram
- Polling status
- Founder chat allowlist status
- Last inbound
- Last reply
- Rejected attempts
- Rate limit status

### Settings
- Backend API base URL
- Mock mode toggle
- Read-only status
- Environment checklist
- No secret entry fields except local/private deployment instructions

## Design Direction
- Premium internal operating system
- Dark mode first
- Clean cards
- Linear/Stripe-style clarity
- High contrast status pills
- Founder cockpit feel
- No noisy gradients
- No gimmicks
- Fast to scan

## Safety Rules
- Never store secrets.
- Never use Supabase service role keys.
- Never call WhatsApp or email send APIs.
- Never mutate production.
- Never directly mutate CornerMex, Lovable, Supabase, GitHub, orders, payments, leads, quotes, products or customers.
- Approval-gated controls must render disabled until backend explicitly supports the action.
