# Dependency-aware implementation roadmap
Status: planning only. Engineering owner: Codex; product/content/release approver: Founder; architecture reviewer: CTO Eric when available. No delegation or customer access implied. No Sprint01 work authorized yet.

Re-estimate: 12–19 working days including Sprint00; 11–17 remaining after this planning delivery, assuming timely review and existing stack. This expands the original estimate for route/404 and evidence gates. Allow 1–2 additional days if a prerender/build exception is needed; external permission/domain waits are unbounded and excluded. No schedule is a launch promise.

| Ticket | Deliverable / acceptance | Dependency | Owner / gate |
|---|---|---|---|
| V2-001 | Fresh main/PR/deployment/public route inventory and acceptance limits | Read-only access | Codex; delivered BASELINE_AUDIT |
| V2-002 | Dependency graph, fresh protected file comparison, security tests | 001 | Codex; delivered ADR + evidence |
| V2-003 | Isolated branch, exact boundaries, local preview/release plan | 002 | Codex; delivered ADR; Founder approval pending |
| V2-004 | Claims ledger with maturity/evidence/permissions | 001 | Codex; delivered; Founder evidence signoff pending |
| V2-005 | SPA/static SEO/404 ADR with protected exceptions explicit | 002 | Codex; delivered proposal; Founder/CTO gate |
| V2-006 | PRD, IA, dependency backlog and risks | 003–005 | Codex; delivered planning artifacts |
| V2-101 | Brand manifesto and company/product/service roles | S00 approval | Codex; Founder positioning gate |
| V2-102 | Audience/jobs/objections and evidence needs | 101 | Codex; Founder commercial review |
| V2-103 | Homepage narrative hierarchy and dual CTA model | 102 + ledger | Codex; no final claims without evidence |
| V2-104 | Approve per-capability maturity and prohibited claims policy | 004 + Founder product evidence | Founder with Codex; blocks factual copy |
| V2-105 | Tokens/type/grid/motion/focus + 390/768/1440 specs | 101 | Codex; Founder visual approval, contrast checks |
| V2-106 | English route copy and initial metadata drafts, signed claim matrix | 103–105 + route scope | Codex; Founder Sprint01 signoff |
| V2-201 | Public section refactor with unchanged protected code | S01 approval | Codex; component/import tests |
| V2-202 | Commerce-led hero with labelled synthetic product composition | 201 + 105/106 | Codex; no private imports or data |
| V2-203 | Commerce preview + live-target CTA only | 202; 301 if linked route | Codex; no dead navigation; use approved enquiry link until route exists |
| V2-204 | Operations/service/trust and permitted case summary | 104 + case permission | Codex; omit case if not cleared |
| V2-205 | Two external conversion paths without lead collection | 106 | Codex; contact-link and privacy review |
| V2-206 | Six-width responsive, keyboard/menu/reduced-motion QA | 201–205 | Codex; Founder Sprint02 UX approval |
| V2-301 | Commerce page with evidence-linked capability states | S02 architecture stable + 104 | Codex; Founder facts review |
| V2-302 | Solutions page with all three commercial capabilities | 106 | Codex; truthful engagement scope |
| V2-303 | Tres Leches case and synthetic assets | Explicit client/brand/content permission | Founder gate; Codex implementation only after approval |
| V2-304 | Company page and optional research context | Company facts + 106 | Codex; may defer in reduced launch |
| V2-305 | Contact page/two intentions using approved links | 205 | Codex; may remain home section; forms excluded |
| V2-306A | Local deterministic prerender spike/manifest and metadata | ADR approved, specific build exception if needed | Codex/CTO review before dependency edits |
| V2-306B | Route output, sitemap/robots, slash policy and real HTTP404 | 306A + explicit protected static-serving exception | Codex; independent security review, no API change |
| V2-306C | Refresh/direct GET/hydration/links/metadata/API fallback tests | 301–306B | Codex; Founder Sprint03 content/conversion signoff |
| V2-401 | Full backend/frontend/security suites, syntax/typecheck/build + protected diff | S03 accepted | Codex; exact-SHA CI must pass |
| V2-402 | Chromium/WebKit keyboard/focus/reduced motion/manual accessibility | 401 candidate | Codex; WCAG target, documented exceptions |
| V2-403 | Reproducible lab performance/bundle budgets | 401 | Codex; field p75 remains pending without field data |
| V2-404 | Canonical/robots/sitemap/404/cache/preview isolation audit | 306C + V1 domain acceptance | Codex; domain unresolved blocks canonical release claim |
| V2-405 | Bundle/secrets/privacy/header/API/log regression review | 401 | Codex; no unrelated backend expansion |
| V2-406 | Exact SHA evidence, rollback artifact, release checklist | 401–405; severe risks resolved/accepted | Founder separate merge/auto-deploy, deploy and DNS authorizations |
| V2-407 | Five prospect comprehension checks if practical | Approved reviewable preview | Founder recruits with consent; Codex records findings, not fabricated metrics |

Suggested PRs: S00 docs-only; S01 strategy/specs; S02 home; S03 pages; separate small infrastructure exception PR only if approved; S04 fixes/evidence. Each depends on accepted predecessor; fresh main/security comparison at each branch creation. Do not import PR91/92. Merging any PR can auto-deploy, including docs-only: no automatic merge.

Sprint01 readiness: READY FOR FOUNDER PLANNING REVIEW, not authorized to start. Approve product hierarchy, route scope, maturity policy, retained brand direction and ADR direction. Assign case evidence owner and decide whether to omit Work until permission. Server/static implementation permission may be deferred, but must be resolved before V2-306B; it need not block low-risk brand planning once Founder approves Sprint01.
