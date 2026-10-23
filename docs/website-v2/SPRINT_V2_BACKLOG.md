# Dependency-aware implementation roadmap
Status: Sprint00 technical delivery accepted subject to these coordination amendments. Planning only; PR96 stays Draft. Claude independent findings received and reconciled; Sprint01 awaits explicit Founder authorization.

## Dual-Agent Engineering Model
Codex is Engineering Lead and Integration DRI. Claude Code is Product Experience Lead and an active engineering contributor, owning scoped public experience implementation as well as design. Founder retains product/claims/release decisions; CTO Eric reviews high-impact architecture when available. See [CODEX_CLAUDE_HANDOFF_CONTRACT.md](CODEX_CLAUDE_HANDOFF_CONTRACT.md) for exact file ownership, separate worktrees, handoff records, cross-review and integration gates. No agent may modify a shared file in parallel without a documented, mutually reviewed contract and a single designated writer. Contract v1.1 and CROSS_REVIEW_DISPOSITIONS.md resolve F05/F08/F09/F16; no new review loop unless material issues remain.

## Founder direction and Website 2.1 sequencing
Record the proposed Founder direction as the planning baseline: CornerTech Commerce is flagship, IN DEVELOPMENT; Custom Engineering, AI Automation and Systems Integration are available capabilities. Preserve Geist, existing brand mark and navy/cobalt identity. Initial routes are Home, Commerce and Solutions. Company/Contact remain homepage sections; standalone Tres Leches case is permission-gated and outside initial scope.

Retain React/Vite. Prerender spike is authorized for planning only: document options/contracts, no spike code, dependency edits or generated page implementation now. Protected server changes are NOT authorized. Sprints02–03 showcase the product with truthful maturity labels and synthetic examples. Sprint05 plans commercial integration only. Authenticated product access requires independent security and product readiness approval; never expose private CornerOps APIs or Tres Leches production data.

Re-estimate: 12–19 working days including Sprint00; 11–17 remaining after this planning delivery, assuming timely review and existing stack. This expands the original estimate for route/404 and evidence gates. Allow 1–2 additional days if a prerender/build exception is needed; external permission/domain waits are unbounded and excluded. No schedule is a launch promise. This prior estimate covers S00–04 only; S05 planning is provisionally 1–2 working days after its separate authorization. Dual-agent allocation is not a promised schedule reduction. Budget an additional0.5 working day per handoff cycle explicitly: four planned S01–04 cycles add2 days (14–21 total before optional spike/S05), rather than assume parallelism removes review latency. Further cycles add0.5 day each. F05 vocabulary and F08 ownership are critical-path planning resolutions, completed here; implementation gates remain.

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
| V2-104 | Approve separate evidenceLevel/publicStatus and per-capability evidence/text/status version; unsupported-claims policy | 004 + Founder product evidence | Founder with Claude Code; Codex verifies evidence; blocks factual copy |
| V2-105 | Tokens/type/grid/motion/focus + 390/768/1440 specs | 101 | Claude Code; Codex cross-review/integration; Founder visual approval, contrast checks |
| V2-106 | English route copy + metadata text in Claude-owned publicContent RouteCopy; signed claim matrix | 103–105 + route scope | Claude Code; Codex cross-review/integration; Founder Sprint01 signoff |
| V2-200 | S02 entry: transitive public import graph, reexports/dynamic imports and negative private/auth/API/network fixtures; ledger approval tests | S01 approval; exact protected test change reviewed separately | Codex tests; Claude cross-review; retain existing fixtures/assertions; blocks component integration |
| V2-201 | Public section refactor of existing CornerTechSite.tsx, no visual change in extraction | S01 approval + 200 + content@1/tokens@1 | Claude sole writer; Codex boundary/test cross-review and routing/integration only; D7 proposed for Founder confirmation |
| V2-202 | Commerce-led hero with labelled synthetic product composition | 201 + 105/106 | Claude Code; Codex cross-review/integration; no private imports or data |
| V2-203 | Commerce preview + live-target CTA only | 202; 301 if linked route | Claude Code; Codex cross-review/integration; no dead navigation; use approved enquiry link until route exists |
| V2-204 | Operations/service/trust and permission-independent fictional process fallback; no unsupported proof | 104 + case permission | Claude Code; Codex cross-review/integration; omit case if not cleared |
| V2-205 | Two external conversion paths without lead collection | 106 | Claude Code; Codex cross-review/integration; contact-link and privacy review |
| V2-206 | Six-width +320px/400% reflow,200% text resize,target size,visible/unobscured focus,keyboard/reduced-motion QA | 201–205 | Claude Code; Codex cross-review/integration; Founder Sprint02 UX approval |
| V2-301 | Commerce page with evidence-linked capability states | S02 architecture stable + 104 | Claude Code; Codex cross-review/integration; Founder facts review |
| V2-302 | Solutions page with all three commercial capabilities | 106 | Claude Code; Codex cross-review/integration; truthful engagement scope |
| V2-303 | Tres Leches case and synthetic assets | Explicit client/brand/content permission | Deferred from initial scope; Founder permission gate, Claude Code implements, Codex reviews only after approval |
| V2-304 | Company homepage section and optional research context | Company facts + 106 | Claude Code; Codex reviews; standalone route deferred |
| V2-305 | Contact homepage section/two intentions using approved links | 205 | Claude Code; Codex reviews; no standalone route or forms |
| V2-306A | Planning-only prerender spike specification, manifest and metadata contract | Planning authorized; execution/build edits require later approval | Codex drafts; Claude Code reviews rendering needs; no dependency edits authorized |
| V2-306B | Route output, sitemap/robots, slash policy and real HTTP404; schedule narrow review before S03 (D6) | 306A + explicit protected static-serving exception | BLOCKED: protected server changes NOT authorized; Codex only after separate approval and independent security review |
| V2-306C | Cross-route navigation,history/hash scroll/focus,refresh/direct GET/hydration/metadata/API fallback tests | 301–306B | Codex; Founder Sprint03 content/conversion signoff |
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

Sprint01 coordination gate: GO WITH CONDITIONS for planning readiness, not execution authorization. All18 findings are dispositioned; F05/F08/F09/F16 resolved in docs. D1–D7 remain PROPOSED Founder decisions, not approved public copy/design or server permission. Founder can decide D1–D5 during S01 before final specs; D6 review timing before S03; D7 confirm before S02, with Claude the sole assigned refactor writer meanwhile. No implementation now.

Every showcased capability (S02–03) must pass evidence/approval/permission/version gate and publicStatus validation; source-verified is not available. Claude supplies visibly labelled fictional illustrations; Codex verifies no private imports/data. Versioned content@1/tokens@1 and shared record template/timebox live in CODEX_CLAUDE_HANDOFF_CONTRACT.md; Claude’s S01 EXPERIENCE_SPEC will declare them after authorization. Handoff response within one working session, silence not acceptance. S05 planning and future independent security/product readiness gates unchanged.


## Sprint01 resumption — 2026-10-23 (supersedes historical current-state wording)
Founder authorized Sprint01 strategy, content and design specifications. Runtime baseline is `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`, Railway deployment `a1491b7b-9525-4de9-96db-c7fd3502fd69` SUCCESS, with strict HTTPS and working WhatsApp CTA accepted on both domains in CT-WEB-LIVE-02. The earlier pending-domain-cutover and calendar-default descriptions are historical, not current blockers. Booking is now opt-in; absent/invalid configuration yields Discuss a project on the approved WhatsApp destination, email separately secondary. Corporate `joel@cornertech.ae` is verified per Founder and may be proposed here, but public replacement is not authorized for deployment.

PR96 remains Draft at `754f4868026d4fa899c90fa201814178bf4339a7`. Its docs were copied byte-for-byte into an isolated branch from new main, without merging PR96 or importing PR91/92 history. Independent CLAUDE_S00_FINDINGS.md and evidence JSON remain historical and unchanged. See SPRINT01_ENGINEERING_REVIEW.md and EXPERIENCE_SPEC.md for current execution, decisions and limitations. No Sprint02 components, protected changes, merge or deployment are authorized. D1–D7 remain PROPOSED.


## Sprint02 implementation-ready handoff — Sprint01 execution

S01 deliverables are specification/composition candidates, not approved publication or component code. EXPERIENCE_SPEC.md is the provider of content@1/tokens@1; SPRINT01_ENGINEERING_REVIEW.md records D1–D7 decisions. Founder closes exact copy/claims/tokens and starts S02 separately.

| Sequence | Ticket / owner / exact boundary | Definition of ready and acceptance |
| --- | --- | --- |
| 0 | V2-200 Codex, new isolated test proposal; existing security fixtures untouched | Enumerate transitive public import graph including reexports/lazy/dynamic imports; reject private/auth/API/network paths with negative cases. Specify exact new test path for independent review before edits to any protected test. No component integration until reviewed entry gate passes. |
| 1 | V2-201 Claude, CornerTechSite.tsx + named public section files/tests | Founder D7 confirmation and S02 start; record file list/prop exports before creation. Extract preserving V1 functionality, contact fallback and accessible names. No globals.css/private imports. Codex reviews extraction diff. |
| 2 | V2-105 implementation Claude, cornertech.css; V2-106 publicContent.ts | Approved tokens@1/content@1, D1–D5 and exact per-capability approvals. Scope tokens to .ct-site, preserve old alias mapping one release. Approval ledger sanitization and omission tests pass before content integration. No corporate email deployment without specific approval. |
| 3 | V2-202/203 Claude public hero/Commerce preview | Show flagship IN DEVELOPMENT and labelled fictional composition, no live controls. Secondary Commerce link only when destination exists; otherwise approved enquiry target. No pricing/login/date/provider claims. |
| 4 | V2-204/205 Claude public service/process/contact sections | Three services available; fictional fallback instead of case; approved generic intent copy with primary project journey, no duplicated WhatsApp, no forms/trackers. |
| 5 | Codex PublicApp/PublicLanding/PublicRouteManifest integration | Consume Claude RouteCopy; shared navigation contract, /#company and /#contact, route/hash/history focus/scroll tests. S02 links cannot target unimplemented S03 routes; omit/retain enquiry until routed content exists. |
| 6 | V2-206 Claude visual/keyboard QA, Codex automated evidence | 319px regression plus 320px/400% reflow, 200% text resize, 390/430/768/1024/1280/1440. No lost text/overflow; targets ≥24px (prefer44), visible/unobscured focus, Escape/menu focus return, reduced motion, contrast pairs. Screenshots alone do not certify WCAG. |
| 7 | Integration Codex, independent Claude review | Full combined SHA CI/security/boundary + protected diff, claim gate and network audit; no protected fixture regeneration. Founder S02 acceptance; no merge/deploy implied. |

S03 prerequisites carried forward: route-specific initial HTML and metadata need a separately approved deterministic prerender implementation plan; D6 real HTTP404/cache serving review and explicit protected exception. No assumption that local hash-switch composition proves production routes/SEO. S05 commercial integration planning and independent future product-access/security gates unchanged.

S01 reciprocal-review additions: V2-200 includes scoped forbidden-claims checks and built-artifact evidence-string exclusion tests; preserve negated policy prose and approvalId (opaque) in generated public payload. V2 project CTA intentionally targets /#contact instead of V1 direct WhatsApp; existing booking/WhatsApp fallback stays within each contact intent. Proposed metadata/copy source is EXPERIENCE_SPEC.md. See SPRINT01_ENGINEERING_REVIEW.md for accepted review dispositions.

## V2-200 execution allocation —2026-10-23
Founder instruction to keep Sprint02 moving: Codex owns only `frontend/src/components/public/PublicImportBoundary.test.ts` for the entry-graph gate in worktree cornerops-v2-s02 / branch feature/ct-web-v2-s02-isolation, based on S01 head02fd40f. No existing security fixture/assertion changes; no component, content, token or route implementation. Test-only graph checks use synthetic negative cases, no provider/network calls. Claude cross-review remains required before component integration; this commit is not independent approval. D1–D7 and implementation authorization gates from S01 otherwise unchanged. Infra changes stay exclusively in PR99.
