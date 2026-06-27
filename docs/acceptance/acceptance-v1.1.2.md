# Acceptance v1.1.2

Branch: `feature/cornermex-lovable-real-config-v1.1.2`

## Required commands

```bash
npm run lint
npm test
npm run typecheck
npm run test:frontend
npm run build
npm run cornermex:lovable-config-check
npm run demo:cornermex-lovable-real-config
npm run demo:v1.1.2
npm run founder:daily
```

## Expected current mode

- Connector mode without local env: `mock`
- Project discovery without local env: `missing_config`
- Repo candidate with provided founder config: `repo_discovered`
- Supabase candidate: missing until URL + anon/read-only key are set
- Data contract confidence: low in mock, medium in repo_discovered, high in real_read_only

## Results from this branch

- Main after PR #25 merge: `74e619e30c54658333946deb9560d4f68d956120`
- Main CI after PR #25: success
- Syntax: 435 JavaScript files OK
- Backend Jest: 86 suites / 388 tests OK
- Frontend TypeScript: OK
- Frontend Vitest: 4 files / 7 tests OK
- Frontend build: OK
- `cornermex:lovable-config-check`: OK without credentials, status `missing_config`
- `cornermex:lovable-config-check` with provided Lovable URL/repo: OK, status `missing_config`, repo candidate `repo_discovered`
- `demo:cornermex-lovable-real-config`: OK without credentials, writes blocked
- `demo:v1.1.2`: OK without credentials, Telegram v1.2 not started
- `founder:daily`: OK, reports `cornerMexConfigIntakeStatus=missing_config` and next action
- `git diff --check`: OK
- Secret scan: no real tokens found

## Missing founder config

- Supabase project URL
- Supabase anon/read-only key
- Optional table names/schema confirmation

## Provided non-secret CornerMex config

- Lovable project URL: `https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96`
- Lovable project name: `CornerMex`
- Lovable-connected GitHub repo: `Conquereleven/corner-mex-uae`
- Deployment URL candidate: `https://corner-mex-uae.lovable.app`
- Repo discovery result: TanStack Start/Vite/React/Lovable app with Supabase client, admin routes, B2B routes, order/payment/catalog functions and Supabase migrations.

## Still missing founder config

- Supabase URL
- Supabase anon/read-only key

## Remains disabled

Production writes, Lovable mutations, Supabase writes, GitHub writes, WhatsApp/customer sends, external emails, native tools, ClawHub execution and Telegram v1.2.

## Founder commands

```bash
npm run cornermex:lovable-config-check
npm run demo:cornermex-lovable-real-config
npm run demo:v1.1.2
```
