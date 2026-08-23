# CO-WEB-1D real authentication

Status: `CODE_COMPLETE_CONFIGURATION_PENDING`.

The browser uses Supabase Auth with PKCE, persisted session restore and local
sign-out. Email magic links set `shouldCreateUser=false`; this UI cannot create
new operator identities. Google OAuth is hidden unless
`VITE_SUPABASE_GOOGLE_AUTH_ENABLED=true` is set after the provider is verified.

## Required public configuration

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_GOOGLE_AUTH_ENABLED=false` until Google is configured

Only a publishable browser key is permitted. Never use a secret key,
`service_role`, database password, JWT secret or OAuth client secret in a
`VITE_` variable.

Supabase Auth must allow each trusted `/auth/callback` URL for local, preview and
production origins. Google additionally requires an enabled Supabase provider
and provider credentials configured outside this repository. These dashboard
settings were not changed or assumed by CO-WEB-1D.

## Security boundary

Authentication proves identity only. Every restored or newly authenticated
session receives workspace state `pending` and is routed to `/access-pending`.
No workspace lookup, role mapping or operational access is implemented here;
that authorization contract remains CO-WEB-1F.

Private routes preserve a validated relative `next` path. Absolute URLs,
protocol-relative URLs and backslash-based redirect attempts fall back to
`/overview`, which is itself protected by the workspace gate.
