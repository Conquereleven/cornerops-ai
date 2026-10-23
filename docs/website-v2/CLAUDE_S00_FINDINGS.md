# Claude Code — independent Sprint 00 findings (Website 2.1)

| | |
|---|---|
| Reviewer | Claude Code (Product Experience Lead), independent of Codex |
| Reviewed source | PR #96, branch `feature/ct-web-v2-s00-foundation`, exact head `31e876f5c3bc53f94b8a6c330bfa7e42281cf480` |
| Baseline | `264588059418cb34fbc9319e922de8dec116522c` (merge-base confirmed) |
| Reviewed files | CODEX_CLAUDE_HANDOFF_CONTRACT.md, PRODUCT_WEBSITE_PRD_V2.md, WEBSITE_V2_ARCHITECTURE_ADR.md, PUBLIC_CLAIMS_LEDGER.md, SPRINT_V2_BACKLOG.md, RISKS_AND_RELEASE_GATES.md, BASELINE_AUDIT.md, boundary-evidence.json; plus current public source at that head |
| Date | 2026-10-21 |
| Scope | Planning review only. No code, protected file, PR #96 branch, deployment, DNS or data was touched. |

Codex records dispositions in `CROSS_REVIEW_DISPOSITIONS.md`; this document is not to be rewritten by Codex.

## Independently re-verified facts (2026-10-21 ~14:15 UTC)

| Codex statement | My check | Result |
|---|---|---|
| Protected set 792 files, `be91c76a…5e90` at baseline | Own git-object hash script over baseline and the PR head | Agrees |
| PR #96 changes only `docs/website-v2/` | `git diff --stat` baseline..head: 9 files, all under `docs/website-v2/` | Agrees |
| Hashed assets get 300 s, not immutable caching | `GET /assets/index-CxokD0Hr.js` → `cache-control: public, max-age=300`; `src/app.js:80` expects `.<hex8+>.`, Vite emits `-<base64>.` | Agrees |
| Commerce source evidence | `src/core/commerce-os/` has CanonicalOrderIntakeService, CommerceOSProfileService, PostgresCommerceOrderIntakeStore; PR #89 (Shopify) is OPEN | Agrees |
| Custom domain "connection refused; cause not established" | Apex A `165.22.30.248` (registrar parking), `www` CNAME `cornertech.ae`; HTTP 200 Apache parking, HTTPS refused. Railway reports both custom domains **verified=true** since 2026-10-21 (ownership TXT added under separate authorization); only the routing cutover is pending and unauthorized | **Correct observation, incomplete cause** (see F16) |

## Summary of dispositions requested

| ID | Finding | Classification |
|---|---|---|
| F01 | Commerce as flagship, but home conversion must lead with what is buyable today | ACCEPT WITH CHANGES |
| F02 | "Premium enterprise" positioning | ACCEPT WITH CHANGES (the word "enterprise" in public copy: **BLOCKED**) |
| F03 | Precision Intelligence visual direction | ACCEPT WITH CHANGES |
| F04 | Candidate palette fails contrast for cobalt text | ACCEPT WITH CHANGES |
| F05 | Maturity vocabulary is inconsistent between ledger and schema | ACCEPT WITH CHANGES (must be fixed before V2-104) |
| F06 | Initial routes Home / Commerce / Solutions | ACCEPT |
| F07 | Two conversion journeys share identical destinations | ACCEPT WITH CHANGES |
| F08 | Ownership contradiction: V2-201 vs contract (CornerTechSite.tsx) | ACCEPT WITH CHANGES (must be fixed before S02) |
| F09 | Content schema: metadata copy and claim gating | ACCEPT WITH CHANGES |
| F10 | Design-token interface | ACCEPT WITH CHANGES |
| F11 | Navigation is hard-coded same-page anchors | ACCEPT WITH CHANGES |
| F12 | Handoff mechanics lack a record format and review timebox | ACCEPT WITH CHANGES |
| F13 | Accessibility requirements miss reflow, target size, focus-obscured | ACCEPT WITH CHANGES |
| F14 | Synthetic-demonstration rules are underspecified | ACCEPT WITH CHANGES |
| F15 | SEO/404 and prerender direction | ACCEPT (Founder decision timing flagged) |
| F16 | Custom-domain risk wording | ACCEPT WITH CHANGES (documentation correction) |
| F17 | Asset caching observation | ACCEPT |
| F18 | Estimate and sequencing | ACCEPT WITH CHANGES |

No finding blocks starting Sprint 01 strategy/spec work, provided F05, F08, F09 and F16 dispositions are recorded first. See "Sprint 01 readiness".

---

## 1. Product and brand assessment

### F01 — CornerTech Commerce as flagship · ACCEPT WITH CHANGES

Agree that Commerce is the narrative anchor and the product IP story. Disagree with reading "Commerce first" as "the homepage hero is the product" while the product is IN DEVELOPMENT (C07–C12) and the revenue-bearing offer today is engineering services (C02, LIVE).

Risk: a UAE/GCC operator landing on a hero dominated by an unavailable product asks "what can I buy?" and finds the answer two scrolls down. A product hero also tempts copy toward availability claims the ledger forbids.

Proposed change to the PRD home requirement:
1. Hero = company promise (what CornerTech builds for operators) **plus** a visible flagship strip: "CornerTech Commerce — in development" with a link to `/products/commerce`.
2. Primary CTA = "Discuss a project" (C02, LIVE). Secondary CTA = "Become a design partner" (C20, wording pending Founder).
3. Service trio immediately after the hero, then the Commerce showcase.

This keeps Commerce as flagship without making the homepage's main promise depend on an unshipped product. Founder decision required (D1).

### F02 — "Premium enterprise software" · ACCEPT WITH CHANGES; "enterprise" in public copy BLOCKED

"Premium" is a design and craft aspiration and is fine as an internal brief (C22). "Enterprise" is a market claim, and the evidence in the ledger does not support it:
- no customer logos, counts or testimonials (C23 BLOCKED);
- one case, still permission-pending (C14);
- no certifications or SLAs (C05, C22);
- a new domain not yet serving the site.

Recommend public positioning as **"operator-grade" / "production-grade software for growing operators"**, with the restrained, precise visual system doing the premium signalling. Keep "enterprise" out of copy and metadata until evidence exists. Add it to the prohibited-claims policy in V2-104.

### F03 — Precision Intelligence direction · ACCEPT WITH CHANGES

The thesis matches the V1 design: Geist, a labelled system topology and restrained motion. Treat it as **evolution, not replacement**. Make it testable so it does not drift into generic "AI" artwork. Precision Intelligence means:

- **Show structure, not magic.** Every diagram node is a named, real system role (Orders, Payments, Inventory…), with an explicit maturity label when it refers to Commerce.
- **Typographic precision.** Geist for prose; Geist Mono only for data, labels, IDs and status. Tabular figures for any number.
- **One accent per view.** Cobalt fills for action, and a bright accent only for focus, live-state and data highlights.
- **Explicitly prohibited:**
  - glows, particle fields and gradient meshes;
  - stock robots, brains or "AI sparkle" icons;
  - fake dashboards with invented metrics.
- **Motion explains state change and never loops.** Finite, at most 400 ms, fully disabled under `prefers-reduced-motion`.

### F04 — Palette · ACCEPT WITH CHANGES

WCAG contrast, computed independently:

| Pair | Ratio | Verdict |
|---|---|---|
| Pearl #F5F7FA on Obsidian #070B12 | 18.36 | AAA |
| Silver #B8C8D9 on Obsidian / Midnight #111A29 | 11.54 / 10.22 | AAA |
| **Cobalt #2563EB text on Obsidian / Midnight** | **3.81 / 3.38** | **Fails body text**; large text and UI only |
| Pearl on Cobalt (button) | 4.82 | AA |
| Cobalt on Pearl | 4.82 | AA |
| **Silver on Pearl** | **1.59** | **Fails everything** |
| Current #0066ff on #05070b | 4.17 | AA-large / UI only |
| Current cyan #00d7ff on #05070b | 11.68 | AAA |
| Candidate accent-text #60A5FA on Obsidian | 7.75 | AAA |
| Candidate cobalt-strong #1D4ED8 with Pearl | 6.24 | AA |

Consequences:
- Cobalt must never be link or body text on dark surfaces. It is only a fill (with Pearl text) or ≥24 px display text.
- Silver is a dark-surface token only.
- The candidate palette drops the current **cyan accent**, which is part of the recognisable V1 identity. Keep a bright accent role, either existing cyan or `#60A5FA`, for links on dark, focus rings and live-state markers. Founder decision D2.

Proposed semantic roles are in F10.

### F05 — Maturity and truthful claims · ACCEPT WITH CHANGES (before V2-104)

The ledger defines six states (LIVE, VERIFIED, VERIFIED CASE, IN DEVELOPMENT, PLANNED, RESEARCH). The contract's content schema lists five, omitting VERIFIED. "VERIFIED" (evidence of code) is exactly the state the ledger warns must not become a public availability claim, so it must not be renderable at all.

Proposal: split two fields.
- `evidenceLevel` (internal, never rendered): `founder-confirmed | source-verified | case-verified | roadmap | research`.
- `publicStatus` (rendered, closed set of visitor wording): `available` → "Available", `in-development` → "In development", `planned` → "Planned", `research` → "Research". `case-verified` evidence renders no status badge, only the approved case narrative.

Rules:
1. A claim without Founder approval is **omitted** at build time (fail closed), not shown with a warning.
2. `source-verified` evidence may support `in-development`, never `available`.
3. Status is conveyed in text, never colour alone.

### F06 — Initial routes · ACCEPT

`/`, `/products/commerce`, `/solutions`, with Company and Contact as home sections. Two notes:
- With one product, the nav label should be "Commerce", not "Products ▸ Commerce".
- More standalone routes make the soft-404 behaviour (F15) more visible, because mistyped URLs now return a homepage.

### F07 — Conversion journeys · ACCEPT WITH CHANGES

Both intents ("discuss a project", "explore Commerce / design partner") currently resolve to the same email, WhatsApp and calendar links. The Founder cannot tell them apart, and the visitor gets no confirmation that they chose the right path.

Privacy-neutral fix (no form, no analytics, no data collection):
- `mailto:` with an intent-specific **subject** only, for example "Project enquiry" or "CornerTech Commerce design partner".
- WhatsApp `wa.me` link with a short intent-specific **prefilled text**.
- The same calendar link, with a CTA label naming the meeting purpose.

Prefill strings must contain no visitor data and are Founder-approved copy (D3). Design-partner wording must not promise access, pricing or a date (C20).

## 2. UX findings (current V1 source and V2 plan)

1. **Navigation will break across routes (F11).** Header nav items are hard-coded same-page anchors (`#solutions`, `#industries`, `#work`, `#company`) in `CornerTechSite.tsx`, and "Talk to us" links to `#contact`. On `/solutions` or `/products/commerce` these targets do not exist. "Solutions" as an anchor also collides with the new `/solutions` route.
2. **Route-change focus and scroll are unspecified.** A client-side route change must move focus to the new page's `h1` (or `main`) and reset scroll. Hash links (`/#contact`) must scroll and focus the target. Without this, keyboard and screen-reader users land mid-page or at the old focus position.
3. **Skip link and landmarks per page.** The current skip link lives in `PublicLanding`. New pages need the same skip link, one `h1`, and `header`/`main`/`footer` landmarks via a shared page frame, not copy-pasted.
4. **The sticky header can hide focused elements.** This is WCAG 2.2 SC 2.4.11; set `scroll-padding-top` to the header height.
5. **The Tres Leches case is the only proof on the page.** If permission is not granted, Home loses its only "evidence" section. Plan an evidence-free fallback composition now (process and principles), rather than leaving a gap at S02.
6. **CTA hierarchy.** At most one primary button per viewport, with the same verb used for the same intent everywhere ("Discuss a project" is never also "Talk to us" or "Contact").

## 3. Recommended design-system direction

### F10 — Design-token interface · ACCEPT WITH CHANGES

- Tokens live only in `frontend/src/styles/cornertech.css`, scoped to `.ct-site`. `globals.css` stays protected and untouched.
- Semantic names with a versioned mapping from the existing `--ct-*` names; old names alias new ones for one release, then are removed.
- Proposed semantic roles (values are D2 candidates, contrast-checked above):

| Token | Role | Candidate |
|---|---|---|
| `--ct-color-bg` | page background (dark) | Obsidian #070B12 (current #05070b) |
| `--ct-color-surface` | raised panels | Midnight #111A29 (current #07111f) |
| `--ct-color-text` | primary text on dark | Pearl #F5F7FA |
| `--ct-color-text-muted` | secondary text on dark | Silver #B8C8D9 |
| `--ct-color-action` | button/fill only | Cobalt #2563EB (Pearl text 4.82) |
| `--ct-color-action-strong` | hover/pressed fill | #1D4ED8 (Pearl text 6.24) |
| `--ct-color-accent` | links on dark, focus ring, live markers | #60A5FA or existing cyan #00D7FF |
| `--ct-color-bg-inverse` / `--ct-color-text-inverse` | light sections | Pearl / Obsidian |
| `--ct-color-rule` | hairlines | rgba(255,255,255,.07) dark; rgba(11,17,17,.09) light |
| `--ct-status-*` | status badges | text plus icon; colour is secondary |

- Type scale: fluid `clamp()` steps with a single source. Body 16 px minimum, line-height ≥1.5, measure ≤72ch. Geist Mono only for labels and data.
- Spacing: a 4 px base with a named scale (`--ct-space-1…12`). Grid: 4 columns at mobile, 8 at tablet, 12 at desktop, max content width 1200–1280 px.
- Focus: 2 px `--ct-color-accent` outline with 2 px offset, ≥3:1 against adjacent colours. Never removed.
- Motion: `--ct-motion-duration` ≤400 ms with a single easing; `prefers-reduced-motion` reduces it to 0.
- Contrast: an automated test asserts the ratio of each documented text/background pair. A build-time check is cheaper than visual QA.

## 4. Proposed component contracts

Presentation-only, typed props, no fetching, no private imports, no side effects in leaves. Interfaces below are proposals for EXPERIENCE_SPEC v1. New files are named before creation, as the contract requires.

```ts
// Shared content types (frontend/src/config/publicContent.ts — Claude-owned)
type RouteId = 'home' | 'commerce' | 'solutions';
type PublicStatus = 'available' | 'in-development' | 'planned' | 'research';
type CtaIntent = 'project' | 'design-partner';

interface ClaimRef {
  claimId: `C${number}`;         // must exist in PUBLIC_CLAIMS_LEDGER
  approved: boolean;             // false ⇒ the item is omitted at build time
}

interface Capability extends ClaimRef {
  id: string;
  label: string;
  summary: string;
  status: PublicStatus;          // rendered as text, never colour alone
}

interface SyntheticVisual {
  synthetic: true;               // literal: only synthetic visuals are allowed
  caption: string;               // rendered inside the visual, e.g. "Illustration · synthetic data"
  description: string;           // text alternative for the whole visual
}

interface Cta {
  intent: CtaIntent;
  label: string;
  target:
    | { kind: 'route'; routeId: RouteId; hash?: string }
    | { kind: 'contact'; channel: 'email' | 'whatsapp' | 'calendar' }; // resolved from siteConfig + intent prefill
}

interface RouteCopy {               // copy authored by Claude, consumed by Codex's manifest
  routeId: RouteId;
  title: string;                    // ≤60 chars
  description: string;              // ≤155 chars
  h1: string;
}
```

| Component (all in `frontend/src/components/public/`) | Owner | Props / contract |
|---|---|---|
| `PageFrame` | Claude | `{ routeId; navItems: NavItem[]; children }`: skip link, header, `main#main-content`, footer; no routing logic |
| `SiteHeader` | Claude | `{ navItems: NavItem[]; primaryCta: Cta }`; `NavItem = { label; href }` supplied by Codex's manifest; mobile menu with Escape and focus return |
| `Hero` | Claude | `{ eyebrow?; heading; lede; primary: Cta; secondary?: Cta; flagship?: { label; status: PublicStatus; routeId } }` |
| `CapabilityMatrix` | Claude | `{ items: Capability[] }`; renders only `approved` items; status as text plus icon |
| `ServiceTrio` | Claude | `{ services: Capability[] }` (all `available`) |
| `ProductVisual` | Claude | `{ visual: SyntheticVisual; children }`; caption always rendered; `role="img"` plus description |
| `ContactSection` | Claude | `{ intents: Cta[] }`; no form or inputs |
| `CommercePage`, `SolutionsPage` | Claude | compose the above from content; no data access |
| `PublicRouteManifest` | Codex | `{ routeId; path; copy: RouteCopy; nav: boolean; sitemap: boolean }[]`, the single source for nav, metadata, sitemap and prerender |
| `PublicNotFound` | Codex (layout from `PageFrame`) | noindex; copy from Claude |

Each component ships with colocated tests: render without network (fetch spy), keyboard behaviour where interactive, unapproved claims omitted, synthetic caption present.

### F09 — Content schema · ACCEPT WITH CHANGES

- **Metadata copy ownership conflict.** V2-106 makes Claude author route copy and metadata, but metadata lives in the Codex-owned manifest and `index.html`. Fix: copy lives in `publicContent.ts` as `RouteCopy` keyed by `routeId` (Claude). The manifest imports it by key (Codex). Neither edits the other's file.
- **Claim gating is enforced by a test, not by review.** Every rendered `Capability` must carry a `claimId` present in the ledger, and an unapproved claim is omitted. A ledger-sync test (Codex) checks that the IDs used exist.
- Optional fields have defined omission behaviour (the section is not rendered), never placeholder text.

### F08 — Component boundaries and ownership · ACCEPT WITH CHANGES (before S02)

**Contradiction:** the contract makes Claude the single writer of `CornerTechSite.tsx`, while backlog V2-201 ("Public section refactor") assigns Codex to refactor exactly those sections. Options:
- (a) **Recommended:** Claude performs V2-201, splitting `CornerTechSite.tsx` into the components above with no visual change. Codex reviews imports, boundaries and tests.
- (b) Codex performs V2-201 under a recorded temporary ownership transfer, after which ownership returns to Claude at a named commit.

Also: `PublicLanding.tsx` (Codex) composes Claude's sections. Once `PageFrame` exists it should shrink to manifest-driven composition, so Codex never needs to touch section markup.

### F11 — Routing and navigation dependencies · ACCEPT WITH CHANGES

- Nav items come from the manifest (Codex) and are passed as props (Claude renders them). Remove hard-coded anchors.
- Cross-route section links use `/#contact` and `/#company`. The router handles hash-scroll and focus on arrival.
- Route change resets scroll and moves focus to `h1`. The router owner (Codex) implements this; Claude reviews.
- One trailing-slash policy, decided with prerender (ADR).

## 5. Handoff-contract assessment

### F12 — Contract mechanics · ACCEPT WITH CHANGES

The contract is strong:
- single writer per path;
- separate worktrees;
- no self-approval;
- combined-SHA validation;
- protected files untouched;
- no fixture regeneration.

Gaps:
1. **No handoff record format or location.** Proposal: `docs/website-v2/handoffs/H-<nnn>.md` using one template with these fields: base and head SHA, branch/worktree, exact files, interface versions, claim IDs, tests run, screenshots, open defects, requested reviewer, disposition. One file per handoff, append-only.
2. **No review timebox.** Proposal: the reviewer answers within one working session of receiving a packet. Silence is not acceptance, and the requester escalates to the Founder after that.
3. **Interface versioning has no home.** Put `EXPERIENCE_SPEC.md` front-matter versions for tokens and schema (`tokens@1`, `content@1`). Consumers declare the version they target in the handoff record.
4. **Codex-owned PRD contains product narrative.** Acceptable during S00. From S01, narrative and copy sections should move to Claude with the transfer recorded, while the claims ledger stays Codex-owned for provenance.

### F13 — Accessibility and responsive · ACCEPT WITH CHANGES

Add to the PRD quality acceptance:
- **320 CSS px reflow / 400 % zoom** (WCAG 1.4.10). The current list starts at 390.
- **200 % text resize** without loss (1.4.4).
- **Target size ≥24×24 px** (2.5.8).
- **Focus not obscured** by the sticky header (2.4.11).
- **Non-text contrast ≥3:1** for focus rings and status icons (1.4.11).
- **Status not by colour alone** (1.4.1), and text alternatives for every diagram and synthetic visual.

Keep "target WCAG 2.2 AA with documented manual review", which is correctly not a compliance claim.

### F14 — Security isolation and synthetic demonstrations · ACCEPT WITH CHANGES

Isolation direction is right: no private imports, auth client, fetch or tenant data. Bring the full entry-graph import test (ADR integrity step 4) forward to **S02 entry**, not S04, because S02 is when new components appear.

Synthetic-demo rules to add to the PRD:
1. A synthetic visual is a coded illustration (HTML/SVG) with a visible in-frame caption ("Illustration · synthetic data"). Never a screenshot of a running system.
2. Use obviously fictional names and identifiers. No real UAE business names, no realistic phone, IBAN, card or email patterns, and no real product SKUs.
3. Use amounts only when structurally necessary, rounded, and in a currency format that makes no performance claim.
4. No third-party logos (Shopify, WooCommerce, Zoho, payment providers) until an integration is LIVE and permission-cleared (C11).
5. Synthetic states never show live-looking indicators ("Connected", green "Live" dots) for unshipped capabilities.

### F15 — SEO / 404 / prerender · ACCEPT

The prerender-on-Vite direction is right and proportionate. One timing recommendation: the Founder decision on the narrow `src/app.js` static-fallback exception (V2-306B) should be taken **before S03**, not at release. With three routes, soft-404 on mistyped URLs becomes a visible quality issue. If the exception is refused, S03 can design around it (for example a client-rendered not-found view with noindex) instead of discovering the limitation at G4.

## 6. Documentation corrections

### F16 — Custom-domain wording · ACCEPT WITH CHANGES

`BASELINE_AUDIT.md` and `RISKS_AND_RELEASE_GATES.md` describe the custom domain as "connection refused … does not establish … DNS cause". The cause is established and intentional:
- the DNS cutover has not been authorized;
- the apex still resolves to registrar parking `165.22.30.248`, which serves HTTP 200 but no HTTPS;
- Railway ownership verification is complete (both domains verified=true on 2026-10-21);
- AEServer supports an apex ALIAS.

Suggested replacement: "Custom domain not yet cut over (separate Founder gate CT-WEB-LIVE-01 GO DNS CUTOVER). Ownership verified in Railway; routing records pending." Severity stays High for canonical release; the risk is a gate, not an unknown fault.

### F17 — Asset caching · ACCEPT

Verified independently (300 s on hashed assets). It is not an availability issue. A fix needs a protected `src/app.js` change, so record it as a candidate for the same reviewed exception window as F15 rather than a separate one.

### F18 — Estimate and sequencing · ACCEPT WITH CHANGES

The 12–19 day range is plausible. Two adjustments:
- dual-agent review adds latency, so budget about 0.5 day per handoff cycle explicitly;
- F08 (the V2-201 owner) and F05 (the vocabulary) are on the critical path into S01 and S02.

## 7. Risks and unresolved decisions

| ID | Decision / risk | Owner | Needed by |
|---|---|---|---|
| D1 | Home CTA priority: project-first (recommended) vs product-first | Founder | S01 (V2-103) |
| D2 | Accent token: keep cyan #00D7FF vs adopt #60A5FA; approve token mapping | Founder | S01 (V2-105) |
| D3 | Intent prefill wording (mailto subject, WhatsApp text); design-partner offer wording without access/date promises | Founder | S01 (V2-106) |
| D4 | Tres Leches permission (factual, brand, images); otherwise approve the fallback composition | Founder | S01 for planning, S02 for build |
| D5 | Ban "enterprise" (and other unsupported superlatives) in public copy | Founder | S01 (V2-104) |
| D6 | Timing of the narrow `src/app.js` exception (404 plus asset cache) | Founder / CTO | Before S03 |
| D7 | V2-201 owner (F08 option a or b) | Codex + Claude, recorded | Before S02 |
| R1 | Homepage loses its only proof section if case permission is denied | Claude | S01 fallback plan |
| R2 | Synthetic visuals read as live product | Claude + Codex review | Every UI PR (F14 rules) |
| R3 | Copy drift from ledger after approval | Codex test (F09) | S02 |

## 8. Sprint 01 readiness recommendation

**READY WITH CONDITIONS.**

Sprint 01 (strategy, narrative, tokens, schema, experience spec; no UI implementation) can be authorized once Codex has published dispositions for at least **F05, F08, F09 and F16** against an exact SHA. D1–D5 are Sprint 01 inputs the Founder can decide during the sprint. They do not block its start.

**No BLOCKED finding prevents S01.** The only BLOCKED item is the use of "enterprise" in public copy, which is a content rule, not a sprint gate.

Not authorized by this review: Sprint 01 start, any code or token implementation, protected-file changes, merge, deployment or DNS change.
