# Dependency-aware implementation roadmap
Status: Sprint00 technical delivery accepted subject to these coordination amendments. Planning only; PR96 stays Draft. Sprint01 must await Claude Code’s independent Sprint00 findings, reconciliation, and explicit Founder authorization.

## Dual-Agent Engineering Model
Codex is Engineering Lead and Integration DRI. Claude Code is Product Experience Lead and an active engineering contributor, owning scoped public experience implementation as well as design. Founder retains product/claims/release decisions; CTO Eric reviews high-impact architecture when available. See [CODEX_CLAUDE_HANDOFF_CONTRACT.md](CODEX_CLAUDE_HANDOFF_CONTRACT.md) for exact file ownership, separate worktrees, handoff records, cross-review and integration gates. No agent may modify a shared file in parallel without a documented, mutually reviewed contract and a single designated writer.

## Founder direction and Website 2.1 sequencing
Record the proposed Founder direction as the planning baseline: CornerTech Commerce is flagship, IN DEVELOPMENT; Custom Engineering, AI Automation and Systems Integration are available capabilities. Preserve Geist, existing brand mark and navy/cobalt identity. Initial routes are Home, Commerce and Solutions. Company/Contact remain homepage sections; standalone Tres Leches case is permission-gated and outside initial scope.

Retain React/Vite. Prerender spike is authorized for planning only: document options/contracts, no spike code, dependency edits or generated page implementation now. Protected server changes are NOT authorized. Sprints02–03 showcase the product with truthful maturity labels and synthetic examples. Sprint05 plans commercial integration only. Authenticated product access requires independent security and product readiness approval; never expose private CornerOps APIs or Tres Leches production data.

Re-estimate: 12–19 working days including Sprint00; 11–17 remaining after this planning delivery, assuming timely review and existing stack. This expands the original estimate for route/404 and evidence gates. Allow 1–2 additional days if a prerender/build exception is needed; external permission/domain waits are unbounded and excluded. No schedule is a launch promise. This prior estimate covers S00–04 only; S05 planning is provisionally 1–2 working days after its separate authorization. Dual-agent allocation is not a promised schedule reduction.

| Ticket | Deliverable / acceptance | Dependency | Owner / gate |
|---|---|---|---|
| V2-001 | Fresh main/PR/deployment/public route inventory and acceptance limits | Read-only access | Codex; delivered BASELINE_AUDIT |
| V2-002 | Dependency graph, fresh protected file comparison, security tests | 001 | Codex; delivered ADR + evidence |
| V2-003 | Isolated branch, exact boundaries, local preview/release plan | 002 | Codex; delivered; coordination cross-review pending |
| V2-004 | Claims ledger with maturity/evidence/permissions | 001 | Codex; delivered; Founder evidence signoff pending |
| V2-005 | SPA/static SEO/404 ADR with protected exceptions explicit | 002 | Codex; planning-only direction recorded; implementation gate remains |
| V2-006 | PRD, IA, dependency backlog and risks | 003–005 | Codex; delivered planning artifacts |
| V2-101 | Brand manifesto and company/product/service roles | S00 approval | Claude Code; Codex cross-review/integration; Founder positioning gate |
| V2-102 | Audience/jobs/objections and evidence needs | 101 | Claude Code; Codex cross-review/integration; Founder commercial review |
| V2-103 | Homepage narrative hierarchy and dual CTA model | 102 + ledger | Claude Code; Codex cross-review/integration; no final claims without evidence |
| V2-104 | Approve per-capability maturity and prohibited claims policy | 004 + Founder product evidence | Founder with Claude Code; Codex verifies evidence; blocks factual copy |
| V2-105 | Tokens/type/grid/motion/focus + 390/768/1440 specs | 101 | Claude Code; Codex cross-review/integration; Founder visual approval, contrast checks |
| V2-106 | English route copy and initial metadata drafts, signed claim matrix | 103–105 + route scope | Claude Code; Codex cross-review/integration; Founder Sprint01 signoff |
| V2-201 | Public section refactor with unchanged protected code | S01 approval | Codex; component/import tests |
| V2-202 | Commerce-led hero with labelled synthetic product composition | 201 + 105/106 | Claude Code; Codex cross-review/integration; no private imports or data |
| V2-203 | Commerce preview + live-target CTA only | 202; 301 if linked route | Claude Code; Codex cross-review/integration; no dead navigation; use approved enquiry link until route exists |
| V2-204 | Operations/service/trust and permitted case summary | 104 + case permission | Claude Code; Codex cross-review/integration; omit case if not cleared |
| V2-205 | Two external conversion paths without lead collection | 106 | Claude Code; Codex cross-review/integration; contact-link and privacy review |
| V2-206 | Six-width responsive, keyboard/menu/reduced-motion QA | 201–205 | Claude Code; Codex cross-review/integration; Founder Sprint02 UX approval |
| V2-301 | Commerce page with evidence-linked capability states | S02 architecture stable + 104 | Claude Code; Codex cross-review/integration; Founder facts review |
| V2-302 | Solutions page with all three commercial capabilities | 106 | Claude Code; Codex cross-review/integration; truthful engagement scope |
| V2-303 | Tres Leches case and synthetic assets | Explicit client/brand/content permission | Deferred from initial scope; Founder permission gate, Claude Code implements, Codex reviews only after approval |
| V2-304 | Company homepage section and optional research context | Company facts + 106 | Claude Code; Codex reviews; standalone route deferred |
| V2-305 | Contact homepage section/two intentions using approved links | 205 | Claude Code; Codex reviews; no standalone route or forms |
| V2-306A | Planning-only prerender spike specification, manifest and metadata contract | Planning authorized; execution/build edits require later approval | Codex drafts; Claude Code reviews rendering needs; no dependency edits authorized |
| V2-306B | Route output, sitemap/robots, slash policy and real HTTP404 | 306A + explicit protected static-serving exception | BLOCKED: protected server changes NOT authorized; Codex only after separate approval and independent security review |
| V2-306C | Refresh/direct GET/hydration/links/metadata/API fallback tests | 301–306B | Codex; Founder Sprint03 content/conversion signoff |
| V2-401 | Full backend/frontend/security suites, syntax/typecheck/build + protected diff | S03 accepted | Codex; exact-SHA CI must pass |
| V2-402 | Chromium/WebKit keyboard/focus/reduced motion/manual accessibility | 401 candidate | Claude Code; Codex cross-review/integration; WCAG target, documented exceptions |
| V2-403 | Reproducible lab performance/bundle budgets | 401 | Codex; field p75 remains pending without field data |
| V2-404 | Canonical/robots/sitemap/404/cache/preview isolation audit | 306C + V1 domain acceptance | Codex; domain unresolved blocks canonical release claim |
| V2-405 | Bundle/secrets/privacy/header/API/log regression review | 401 | Codex; no unrelated backend expansion |
| V2-406 | Exact SHA evidence, rollback artifact, release checklist | 401–405; severe risks resolved/accepted | Founder separate merge/auto-deploy, deploy and DNS authorizations |
| V2-407 | Five prospect comprehension checks if practical | Approved reviewable preview | Founder recruits with consent; Claude Code; Codex cross-review/integration records findings, not fabricated metrics |
| V2-501 | Commercial integration map: enquiry → qualification → product onboarding; label manual/proposed steps | S02–03 showcase reviewed; S04 findings; explicit S05 planning authorization | Codex architecture DRI; Claude Code journey contributor; Founder commercial gate |
| V2-502 | Product access readiness dossier: tenancy/auth/authorization, data boundaries, abuse controls, privacy, audit, support and product maturity evidence | 501; independent product and security reviewers assigned | Codex compiles technical gates; Claude Code access/error-state specification; no access implementation |
| V2-503 | Commercial handoff/CTA contracts and phased integration roadmap, evidence gaps and rollback requirements | 501–502 | Claude Code experience lead; Codex cross-review/integration; Founder signoff, no activation |

## Work allocation and integration gates
S01: Claude Code leads narrative, token proposal, public schema and experience specifications; Codex reviews feasibility/security/claims provenance and owns architecture/backlog. S02–03: Claude Code implements only assigned public components/styles/content; Codex owns route integration/config/SEO and boundary validation. S04: Claude Code leads interaction/accessibility evidence and reviews Codex integration; Codex owns CI/security/release evidence and reviews Claude changes. S05: joint planning contributions in disjoint documents; no public-to-private wiring.

Before any later sprint: record exact common base, source head, file list, interfaces, writer/reviewer and acceptance in the handoff contract. Use separate branches/worktrees and disjoint file assignments. Codex integrates reviewed commits into a dedicated integration worktree, verifies protected diff and runs tests on the combined SHA. Neither agent self-approves; disagreements stay blocked or go to Founder/CTO. Integration is branch-local, not merge-to-main authority.

Suggested PRs: S00 docs-only amendments; S01 strategy/specs; S02 showcase homepage; S03 Commerce/Solutions; S04 QA evidence; S05 commercial integration planning. Any server exception is separate, currently unauthorized. Each depends on accepted predecessor and fresh security comparison. No PR91/92 history. No merge, deploy or DNS action, including docs-only auto-deploy risk.

Sprint01 coordination gate: WAITING FOR CLAUDE CODE INDEPENDENT SPRINT00 FINDINGS. Codex must reconcile those findings against an exact SHA and publish dispositions before requesting final Sprint01 authorization. These amendments do not represent Claude acceptance, start either agent’s next sprint, or authorize authenticated access.
