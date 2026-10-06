# CornerOps auth configuration and callback URLs v1

Sign-in uses Supabase Auth with PKCE. This runbook lists what must be configured outside the repository. **Nothing here has been applied by the sprint.** Each step is a Founder gate.

## Which Supabase project

Use the project that holds CornerOps identities. It may be the same project as the private `cornerops_internal` database or a separate one; the backend only needs its public URL and publishable key. Do not point CornerOps sign-in at the CornerMex storefront project unless that is a deliberate decision: every user in that project could then authenticate (they still could not enter without a membership).

## Configuration names

| Where | Name | Kind |
|---|---|---|
| Frontend build | `VITE_SUPABASE_URL` | public |
| Frontend build | `VITE_SUPABASE_PUBLISHABLE_KEY` | public (publishable key only) |
| Frontend build | `VITE_SUPABASE_GOOGLE_AUTH_ENABLED` | public flag, default `false` |
| Backend runtime | `CORNEROPS_AUTH_SUPABASE_URL` | public |
| Backend runtime | `CORNEROPS_AUTH_SUPABASE_PUBLISHABLE_KEY` | public (publishable key only) |
| Backend runtime | `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED`, `CORNEROPS_INTERNAL_DATABASE_URL` | existing; membership lookup needs them |
| Operator machine only | `CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL`, `CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT` | secret; never set on the web service |

`VITE_*` values are compiled into the bundle, so they must be set at **build** time. Never put a secret key, service-role key, JWT secret or database password in a `VITE_` variable. The backend does not use the service-role key for identity.

If the frontend values are missing, `/login` says sign-in is unavailable and `/app` stays closed. If the backend values are missing, every workspace API answers 503.

## Redirect allow-list (Supabase → Authentication → URL configuration)

Add each exact callback URL. Avoid wildcards outside local development.

| Environment | Callback URL |
|---|---|
| Local | `http://127.0.0.1:5173/auth/callback`, `http://localhost:5173/auth/callback` |
| Staging | `https://<staging-host>/auth/callback` |
| Production (current host) | `https://<current-production-host>/auth/callback` |
| Production (custom domain, after the Founder chooses it) | `https://<domain>/auth/callback` |

Set **Site URL** to the environment's own origin. No production domain is recorded here because none has been chosen.

The app only ever sends `…/auth/callback?next=<relative path>` on its own origin, and `next` is validated again on return, so a redirect to another site is not possible from the app side.

## Sign-in policy

- Email sign-in uses `shouldCreateUser: false`: the login page cannot create accounts. Create users in the Supabase dashboard (or by invite).
- Recommended: disable public sign-ups in Supabase Auth as well.
- Google stays hidden until the provider is configured in Supabase and `VITE_SUPABASE_GOOGLE_AUTH_ENABLED=true` is set at build time.
- Magic-link email is sent by Supabase. The default sender is rate-limited; a custom SMTP sender is a separate decision.

## First Founder membership

1. Create the Founder's user in Supabase Auth and copy its user id (UUID).
2. Apply the workspace migration to that environment (Founder gate for production).
3. From an operator machine with an administrative database URL:

```bash
export CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT=staging
export CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL=<admin connection string>
npm run workspace:grant -- --workspace cornerops-ai --user-id <uuid> --role founder --environment staging
# review the dry-run output, then repeat with --confirm
```

The command validates the ids and role, refuses when the environment flag and variable differ, writes an audit event, and prints no credentials. To remove access: same command with `--status disabled`.

The web runtime role has `SELECT` only on the membership tables, so a compromised web process cannot grant itself access.

## Verification

- Signed out: `/app` → `/login?next=/app`.
- Signed in without membership: `/access-pending`.
- Signed in with membership: `/app/overview`, sidebar shows `CornerOps AI`.
- `GET /api/app/session` without a token → 401.
