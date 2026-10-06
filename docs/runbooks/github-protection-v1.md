# GitHub protection recommendation v1

State observed on 2026-10-06 (read-only): `main` is **not protected**, the repository is **public**, CI has a single job named `test`.

**Nothing in this document has been applied.** Changing repository settings is a Founder gate.

## Recommended rule for `main`

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | on | `main` deploys; nothing should reach it unreviewed by CI |
| Required approvals | 0 | The Founder is the only maintainer; a required second reviewer would block every merge. Raise to 1 when a second maintainer exists. |
| Require status checks to pass | on | |
| Required check | `test` | The single CI job: secret scan, lint, typecheck, route-inventory check, security tests, backend tests with PostgreSQL, frontend tests, build |
| Require branches to be up to date | on | the route inventory and migrations are order-sensitive |
| Require conversation resolution | on | |
| Allow force pushes | off | |
| Allow deletions | off | |
| Require linear history | optional | squash merges already give this |
| Do not allow bypassing | on, once the workflow is proven | an admin bypass defeats the rule on a single-maintainer repository |

Also recommended:

- Enable secret scanning and push protection (free for public repositories).
- Enable Dependabot alerts.
- Restrict who can push tags matching `v*` if release tags start to drive deploys.

## Applying it (Founder action)

Settings → Branches → Add branch ruleset → target `main`, or:

```bash
gh api -X PUT repos/Conquereleven/cornerops-ai/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["test"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

Check that the required check name still matches the job name in `.github/workflows/ci.yml` before applying; a mismatched name blocks every merge.

## What this does not replace

Merging to `main`, production deployment and production migrations remain explicit Founder decisions regardless of branch rules.
