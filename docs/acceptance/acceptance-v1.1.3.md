# Acceptance v1.1.3

Branch: `feature/cornermex-supabase-read-only-v1.1.3`

## PR Gate

- PR #26 merged: yes.
- Merge commit: `89a125953a37814c09630954a8910471e963fc31`
- v1.1.2 included in main: yes.

## Commands

```bash
npm run cornermex:lovable-config-check
npm run demo:lovable-discovery
npm run demo:cornermex-connector
npm run demo:v1.1.1
npm run founder:daily
npm run cornermex:supabase-read-only-check
npm run demo:cornermex-schema-discovery
npm run demo:cornermex-supabase-read-only
npm run demo:v1.1.3
npm test
npm run lint
npm run typecheck
npm run test:frontend
npm run build
```

## Current Mode

- Without live Supabase credentials: `schema_discovered`
- With safe Supabase URL + anon/read-only key: candidate `real_read_only`
- With unsafe write flags or service-role-like key: `blocked_unsafe_config`

## Schema Discovery Result

- Tables/contracts discovered from repo evidence:
  - products/products variants/categories
  - b2b leads/lead notes/status history
  - orders/order items/order events/order notes
  - profiles/addresses
  - payment fields on orders
- Contract confidence: medium from migration/schema evidence.
- Supabase readiness: pending credentials.

## Validation Results

- Syntax: 444 JavaScript files OK.
- Backend Jest: 87 suites / 397 tests OK.
- Frontend TypeScript: OK.
- Frontend Vitest: 4 files / 7 tests OK.
- Frontend build: OK.
- `cornermex:supabase-read-only-check`: OK with non-secret Lovable repo config, mode `schema_discovered`.
- `demo:cornermex-schema-discovery`: OK without Supabase credentials.
- `demo:cornermex-supabase-read-only`: OK without Supabase credentials.
- `demo:v1.1.3`: OK without Supabase credentials, Telegram v1.2 not started.
- `git diff --check`: OK.

## Missing Founder Config

- `CORNERMEX_SUPABASE_URL`
- `CORNERMEX_SUPABASE_ANON_KEY`
- RLS verification for anon/read-only access

## Remains Disabled

Production writes, Lovable mutations, Supabase writes, GitHub writes, WhatsApp/customer sends, external emails, native tools, ClawHub execution and Telegram v1.2.
