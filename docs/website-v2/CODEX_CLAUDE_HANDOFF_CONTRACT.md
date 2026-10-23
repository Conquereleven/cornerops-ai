# Codex ↔ Claude Code engineering handoff contract
Version: 1.1 — Sprint00 reconciled planning contract. Applies to Website2.1; no later sprint execution authorized. PR96 remains Draft. Claude reviewed head31e876f in commit672c11a; see CROSS_REVIEW_DISPOSITIONS.md for all18 findings. No new review loop is required absent a material unresolved issue; Founder Sprint01 authorization remains pending.

## Roles and decision rights
- Codex: Engineering Lead and Integration DRI; architecture, public/private isolation, integration branches, routing/SEO/config, automated validation and evidence packaging. Reviews Claude’s implementation and claim provenance.
- Claude Code: Product Experience Lead and active engineering contributor; product narrative, design tokens, public content model, public component/style implementation, interaction/accessibility evidence. Reviews Codex’s integration for experience, fidelity and truthful product state.
- Founder: scope, product claims, brand/client permission, sprint starts and release authority. CTO Eric: high-impact architecture review when available. Neither agent approves its own work or substitutes for independent security/product readiness review.

## File ownership before work starts
This is the proposed default allocation for future authorized work, not current code-edit permission. Every handoff must enumerate actual paths (no broad directory ownership used as a blank cheque).

| Files / planned path | Single writer | Required cross-review |
|---|---|---|
| docs/website-v2/SPRINT_V2_BACKLOG.md, WEBSITE_V2_ARCHITECTURE_ADR.md, RISKS_AND_RELEASE_GATES.md, BASELINE_AUDIT.md and this contract | Codex | Claude Code experience/dependency review |
| docs/website-v2/PRODUCT_WEBSITE_PRD_V2.md, PUBLIC_CLAIMS_LEDGER.md | Codex during current S00 amendments; future ownership transfer must be recorded | Claude Code proposes copy/experience changes; Founder approves claims |
| docs/website-v2/CLAUDE_S00_FINDINGS.md | Claude Code, independent worktree only | Codex records dispositions separately, does not rewrite findings |
| docs/website-v2/CROSS_REVIEW_DISPOSITIONS.md | Codex | Trace each finding to immutable Claude report; Founder resolves any material conflict |
| Proposed docs/website-v2/EXPERIENCE_SPEC.md | Claude Code after Sprint01 authorization | Codex feasibility/security review |
| frontend/src/components/public/CornerTechSite.tsx and explicitly assigned new public page/section components plus colocated tests | Claude Code | Codex dependency/route/claims and test review |
| frontend/src/styles/cornertech.css, frontend/src/config/publicContent.ts, explicitly named public brand assets | Claude Code | Codex compatibility, asset provenance and boundary review |
| frontend/src/PublicApp.tsx, PublicApp.test.tsx, routes/PublicLanding.tsx, PublicLanding.test.tsx | Codex | Claude Code composition/navigation/focus review |
| Proposed frontend/src/components/public/PublicRouteManifest.tsx | Codex | Claude Code labels, metadata and navigation review |
| frontend/src/config/siteConfig.ts, frontend/index.html, frontend/public/robots.txt, frontend/public/sitemap.xml | Codex | Claude Code CTA/content/canonical consistency review |
| All protected files, including src/app.js, globals.css, auth/private modules, packages/locks, deployment config, security tests and fixture | NO WRITER AUTHORIZED under current sprint | Separate explicit scope approval before any future exception |

V2-201 public section refactor, including existing CornerTechSite.tsx, has Claude as sole writer; Codex owns routing and integration only. D7 records the recommended product allocation for Founder confirmation without authorizing implementation. PublicLanding composes Claude-owned sections; Codex may not silently rewrite those sections to resolve integration conflicts. Claude must not edit routing/siteConfig as a shortcut. Propose a patch or transfer ownership in writing first. Existing security tests and protected hashes remain untouched in S00.

## Worktree isolation and shared-file protocol
1. Each agent uses its own branch and worktree from an agreed immutable base SHA. Do not reuse another agent’s checkout, switch its branch, reset it or alter its uncommitted work. Record the path/branch/base before writing. Independent Claude findings can be produced now in Claude’s own checkout; no task dispatch or access is implied by this document.
2. Codex owns the existing S00 PR branch for these amendments. Future integration uses a dedicated Codex integration worktree; component work stays on Claude’s branch until reviewed.
3. Before concurrent work, list path allocations, interfaces and dependency order in a handoff record accepted by both agents. No parallel modifications of a shared file without that written contract. For an overlapping file, designate one writer and serialize contributions: second agent submits a proposal/patch; ownership transfers only after first head is committed, reviewed and recorded.
4. If unexpected overlap or main/security drift occurs, stop affected integration, preserve both branches, compare diffs and update the contract. Do not auto-resolve by taking one side or regenerating protected baselines. Independent disjoint planning may continue.

## Interface contracts
**Design tokens:** preserve Geist/Geist Mono, existing brand mark and navy/cobalt identity. Claude proposes token names, semantic roles, values, contrast pairings, responsive type/spacing and reduced-motion/focus behavior in EXPERIENCE_SPEC. Existing --ct-* names remain until a versioned mapping and migration are jointly reviewed. Codex consumes documented tokens; no duplicate competing palette or global CSS changes. No token implementation in S00.

**Public content schema (`content@1`, planning contract):** Claude owns `frontend/src/config/publicContent.ts`, including route copy and metadata text as RouteCopy keyed by routeId (`home`, `commerce`, `solutions`): title, description, h1 and optional OG text. Codex’s PublicRouteManifest imports copy by key and owns path/nav/sitemap/metadata wiring; index.html and generated metadata consume the same copy, never a parallel authored text source. Optional sections are omitted, not replaced with placeholders.

Two separate concepts are mandatory: internal `evidenceLevel` = `founder-confirmed | source-verified | case-verified | roadmap | research` (never render or ship internal provenance); visitor `publicStatus` = `available | in-development | planned | research` with corresponding text labels. VERIFIED and VERIFIED CASE are not public status values. Case narrative has no capability badge and requires case permission; source-verified evidence alone cannot authorize available. Every publicly rendered product capability must have claimId, evidence reference, specific Founder approval (approver/date/approved text-and-status version), publicStatus, and synthetic flag where applicable. Unapproved/unknown/stale claims fail closed: omitted at build time; CI rejects unknown IDs and incompatible evidence/status. Status is text, never color alone. Source-only evidence may support in-development, not available. Codex owns ledger-sync/approval-gate tests; Claude supplies omission/status rendering tests. No tests implemented in S00.

CTAs use typed intention (project/design-partner), an approved internal route or vetted siteConfig contact key; no private API, credentials, customer IDs or login. D3 intent-prefill text is PROPOSED, not approved copy: generic mailto subject and WhatsApp text contain no visitor data, tracking identifiers or access/date promises. Existing providers receive a message only if the visitor elects to send it; no new first-party collection/form/analytics is introduced. All field changes require versioned examples, compatibility notes and consumer tests before implementation.

**Components:** public components are deterministic presentation receiving typed props; no private imports, auth client, data fetch, production provider calls or real customer data. Claude supplies export/prop signatures, interaction states, component tests and route/metadata copy; Codex supplies composition/routes and metadata consumption contracts. Claude owns PageFrame/SiteHeader/sections and the V2-201 split; Codex owns PublicNotFound wiring with Claude-authored copy and shared frame. Keep route-side effects out of leaf components. Name each new file in the handoff before creation. No full-directory exception to integrity checks.

**Product integration:** S02–03 showcase Commerce with IN DEVELOPMENT and capability-specific maturity labels, synthetic examples and vetted enquiry links. S05 produces commercial journey/data-boundary/access-readiness planning, no backend wiring. Future authenticated access requires independently reviewed security (auth/authorization, tenancy, rate/abuse controls, audit/privacy, rollback) and product readiness (working supported capability, onboarding/support, truthful availability). Separate Founder implementation/activation authorization follows; public marketing never exposes private CornerOps APIs or Tres Leches production data.

## Handoff packet and reciprocal acceptance
Each agent submits: ticket IDs; base/head SHAs; worktree/branch; exact changed files and ownership; exported props/token/schema version; migration/compatibility notes; claim IDs and permissions; test commands/results/skips; screenshots for UI work at required widths; known defects; reviewer and requested disposition. S00 docs need no new UI screenshots.

Receiving agent records accept / changes requested / blocked per finding against the exact head. Claude reviews Codex integration; Codex reviews Claude contributions. Disagreements are documented with options and escalated to Founder/CTO only when material. Review evidence must be genuine; no implied independent signoff.

## Integration and release gates
G-A: recorded ownership/interface agreement and applicable sprint authorization.
G-B: reciprocal review complete, claims/permissions satisfied or feature omitted.
G-C: Codex integrates only reviewed commits; inspect combined diff against fresh main, independently compare protected bytes/membership, run boundary/security and complete applicable CI on exact combined SHA. Do not bless unexpected protected changes with fixture regeneration.
G-D: Claude validates combined experience; Codex publishes evidence and remaining risks. Re-review changed lines after conflict resolution. A passing isolated branch does not substitute for combined-head tests.
G-E: Founder decides acceptance and separately authorizes any merge (auto-deploy risk), deployment or DNS change. No production, database, credential or customer-system changes authorized by this contract.

## Current reconciled handoff
Claude’s independent findings received at exact commit `672c11ab8b98bd545d694e6f31b2a7771281a23b`, whose parent is reviewed head `31e876f5c3bc53f94b8a6c330bfa7e42281cf480`. Codex branch fast-forward preserves that commit and its document blob. Shared baseline `264588059418cb34fbc9319e922de8dec116522c`. All18 dispositions and D1–D7 are in CROSS_REVIEW_DISPOSITIONS.md. F05/F08/F09/F16 are resolved in documentation; implementation remains future gated work. Await Founder authorization, not another routine reviewer loop.

## Versioned interfaces and shared handoff record (F10/F12)
Contract versions live here until authorized S01 creates EXPERIENCE_SPEC.md with `tokensVersion: tokens@1` and `contentVersion: content@1`. Claude owns that spec and Codex reviews it. Consumers declare exact supported versions. Breaking changes increment major version, include before/after examples and migration tests; additive changes increment minor version with explicit omitted-field behavior. No unilateral consumer/provider changes. Tokens are scoped solely to `.ct-site` in cornertech.css; globals.css stays untouched. Define semantic background/surface/text/muted/action/accent/inverse/status roles and a versioned --ct-* alias mapping; retain old aliases for one release, remove only after consumer audit. D2 cyan/cobalt values remain PROPOSED. Assert contrast per semantic pair, not color names: body text≥4.5:1, eligible large text≥3:1, meaningful non-text/focus indicators≥3:1. No cobalt body text on dark or silver text on pearl. Claude proposes restrained finite state-explaining motion≤400ms and zero under reduced motion; Founder approves brand details in S01.

Reuse this template in an append-only handoff record inside CROSS_REVIEW_DISPOSITIONS.md (future sprint records may use the same structure there); no extra per-handoff document required now:

| Field | Required record |
|---|---|
| Handoff ID / tickets / sender → reviewer | H-nnn, scope and exact responsibility |
| Base / source head / integrated head | Full SHAs; include reviewed SHA and post-resolution SHA |
| Branches / worktrees | Separate paths and ownership; no writes to peer checkout |
| Exact files / single writer / transfer | Enumerated paths; explicit commit at any ownership transfer |
| Interfaces | tokens@version, content@version, prop exports, consumer versions and migration notes |
| Claims / permissions | IDs, evidence, approval version, omissions, synthetic captions |
| Validation | Commands, results/skips, screenshots where relevant, limitations |
| Review | Requested/completed time, reviewer, accept/changes/blocked, findings/dispositions |
| Integration / remaining decision | Combined diff/tests, defects and Founder gate |

Review response is due within one working session after receipt of a complete packet; record deadline and availability. Silence never approves. Budget0.5 working day per handoff cycle; escalate overdue blocked dependencies to Founder with evidence rather than silently integrating. During S01, Claude proposes narrative/copy in EXPERIENCE_SPEC; any actual transfer of PRD editing ownership is recorded at a commit before editing. Codex retains the claims ledger and PRD technical requirements; never simultaneous edits to the same file.

## Navigation, accessibility and synthetic acceptance (F11/F13/F14)
Codex manifest supplies nav items; Claude renders props, no hard-coded same-page anchors on other routes. Use /#contact and /#company, /solutions and /products/commerce; nav label Commerce. Codex owns route-change scroll reset/focus to h1 or main, hash arrival scroll/focus, and browser back/forward restoration policy/tests; Claude reviews experience. Shared frame provides skip link, landmarks and one h1. Sticky header must not obscure focus (scroll padding/offset policy).

Test320 CSS px reflow (including400% zoom equivalent),200% text resize without loss, WCAG2.2 AA target sizes≥24×24 CSS px or documented valid exceptions (prefer full-sized targets), visible/unobscured focus and≥3:1 non-text contrast, no color-only status, diagram alternatives. Keep six existing responsive widths and manual review; not a certification claim.

Coded HTML/SVG demonstrations require visible in-frame “Illustration · synthetic data” caption and text alternative. Use obviously fictional names/IDs, no real business/customer/SKU identifiers or realistic phone/IBAN/card/email patterns. Only structurally needed rounded amounts, no outcome metrics; no live-system screenshots, unsupported provider logos or live/connected indicators for unshipped capabilities. Claude creates a permission-independent process/principles fallback; D4 exclusion/fallback publication remains proposed for Founder approval.

At S02 entry, before new components, Codex prepares reviewed transitive entry-graph tests (reexports/dynamic imports included) plus negative fixtures for private/auth/Supabase/API-client/network imports. Retain all existing assertions/fixtures; any protected test change requires separate scope review, not this document’s authorization. No component integration until this entry gate and reciprocal review pass.


## Sprint01 resumption — 2026-10-23 (supersedes historical current-state wording)
Founder authorized Sprint01 strategy, content and design specifications. Runtime baseline is `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`, Railway deployment `a1491b7b-9525-4de9-96db-c7fd3502fd69` SUCCESS, with strict HTTPS and working WhatsApp CTA accepted on both domains in CT-WEB-LIVE-02. The earlier pending-domain-cutover and calendar-default descriptions are historical, not current blockers. Booking is now opt-in; absent/invalid configuration yields Discuss a project on the approved WhatsApp destination, email separately secondary. Corporate `joel@cornertech.ae` is verified per Founder and may be proposed here, but public replacement is not authorized for deployment.

PR96 remains Draft at `754f4868026d4fa899c90fa201814178bf4339a7`. Its docs were copied byte-for-byte into an isolated branch from new main, without merging PR96 or importing PR91/92 history. Independent CLAUDE_S00_FINDINGS.md and evidence JSON remain historical and unchanged. See SPRINT01_ENGINEERING_REVIEW.md and EXPERIENCE_SPEC.md for current execution, decisions and limitations. No Sprint02 components, protected changes, merge or deployment are authorized. D1–D7 remain PROPOSED.
