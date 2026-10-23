# CornerTech AI · Execution Standard 1.0

**Canonical policy for execution and acceptance.** Applies to work in this repository after adoption; other repositories and client projects must adopt it explicitly. This document is not authorization for an unrelated change, external action, merge, deployment or production migration.

## Non-negotiable principle

**PREPARATION ≠ EXECUTION ≠ VERIFICATION ≠ COMPLETION.** Measure a task by the independently checkable user-facing or business-facing outcome, never by documents, tool calls, lines of code, PR status or agent handoffs alone.

## Delivery states

| State | Required evidence | What it does *not* prove |
| --- | --- | --- |
| **PREPARED** | Named accountable owner, authorized scope, target environment, measurable outcome, acceptance criteria and known approval/risk boundaries | Work has been implemented |
| **EXECUTED** | Exact implementation or operation, affected paths/resources and commit/run identifiers; any side effects recorded | Correct behavior in the target environment |
| **VERIFIED** | Actual target-environment checks against every material acceptance criterion; commands/URLs or private evidence references, results and timestamps; an independent review when required and available | Founder acceptance or permission for a new external effect |
| **CLOSED** | Verified outcome, required Founder/customer acceptance, documented residuals and follow-up owner; concise closure receipt | Unlimited approval for later tasks |
| **BLOCKED** | Reproducible error or denied capability, alternatives already attempted, impact, exact decision/access needed, next safe action and owner | A missing UI control or untested assumption is a platform limitation |

State transitions are monotonic only when supported by evidence. Reopen a state if later evidence invalidates it. An unmerged PR may be EXECUTED but not necessarily VERIFIED; a merged PR, successful CI run, completed deployment or accepted handoff is **never automatically CLOSED**. Never report an independent Claude/CTO review unless that reviewer actually completed it.

## Minimal task contract (keep this in the existing issue, task or PR)

- **Outcome / owner:** one accountable DRI and the measurable result.
- **Scope / approval:** exact resources permitted; separately gated actions.
- **Acceptance:** target environment, positive and negative tests, operational evidence and rollback where material.
- **Execution:** exact branch/SHA, action IDs and files/resources changed.
- **Disposition:** PREPARED / EXECUTED / VERIFIED / CLOSED / BLOCKED, remaining gaps and next owner.

Use the smallest report that supports the decision. Do not create a new planning artifact where a short PR description or acceptance note suffices.

## Autonomous execution within boundaries

1. Reuse existing repository evidence, tools, scripts, connectors and verified work before repeating research or CI. Discover supported APIs and backend capabilities before calling something unavailable; distinguish an unavailable UI from an unavailable provider capability.
2. Execute the authorized scope through implementation and verification without repeatedly asking for the same GO. Never expand that GO to an unrelated resource, a later release or a new financial/customer action.
3. Prefer root-cause fixes, shared contracts, regression protection and future-safe defaults over per-record patches. Inspect downstream consumers, deployment triggers, rollback and product/client boundaries before changing code.
4. Preserve existing least privilege, privacy, tenant isolation, dry-run, data quality, audited actions and negative security checks. Do not bypass controls to pass a test.
5. External communications require **message-specific approval**; payments, customer/production data, credentials, DNS, infrastructure, business records and sensitive writes retain their applicable approvals. A merge that auto-deploys is also a deployment decision. PR approval is not a production GO.
6. Use real target-environment checks after permitted deployment or action. Synthetic/local/mocked results are valuable but must be labeled and do not substitute for live acceptance.
7. On failure, isolate the smallest blocker, make safe progress on unaffected work and report what remains. Never claim SUCCESS from intent, simulated behavior, or another agent's assurance.

## Collaboration and accountability

One DRI owns end-to-end acceptance. When involving Codex, Claude Code, a reviewer or a customer operator, set path/resource ownership and precise handoff interfaces before concurrent edits. Exchange reviewed commits, evidence, open findings and next actions; avoid competing branches and conflicting writes. A delegated task remains with the original DRI until the receiving agent's real output has been checked. Independent review is recorded by reviewer, exact SHA and disposition; if unavailable, state that limitation and enforce whatever separate review/approval the risk requires.

## Existing policies remain in force

- [Permissions](../security/permissions.md) and [human approvals](../security/human-in-the-loop.md) constrain all automated actions.
- [Website Codex ↔ Claude handoff](../website-v2/CODEX_CLAUDE_HANDOFF_CONTRACT.md) provides task-specific ownership and review gates when applicable. Its historical sprint statuses are not current release authorization.
- Existing release checklists, security tests, integrity baselines, customer-specific permissions and branch/environment protections remain unchanged unless independently authorized.
- [Frontend agent instructions](../../frontend/AGENTS.md) add design-specific requirements and dated Founder decisions. Historical channel/contact choices are not authority to revert a newer explicitly approved public release.

**Conflict handling:** the more restrictive applicable security, product, client or Founder approval rule wins. This standard adds outcome accountability; it never weakens access controls or supersedes a project-specific release gate.

## Closure receipt (five lines, not another report)

1. **Outcome / owner / exact scope**
2. **State and target-environment proof** (timestamp + links or secured evidence IDs)
3. **Changed resources** (exact SHA, PR, affected systems)
4. **Approvals and security/rollback status**
5. **Known limitations, follow-up owner and next step** (or explicitly none)

A repository policy PR itself can be CLOSED only after its instructions are merged or otherwise made available to the intended agents, inheritance is checked in that environment and the applicable Founder acceptance is recorded. Passing CI on a Draft PR means the policy is **verified on the branch**, not adopted in production.
