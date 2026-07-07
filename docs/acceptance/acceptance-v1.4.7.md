# Acceptance v1.4.7

Sprint: Validate Supabase Read-Only Views and Activate Railway

Branch: `feature/cornermex-supabase-readonly-v1.4`

PR: `#37 feat: activate CornerMex Supabase read-only source v1.4`

## Result

Final status: `blocked_by_wrong_supabase_key`

## Supabase Project

Active project for this validation:

- project name: `cornerops-ai`
- project ref: `nhxpujypqxbjiqqddxqt`
- URL: `https://nhxpujypqxbjiqqddxqt.supabase.co`

The previous `corner-mex-uae` project is not the active read source for CornerOps because it did not expose the operational public schema.

## Views Verified

Safe metadata-only validation confirmed all required read-only views exist in the `public` schema:

- `cornerops_products_v`
- `cornerops_orders_v`
- `cornerops_customers_v`
- `cornerops_b2b_leads_v`
- `cornerops_payments_v`
- `cornerops_fulfillment_v`

No customer rows, raw PII, keys, tokens, or service-role secrets were read or printed.

## Local Validation

Command executed with local secret file and in-memory table map:

```bash
npm run cornermex:supabase-readonly-check
```

Result:

- `mode`: `blocked_by_supabase_read_failure`
- `sourceMode`: `schema_discovered`
- `supabaseStatus`: `error_sanitized`
- `readModelStatus`: `unavailable`
- `readFailureReason`: `invalid_anon_key`
- `writesBlocked`: true
- `externalSendsBlocked`: true
- `maskingApplied`: true
- `anonKeyPrinted`: false
- `serviceRoleKeySuspected`: false

The local secret file contains a Supabase key value, but Supabase rejected it for the selected project with `Invalid API key`.

## Railway Activation

Status: not attempted

Reason: local validation did not reach `real_read_only` or `real_read_only_partial`.

Railway variables were not changed.

Railway was not redeployed.

## Lovable Verification

Status: not attempted

Reason: Railway was not configured or redeployed.

## Founder Action Required

Replace the local key in `~/.cornerops-secrets/supabase.env` with the active publishable/anon key for project `nhxpujypqxbjiqqddxqt`.

Required local values:

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=https://nhxpujypqxbjiqqddxqt.supabase.co
CORNERMEX_SUPABASE_ANON_KEY=<active publishable or anon key for nhxpujypqxbjiqqddxqt>
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true
CORNERMEX_SUPABASE_PII_MASKING=true
CORNERMEX_SUPABASE_TABLE_MAP_JSON={"products":"cornerops_products_v","b2bLeads":"cornerops_b2b_leads_v","orders":"cornerops_orders_v","customers":"cornerops_customers_v","payments":"cornerops_payments_v","fulfillment":"cornerops_fulfillment_v"}
```

Do not commit `.env` files.

Do not paste the key into GitHub, docs, PR comments, screenshots, or chat transcripts.

## Post-Key Validation

After replacing the local key, rerun:

```bash
npm run cornermex:supabase-readonly-check
```

Proceed to Railway only if the result is:

- `real_read_only`
- or `real_read_only_partial`

## Safety

- Supabase writes: blocked
- Lovable mutations: blocked
- GitHub writes: blocked
- WhatsApp sends: blocked
- external emails: blocked
- customer channels: blocked
- OpenClaw: disabled
- service-role key: not used
- secrets committed: no
- key printed: no
- Railway vars changed: no
- Railway redeploy: no

## Final Status

`blocked_by_wrong_supabase_key`
