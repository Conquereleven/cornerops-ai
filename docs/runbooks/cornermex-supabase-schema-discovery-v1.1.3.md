# CornerMex Supabase Schema Discovery Runbook v1.1.3

## How It Works

CornerOps reads Lovable-connected repo evidence only:

- `supabase/migrations`
- `src/integrations/supabase/types.ts`
- route/function names that indicate product, lead, order, customer and payment flows

It does not clone for mutation, execute migrations, connect to production DB, or call RPCs.

## Evidence Model

Each schema evidence object records:

- source file path
- table name
- columns and types
- nullable/required evidence
- primary key evidence
- foreign key evidence
- enum evidence
- RLS notes
- PII candidates
- related CornerMex contract
- confidence score
- warnings

## Confidence

- Mock only: low.
- Migration/schema evidence: medium.
- Live read-only Supabase schema: high.
- Unsafe config: blocked.
