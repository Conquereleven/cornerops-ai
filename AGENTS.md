# CornerTech AI · Repository Agent Instructions

For every task in this repository, read and follow [Execution Standard 1.0](docs/governance/execution-standard.md). It is the single canonical source for outcome ownership, PREPARED → EXECUTED → VERIFIED → CLOSED, evidence, collaboration and BLOCKED criteria. Do not claim completion merely from a PR, passing CI, deploy or handoff.

- Record an accountable owner, measurable user/business outcome, target environment, acceptance checks, authorized scope and remaining approval gates in the existing task or PR. Execute approved work without repeated requests for the same approval; never expand its scope.
- Verify real behavior in the relevant environment. Distinguish synthetic/local/CI evidence from production acceptance. Record actual independent review only when performed.
- Preserve existing security, privacy, tenant boundaries, integrity tests, customer separation and human approvals. Sensitive sends, payments, customer data, credentials, infrastructure, merges with auto-deploy effects and deployments require their applicable specific authorization.
- Inspect existing scripts, APIs, prior commits and downstream consequences before implementing. Prefer reusable fixes over one-off patches, and avoid duplicate CI or overlapping agent edits.
- One accountable agent coordinates Codex/Claude path ownership, reviewed SHAs and findings; handoffs do not close work.
- Scope-specific instructions such as [frontend/AGENTS.md](frontend/AGENTS.md) and existing release/security contracts apply in addition to this file. The stricter applicable boundary wins.

This policy instruction does not authorize a merge, deployment, configuration change, external outreach or customer-system action.
