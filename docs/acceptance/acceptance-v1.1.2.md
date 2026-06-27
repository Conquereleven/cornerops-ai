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

- Connector mode: `mock`
- Project discovery: `missing_config`
- Repo candidate: missing until `CORNERMEX_LOVABLE_GITHUB_REPO` is set
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
- `demo:cornermex-lovable-real-config`: OK without credentials, writes blocked
- `demo:v1.1.2`: OK without credentials, Telegram v1.2 not started
- `founder:daily`: OK, reports `cornerMexConfigIntakeStatus=missing_config` and next action
- `git diff --check`: OK
- Secret scan: no real tokens found

## Missing founder config

- Lovable project URL or name
- Lovable-connected GitHub repo
- Deployment URL
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
