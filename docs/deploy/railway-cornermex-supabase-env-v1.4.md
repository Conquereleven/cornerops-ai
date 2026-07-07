# Railway CornerMex Supabase Env v1.4

Use Railway only for non-secret-safe configuration entry. Do not paste keys into PRs, docs, screenshots, or Codex.

## Required Variables

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=<supabase project url>
CORNERMEX_SUPABASE_ANON_KEY=<anon or publishable key only>
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true
CORNERMEX_SUPABASE_MAX_ROWS=50
CORNERMEX_SUPABASE_REQUEST_TIMEOUT_MS=8000
CORNERMEX_SUPABASE_MASK_PII=true
CORNERMEX_SUPABASE_FAIL_CLOSED=true
```

Optional table mappings should be set only after confirming the actual CornerMex Supabase tables:

```env
CORNERMEX_SUPABASE_PRODUCTS_TABLE=products
CORNERMEX_SUPABASE_LEADS_TABLE=b2b_leads
CORNERMEX_SUPABASE_QUOTES_TABLE=b2b_leads
CORNERMEX_SUPABASE_ORDERS_TABLE=orders
CORNERMEX_SUPABASE_CUSTOMERS_TABLE=profiles
CORNERMEX_SUPABASE_PAYMENTS_TABLE=orders
CORNERMEX_SUPABASE_FULFILLMENT_TABLE=orders
```

## Verification

After Railway variables are saved and the backend redeploys:

```bash
npm run cornermex:supabase-readonly-check
npm run demo:v1.4
```

Expected success path:

- `sourceMode=real_read_only` when all mapped tables select successfully.
- `sourceMode=real_read_only_partial` when some mapped tables select successfully and others are missing/RLS-blocked/empty/time out.
- `sourceMode=repo_discovered` or `blocked_by_missing_supabase_readonly_config` if credentials are absent.
- `sourceMode=blocked_unsafe_config` if write flags or service-role-like credentials are detected.

## Safety

- Never use a service role key.
- Never enable `CORNERMEX_SUPABASE_ALLOW_WRITES`.
- Never run migrations from CornerOps.
- Never expose raw keys in logs.
- Keep WhatsApp, email, customer channels, GitHub writes, Lovable mutations, and OpenClaw disabled.
