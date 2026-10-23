# CornerTech AI GitHub Actions efficiency · Draft review

October 23, 2026 baseline: `Conquereleven/cornerops-ai` main `4894c5b...`. This PR is independent of Website 2.0 Draft PR #96 and #98. It changes no application, production service, database, credentials, DNS or infrastructure.

## Proposed CI changes
- Avoid duplicate `push feature/**` and `pull_request` runs for the same proposed code. Preserve pull request checks and push checks for `main`/`develop`; no loss of the original test/build/security job.
- Skip only documentation-only diffs for auto-triggered CI. The existing job still runs for application, configuration, dependency and workflow changes. Manual `workflow_dispatch` remains available.
- Cancel obsolete in-progress jobs for the same branch/PR, while allowing unrelated PRs to run independently.
- Restrict GitHub Actions job token to `contents: read`.

## Production watch tradeoff (explicit founder approval before merge)
- Reduce the expensive full authenticated `Prod Watch` (health, work queue, Supabase read-only integration and dependency installation) from hourly to once every six hours at minute 17. Ad hoc `workflow_dispatch` remains available.
- This **reduces monitoring frequency**, not only billable minutes. Before approving merge, ensure Railway service alerts or another dedicated uptime checker meets the operational detection requirement; otherwise **do not merge the cron adjustment** and consider a split lightweight availability check outside GitHub Actions.
- No production endpoint, auth token, Supabase permissions or check semantics change.

## Acceptance and rollback
- Check CI trigger/skip matrix: feature pushes with open PR => PR event only; `main` push => CI; docs-only PR => skip; code PR => full test/build job; manual run => full job.
- Preserve expected required check rules in GitHub: no doc-only skip if `CI/test` is mandatory across all PRs unless required status check is adjusted first.
- Review race conditions and any active Website 2.0 branches; no changes to PR #98.
- All checks on this draft must be green before merge consideration. Git revert of the two workflow files restores prior behavior.

**DO NOT MERGE or deploy without a separate founder decision.**
