# Codex ↔ Claude Code engineering handoff contract
Version: 1.0 planning proposal implementing Founder coordination requirements. Applies to Website2.1; no later sprint execution authorized. PR96 remains Draft. Claude Code has not yet independently reviewed or accepted these assignments; reconcile findings before requesting Sprint01 authorization.

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
| Proposed docs/website-v2/CLAUDE_S00_FINDINGS.md | Claude Code, independent worktree only | Codex records dispositions separately, does not rewrite findings |
| Proposed docs/website-v2/CROSS_REVIEW_DISPOSITIONS.md | Codex after findings arrive | Claude Code verifies disposition accuracy; Founder resolves material conflict |
| Proposed docs/website-v2/EXPERIENCE_SPEC.md | Claude Code after Sprint01 authorization | Codex feasibility/security review |
| frontend/src/components/public/CornerTechSite.tsx and explicitly assigned new public page/section components plus colocated tests | Claude Code | Codex dependency/route/claims and test review |
| frontend/src/styles/cornertech.css, frontend/src/config/publicContent.ts, explicitly named public brand assets | Claude Code | Codex compatibility, asset provenance and boundary review |
| frontend/src/PublicApp.tsx, PublicApp.test.tsx, routes/PublicLanding.tsx, PublicLanding.test.tsx | Codex | Claude Code composition/navigation/focus review |
| Proposed frontend/src/components/public/PublicRouteManifest.tsx | Codex | Claude Code labels, metadata and navigation review |
| frontend/src/config/siteConfig.ts, frontend/index.html, frontend/public/robots.txt, frontend/public/sitemap.xml | Codex | Claude Code CTA/content/canonical consistency review |
| All protected files, including src/app.js, globals.css, auth/private modules, packages/locks, deployment config, security tests and fixture | NO WRITER AUTHORIZED under current sprint | Separate explicit scope approval before any future exception |

PublicLanding composes Claude-owned sections; Codex may not silently rewrite those sections to resolve integration conflicts. Claude must not edit routing/siteConfig as a shortcut. Propose a patch or transfer ownership in writing first. Existing security tests and protected hashes remain untouched in S00.

## Worktree isolation and shared-file protocol
1. Each agent uses its own branch and worktree from an agreed immutable base SHA. Do not reuse another agent’s checkout, switch its branch, reset it or alter its uncommitted work. Record the path/branch/base before writing. Independent Claude findings can be produced now in Claude’s own checkout; no task dispatch or access is implied by this document.
2. Codex owns the existing S00 PR branch for these amendments. Future integration uses a dedicated Codex integration worktree; component work stays on Claude’s branch until reviewed.
3. Before concurrent work, list path allocations, interfaces and dependency order in a handoff record accepted by both agents. No parallel modifications of a shared file without that written contract. For an overlapping file, designate one writer and serialize contributions: second agent submits a proposal/patch; ownership transfers only after first head is committed, reviewed and recorded.
4. If unexpected overlap or main/security drift occurs, stop affected integration, preserve both branches, compare diffs and update the contract. Do not auto-resolve by taking one side or regenerating protected baselines. Independent disjoint planning may continue.

## Interface contracts
**Design tokens:** preserve Geist/Geist Mono, existing brand mark and navy/cobalt identity. Claude proposes token names, semantic roles, values, contrast pairings, responsive type/spacing and reduced-motion/focus behavior in EXPERIENCE_SPEC. Existing --ct-* names remain until a versioned mapping and migration are jointly reviewed. Codex consumes documented tokens; no duplicate competing palette or global CSS changes. No token implementation in S00.

**Public content schema (proposed v1):** each page has route ID, title, description, sections and CTA IDs. Each factual capability has claimId referencing PUBLIC_CLAIMS_LEDGER, label, maturity (LIVE/VERIFIED CASE/IN DEVELOPMENT/PLANNED/RESEARCH), evidence reference, approval state and synthetic-visual flag where needed. VERIFIED implementation evidence must not silently become LIVE product availability. CTAs use a typed intention (project/design-partner) and approved internal route or existing siteConfig link key; no arbitrary API URL, credential, tenant/customer identifier or login target. Optional fields must have explicit omission behavior, never fabricated defaults. Claude owns presentation content; Codex validates schema and route/link consumption. Schema changes require versioned before/after examples and consumer tests before either writer implements them.

**Components:** public components are deterministic presentation receiving typed props; no private imports, auth client, data fetch, production provider calls or real customer data. Claude supplies export/prop signatures, interaction states and component tests; Codex supplies composition/routes and initial metadata contracts. Keep route-side effects out of leaf components. Name each new file in the handoff before creation. No full-directory exception to integrity checks.

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

## Current pending handoff
From Codex: PR96 S00 amendments, based on main264588059418cb34fbc9319e922de8dec116522c; final amendment head recorded in PR and delivery report. To Claude Code: independent Sprint00 findings with reviewed SHA, architecture/experience/ownership concerns and severity. Status: NOT RECEIVED in this task. Codex will reconcile findings before requesting final Sprint01 authorization. No Sprint01 start, no protected-server work, no merge or deployment.
