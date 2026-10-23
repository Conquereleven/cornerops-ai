# CornerTech AI Website 2.0 — implementation PRD

Status: Sprint00 technical delivery accepted, coordination amendments reconciled against independent Claude Code findings; Sprint00 only. Audit date: 2026-10-21.
Source of requirements: Founder request and CT-WEB-V2-PLAN-01 / Codex_Sprint_00_Start.md, read in full. Attached instructions are planning requirements, not production authorization.
Baseline: `264588059418cb34fbc9319e922de8dec116522c` (fresh origin/main). See BASELINE_AUDIT.md for evidence and limitations.

## Product decision
CornerTech AI is the parent software engineering company. CornerTech Commerce is the flagship under development. Custom Engineering, AI Automation and Systems Integration are available commercial capabilities, confirmed by the Founder in this task. Availability of a service is not evidence that a named integration, product deployment or outcome is shipping.

The website must make product maturity and two conversion intentions clear: explore Commerce/design partnership, or discuss a paid engineering project. English first; UAE/GCC operators primary, engineering buyers secondary, prospective partners/talent/investors tertiary. Avoid implying general availability, autonomous consequential actions, guaranteed outcomes, published prices or a launch date.

## Founder planning direction and Website 2.1
Initial scope is `/`, `/products/commerce`, `/solutions`. Company and Contact remain homepage sections. Standalone Tres Leches case is deferred and permission-gated. Preserve Geist, the existing mark and navy/cobalt identity; candidate palette changes below are review inputs, not permission to replace them. React/Vite retained; prerender spike authorized for planning only. Protected server changes NOT authorized.

Product showcasing belongs to Sprints02–03. Commercial integration planning belongs to Sprint05; it does not implement onboarding, purchases, subscriptions or authentication. Future authenticated product access requires independent security and product readiness gates and separate Founder authorization. Public pages must never directly expose private CornerOps APIs or Tres Leches production data. Codex is Engineering Lead/Integration DRI; Claude Code is Product Experience Lead and active engineering contributor under CODEX_CLAUDE_HANDOFF_CONTRACT.md.

## Route map: initial scope and deferred options
| Route | Visitor purpose | Required content / acceptance | Conversion / dependency |
|---|---|---|---|
| `/` | Understand company, flagship and services | Commerce visually prominent, development status and available service trio; D1 project-first CTA hierarchy PROPOSED; no fake metrics | Explore Commerce only when target exists; discuss project via vetted links |
| `/products/commerce` | Assess product fit and maturity | Problems, storefront/order/operations model, capability matrix, clearly synthetic illustrations; each capability has evidence/status | Design-partner enquiry via existing external contact; no buy/login |
| `/solutions` | Buy engineering expertise | Custom Engineering, AI Automation, Systems Integration; discovery and delivery process; scoped examples | Discuss project |
| `/work/tres-leches` | Inspect credible work | Founder-approved factual narrative and customer permission; visibly reconstructed synthetic screens; no live records or outcome numbers | Engineering discussion; exclude route entirely if permission pending |
| `/company` | Understand engineering philosophy | Actual company facts and GCC focus; Labs only if explicitly labelled research proposal | Contact |
| `/contact` | Choose intent | Project discussion / explore early access; approved email, WhatsApp and calendar links | No form, analytics or PII collection added |

The table includes future route options; only Home, Commerce and Solutions are initial standalone routes. Company/Contact stay home sections and Work stays absent from standalone navigation until separately approved and permission-cleared. Every initial CTA must target an existing page or approved external contact. The broader route list is not current implementation authority.

## Functional and content requirements
- One route manifest drives navigation, route metadata, sitemap and static output; only approved published routes appear.
- Claims separate internal evidenceLevel from closed publicStatus; exact text/status approval, evidence reference, approver/date/version and permissions are required for every rendered capability. Missing/stale approval means build-time omission; tests enforce ledger IDs and compatible states. Public capability labels must distinguish implemented code from available product.
- Preserve existing contact destinations until Founder verifies replacements; Zoho setup is not a Website V2 dependency or an authorized action.
- No private app, product login, auth client, API fetch, tenant identifier, customer data or secret in the public dependency graph.
- Separate proposed copy from signed-off copy. The master-plan hero is a review draft; Sprint 00 does not produce final Sprint 01 copy.
- No behavioural analytics until purpose, consent and retention review. CTA usability can be checked locally without collecting visitors' data.

## Brand approach for Sprint 01 approval
Preserve the brand mark, Geist/Geist Mono and recognizable navy/cobalt/off-white identity. Proposed design thesis: Precision Intelligence, expressed through content hierarchy and labelled product diagrams rather than generic AI artwork. Existing tokens are recorded in BASELINE_AUDIT.md. Candidate palette from the brief: Obsidian #070B12, Midnight #111A29, Cobalt #2563EB, Silver #B8C8D9, Pearl #F5F7FA. This is an input to contrast/brand review, not approved token replacement.

Specify typography, spacing, grid, focus and reduced-motion states in Sprint 01. Create mobile 390, tablet 768 and desktop 1440 review compositions then; no visual implementation now. Essential interactions must not depend on hover. Synthetic order/payment screens must not imply running product connections.

## Quality acceptance
Responsive widths 390/430/768/1024/1280/1440; keyboard menu, Escape/focus return, skip link, headings/alt text, reduced motion, no overflow/broken assets/console errors. Target WCAG 2.2 AA, with explicit manual review rather than a compliance claim. Test Chromium and WebKit. Target LCP ≤2.5s, CLS ≤0.1, INP ≤200ms at field p75; record lab conditions separately, never claim field performance from one run. Five prospect comprehension sessions if practical must test flagship, development status, services and next action, not generate invented conversion metrics.

SEO requires distinct initial HTML metadata/content, canonical and sitemap agreement, deliberate robots rules and real unknown-route HTTP 404. See ADR for the required protected-server review. Every code PR needs fresh-base protected diff, security and import-negative tests, complete CI and screenshots. Sprint 00 documents do not certify V2 accessibility, performance or production readiness.

## Explicit exclusions
Commerce product development; PR91/92 history; auth/Sales/Command Center; integrations; migrations; new hosting/framework infrastructure; deployment; DNS; customer repositories; legal documents invented as placeholders; forms; pricing; localization. Sprint01 remains unstarted. Claude findings are received and reconciled in CROSS_REVIEW_DISPOSITIONS.md; await explicit Founder authorization, without another routine review loop.

## Reconciled experience requirements — F03/F11/F13/F14
Evolve existing brand; named diagram roles with Commerce maturity labels, Geist prose/Geist Mono labels and tabular data, no magical system claims. Proposed Precision Intelligence details for S01 review: restrained accents, no stock robots/brains/AI sparkle, particle fields or fake metric dashboards; finite state-explaining motion≤400ms, disabled under reduced motion. D2 colors remain PROPOSED and must pass semantic contrast tests.

Cross-route navigation comes from Codex’s manifest and Claude’s public copy model; Commerce label, /#company and /#contact target home sections. Codex owns scroll/focus restoration, including history/hash arrivals, Claude reviews keyboard experience. Shared skip link/landmarks/one h1 on each page; focus must remain visible and not obscured by sticky header.

Add320 CSS px reflow/400% zoom equivalent,200% text resize,≥24×24 CSS px WCAG2.2 targets or documented applicable exception,≥3:1 non-text/focus contrast, no color-only status and text alternatives. Preserve390/430/768/1024/1280/1440 checks. Target WCAG2.2 AA with manual evidence, not certification.

Synthetic demos are coded illustrations with visible in-frame “Illustration · synthetic data” captions and text alternatives. Fictional names/IDs only; no real customers/businesses/SKUs, realistic phone/email/card/IBAN patterns or live screenshots. Only necessary rounded example amounts; no performance claims, unapproved third-party logos or live/connected badges for unshipped features. Prepare a permission-independent process/principles composition so a withheld case does not leave a hole. Transitive public import-isolation tests and negative fixtures are an S02 entry gate before component work, not a late S04 check.

## Founder decision register — all PROPOSED
D1: project enquiry primary; Commerce visually prominent with secondary design-partner conversion. D2: preserve cyan#00D7FF accent and use cobalt#2563EB for accessible action fills with contrast-aware semantic tokens. D3: vetted mailto subject/WhatsApp intent-prefill copy with no visitor data, form or analytics; providers remain external and visitor chooses whether to send. D4: exclude standalone Tres Leches case and prepare permission-independent fallback. D5: prohibit unsupported enterprise-grade, enterprise-ready, certification, scale and outcome claims; prefer “Software built for real operations.” D6: schedule narrow404/static-serving review before S03, no server implementation permission. D7: Claude owns CornerTechSite.tsx refactor during S02; recorded as operative single-writer coordination assignment, product work still requires Founder sprint approval. Full dispositions/decision timing are in CROSS_REVIEW_DISPOSITIONS.md.


## Sprint01 resumption — 2026-10-23 (supersedes historical current-state wording)
Founder authorized Sprint01 strategy, content and design specifications. Runtime baseline is `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`, Railway deployment `a1491b7b-9525-4de9-96db-c7fd3502fd69` SUCCESS, with strict HTTPS and working WhatsApp CTA accepted on both domains in CT-WEB-LIVE-02. The earlier pending-domain-cutover and calendar-default descriptions are historical, not current blockers. Booking is now opt-in; absent/invalid configuration yields Discuss a project on the approved WhatsApp destination, email separately secondary. Corporate `joel@cornertech.ae` is verified per Founder and may be proposed here, but public replacement is not authorized for deployment.

PR96 remains Draft at `754f4868026d4fa899c90fa201814178bf4339a7`. Its docs were copied byte-for-byte into an isolated branch from new main, without merging PR96 or importing PR91/92 history. Independent CLAUDE_S00_FINDINGS.md and evidence JSON remain historical and unchanged. See SPRINT01_ENGINEERING_REVIEW.md and EXPERIENCE_SPEC.md for current execution, decisions and limitations. No Sprint02 components, protected changes, merge or deployment are authorized. D1–D7 remain PROPOSED.
