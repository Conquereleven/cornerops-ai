# Acceptance v1.4.2

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

Retry objective: validate the updated local CornerMex Supabase URL/key, configure Railway only after a successful local read-only select, and verify Railway/Lovable source mode.

## Result

Final status: `blocked_by_supabase_read_failure`

Read failure reason: `missing_tables`

No Railway variables were changed because the local read-only check did not produce any successful Supabase `select`.

## Railway Linked Service

Railway CLI local session works when the stale `RAILWAY_TOKEN` environment variable is ignored.

- Workspace: founder workspace
- Project: `CornerOps AI`
- Environment: `production`
- Linked service: `cornerops-ai`
- Service status: online
- Service URL: `https://cornerops-ai-production.up.railway.app`

Important note:

- A stale/invalid `RAILWAY_TOKEN` in the shell causes Railway commands to fail.
- Running Railway through the local CLI session with `RAILWAY_TOKEN` unset succeeds.
- No Railway secret values were printed.

## Supabase Local Secret Check

Sanitized `~/.cornerops-secrets/supabase.env` inspection:

- `CORNERMEX_SUPABASE_URL`: present
- `CORNERMEX_SUPABASE_ANON_KEY`: present
- URL shape: full URL
- key shape: publishable key
- service-role-like key: no
- secret values printed: no

The local URL points to the Supabase project named `corner-mex-uae`, not the earlier `cornerops-ai` project.

This is directionally correct for CornerMex, but the selected project currently has no public tables available.

## Supabase Project Evidence

Supabase MCP project discovery shows:

- `cornerops-ai`: `ACTIVE_HEALTHY`
- `corner-mex-uae`: `ACTIVE_HEALTHY`

Safe table inspection for the selected `corner-mex-uae` project:

- schema: `public`
- tables found: none

No row payloads or raw PII were queried or printed.

## Local Read-Only Check

Command:

```bash
npm run cornermex:supabase-readonly-check
```

Run with local Supabase secrets sourced in-memory and safe read-only flags supplied:

- `CORNERMEX_SUPABASE_ENABLED=true`
- `CORNERMEX_SUPABASE_READ_ONLY=true`
- `CORNERMEX_SUPABASE_ALLOW_WRITES=false`
- `CORNERMEX_SUPABASE_BLOCK_MUTATIONS=true`
- `CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true`
- `CORNERMEX_SUPABASE_MASK_PII=true`
- `CORNERMEX_SUPABASE_FAIL_CLOSED=true`
- `CORNERMEX_SUPABASE_MAX_ROWS=50`
- `CORNERMEX_SUPABASE_REQUEST_TIMEOUT_MS=8000`

Result:

- mode: `blocked_by_supabase_read_failure`
- sourceMode: `schema_discovered`
- connectorMode: `repo_discovered`
- supabaseStatus: `error_sanitized`
- readFailureReason: `missing_tables`
- writesBlocked: true
- externalSendsBlocked: true
- maskingApplied: true
- credentials present: yes
- credentials printed: no
- unsafe flags: none

Table availability:

- products: `missing_table`
- leads: `missing_table`
- quotes: `missing_table`
- orders: `missing_table`
- customers: `missing_table`
- payments: `missing_table`
- fulfillment: `missing_table`

Interpretation:

- The new key is no longer blocked as an invalid anon key.
- The selected Supabase project does not currently expose the expected CornerMex tables to the read-only REST path.
- Because no table select succeeded, this cannot be promoted to `real_read_only` or `real_read_only_partial`.

## Railway Variables

Railway variables configured: no

Reason:

- The activation gate requires at least one successful local Supabase read-only select.
- Current result is `missing_tables` for all mapped entities.

No Railway variables, Supabase keys, operator tokens, or production secrets were printed.

## Redeploy

Redeploy performed: no

Reason:

- No Railway variables were changed.
- Redeploying would not move the live service to `real_read_only`.

## Lovable Verification

Lovable verification performed: blocked before refresh

Expected current state remains:

- backend reachable
- source mode not promoted to real read-only
- writes blocked
- external sends blocked
- dangerous action buttons disabled

## Safety Status

- Supabase writes: blocked
- Lovable mutations: blocked
- GitHub writes: blocked
- WhatsApp sends: blocked
- external emails: blocked
- customer channels: blocked
- OpenClaw: not enabled
- `.env`: not committed
- service role: not used

## Next Required Step

Choose one safe path:

1. Apply the existing CornerMex/Lovable migrations to the `corner-mex-uae` Supabase project outside this read-only activation workflow, then rerun:

   ```bash
   npm run cornermex:supabase-readonly-check
   ```

2. Or update `~/.cornerops-secrets/supabase.env` to point to a CornerMex Supabase project that already exposes the required read-only tables with a publishable/anon key.

Only after at least one entity returns `available`, `available_empty`, or `available_masked` should Railway variables be configured and the production service redeployed.
