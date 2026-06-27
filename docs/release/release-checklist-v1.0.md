# Release Checklist v1.0

- [ ] PR #22 v0.9 is merged into main.
- [ ] `npm run founder:setup-check` passes or has only understood warnings.
- [ ] `npm run qa` passes.
- [ ] `npm run founder:daily` runs without credentials.
- [ ] `npm run demo:v1.0` runs without credentials.
- [ ] `npm run state:backup` creates a local sanitized backup.
- [ ] `npm run state:export-summary` does not print secrets.
- [ ] Control Tower shows Founder Beta Readiness.
- [ ] GitHub real issue creation is disabled.
- [ ] External sends and production writes are blocked.
- [ ] No secrets are committed.

Tag instruction, when ready:

```bash
git tag v1.0.0-founder-beta
git push origin v1.0.0-founder-beta
```

Do not create the tag automatically during implementation.
