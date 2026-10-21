# CornerTech AI Website 2.0 — implementation PRD

Status: Sprint00 technical delivery accepted, coordination amendments pending independent Claude Code review; Sprint00 only. Audit date: 2026-10-21.
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
| `/` | Understand company, flagship and services | Commerce first; visible development status; service trio; evidence-based work; no fake metrics | Explore Commerce only when target exists; discuss project via vetted links |
| `/products/commerce` | Assess product fit and maturity | Problems, storefront/order/operations model, capability matrix, clearly synthetic illustrations; each capability has evidence/status | Design-partner enquiry via existing external contact; no buy/login |
| `/solutions` | Buy engineering expertise | Custom Engineering, AI Automation, Systems Integration; discovery and delivery process; scoped examples | Discuss project |
| `/work/tres-leches` | Inspect credible work | Founder-approved factual narrative and customer permission; visibly reconstructed synthetic screens; no live records or outcome numbers | Engineering discussion; exclude route entirely if permission pending |
| `/company` | Understand engineering philosophy | Actual company facts and GCC focus; Labs only if explicitly labelled research proposal | Contact |
| `/contact` | Choose intent | Project discussion / explore early access; approved email, WhatsApp and calendar links | No form, analytics or PII collection added |

The table includes future route options; only Home, Commerce and Solutions are initial standalone routes. Company/Contact stay home sections and Work stays absent from standalone navigation until separately approved and permission-cleared. Every initial CTA must target an existing page or approved external contact. The broader route list is not current implementation authority.

## Functional and content requirements
- One route manifest drives navigation, route metadata, sitemap and static output; only approved published routes appear.
- Claims carry internal evidence reference, maturity, approver and revalidation date. Public capability labels must distinguish implemented code from available product.
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
Commerce product development; PR91/92 history; auth/Sales/Command Center; integrations; migrations; new hosting/framework infrastructure; deployment; DNS; customer repositories; legal documents invented as placeholders; forms; pricing; localization. Sprint01 remains unstarted. Await Claude Code’s independent Sprint00 findings and resolve cross-review before requesting final Founder authorization.
