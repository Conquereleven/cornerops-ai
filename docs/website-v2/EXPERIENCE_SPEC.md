---
document: CornerTech AI Website 2.1 — Experience specification
tickets: V2-101, V2-102, V2-103, V2-104 (proposal side), V2-105, V2-106
tokensVersion: tokens@1
contentVersion: content@1
status: PROPOSED — DRAFT, NOT APPROVED FOR PUBLICATION
author: Claude Code (Product Experience Lead, engineering contributor)
reviewer: Codex (Engineering Lead / Integration DRI) — independent review pending
approver: Founder — publication, claims, D1–D7 pending
common base: ccda922831de68efb0eb1ea0cf1490bded101964
branch / worktree: feature/ct-web-v2-s01-experience · work/cornerops-v2-s01-claude
companion artifact: docs/website-v2/sprint-01/experience-preview.html
date: 2026-10-23
---

# Experience specification — Website 2.1, Sprint 01

> **Every piece of copy, every colour value and every component contract in this document is a proposal.** Proposed copy in this document is not approved copy. Nothing here authorizes publication, implementation, merge, deployment, DNS, contact-channel changes or any claim. The Founder approves publication per claim (exact text, status and version). Codex reviews this contribution independently; this document does not approve itself.

## 0. Ownership contract — accepted

I accept the Sprint 01 ownership contract as assigned:

| Path | Single writer | Reviewer |
|---|---|---|
| `docs/website-v2/EXPERIENCE_SPEC.md` (this file) | Claude Code | Codex |
| `docs/website-v2/sprint-01/experience-preview.html` | Claude Code | Codex (captures screenshots and reviews) |
| Every other `docs/website-v2/*` file (PRD, ledger, backlog, ADR, risks, contract, dispositions, baseline, evidence JSON) | Codex | Claude Code proposes changes in writing only |
| `frontend/src/**`, protected files, security tests/fixtures, packages/locks, deployment config | **No writer in Sprint 01** | — |

Consequences I hold myself to in this sprint:
- I commit only the two files above. Where this spec needs a change in a Codex-owned document (for example ledger rows for new claims or the PRD copy section), it lists the change as a **request to Codex** (§13) and does not make it.
- File paths and component names in §11 are **proposals for the Sprint 02 handoff record**; no file is created by this spec.
- `tokens@1` and `content@1` are declared here, as CODEX_CLAUDE_HANDOFF_CONTRACT.md §"Versioned interfaces" requires. Consumers declare the version they target in their handoff record.

Inputs read in full: PRODUCT_WEBSITE_PRD_V2.md, PUBLIC_CLAIMS_LEDGER.md, SPRINT_V2_BACKLOG.md, CROSS_REVIEW_DISPOSITIONS.md, CODEX_CLAUDE_HANDOFF_CONTRACT.md, WEBSITE_V2_ARCHITECTURE_ADR.md, RISKS_AND_RELEASE_GATES.md, BASELINE_AUDIT.md, CLAUDE_S00_FINDINGS.md. Brand inputs inspected (read only): `frontend/src/styles/cornertech.css`, `frontend/src/components/public/CornerTechSite.tsx`, `frontend/src/config/publicContent.ts`, `frontend/src/config/siteConfig.ts`, `frontend/public/brand/*`, `docs/evidence/ct-web-live-02/README.md`, `design-qa.md`. Sprint 00 audits are not repeated.

---

## 1. V2-101 — Manifesto, positioning and roles

### 1.1 Manifesto (proposed internal brief — not public copy until approved)

> Most operations do not run on one system. They run on chat threads, spreadsheets, a payment link, someone's memory and a tool that almost fits.
>
> CornerTech AI builds the software that sits underneath that work. We start with how the operation actually runs — who takes the order, where it gets re-typed, which exception nobody owns — and engineer from there.
>
> We use AI where it removes routine effort, and we keep consequential actions under clear human control. We connect the tools a team already uses before asking it to adopt new ones. We ship working software and hand it over clearly.
>
> And we say plainly what is ready and what is still being built. Our flagship product, CornerTech Commerce, is in development. Our engineering services are available now. We will not blur the two.

### 1.2 Positioning statement (proposed)

For **operators in the UAE and GCC** whose work runs across disconnected tools and chat threads, **CornerTech AI** is a **software engineering company** that designs, builds and integrates the systems they run on. Unlike generic agencies or off-the-shelf platforms, we **engineer around the real workflow, keep consequential actions under human control, and are explicit about what is shipped and what is still in development.**

Design thesis carried forward from S00 (F03): **Precision Intelligence** — show structure, not magic. Named system roles, maturity labels in text, Geist for prose and Geist Mono for labels and data, one accent per view, finite state-explaining motion.

Proposed tagline (D5 preferred phrase, PROPOSED): **"Software built for real operations."**

### 1.3 Roles of company, product and services

| Entity | Role on the site | Public status | Claim | Rule |
|---|---|---|---|---|
| CornerTech AI | Parent software engineering company; the voice of the site | — (company, not a capability) | C01, C18 | No certification, IP-diligence, team-size or office claims without Founder evidence |
| CornerTech Commerce | Flagship product; visually prominent, never the primary conversion | **In development** (umbrella); individual capabilities per §6 | C07–C12, C20 | Never "available", "launch", "buy", pricing, dates or login |
| Custom Engineering | Available service | **Available** | C02, C05 | Scoped per engagement; no outcome/SLA/scale guarantees |
| AI Automation | Available service | **Available** | C02, C04 | Human control of consequential actions stated; no autonomy claims about Commerce |
| Systems Integration | Available service | **Available** | C02, C06 | No named connector or compatibility promise; no provider logos |
| Command Center | Internal system | Omitted from public hierarchy | C13 | Not mentioned on initial pages |
| Labs | Research proposal | Omitted from initial pages | C19 | Only with explicit "Research" label after Founder approval |
| Tres Leches case | Permission-gated | Omitted (D4) | C14, C15 | Replaced by permission-independent process/principles composition |

### 1.4 Voice

- **Plain, specific, calm.** Short declaratives. Verbs over adjectives. US spelling, matching the existing site.
- **Name the work, not the magic.** "Re-typing orders between WhatsApp and a spreadsheet", not "unlock intelligent transformation".
- **Status in words.** "In development", "Planned", "Available" — never implied by colour, tense or imagery.
- **Banned in public copy (D5 policy, proposed):** enterprise-grade, enterprise-ready, certified/compliant (any standard), secure (as a blanket property), scalable/at scale, guaranteed, proven, leading, best-in-class, revolutionary, autonomous (for Commerce), "live"/"connected" for unshipped capabilities, any percentage/multiple/ROI/time-saved figure, customer counts, logos, testimonials. Not substituted with "production-grade" or "operator-grade" either (S00 disposition F02).

---

## 2. V2-102 — Audiences, jobs and objections (hypotheses)

> **These are working hypotheses, not research findings.** No interviews, surveys or analytics were conducted or consulted. Each row names the evidence that would confirm or reject it, and V2-407 (five consented prospect comprehension checks, if practical) can test it. No metric is invented.

### 2.1 Audiences

| Tier | Audience (hypothesis) | What they need to leave with | Primary path |
|---|---|---|---|
| Primary | **UAE/GCC operators** — owner-operators and operations leads in distribution, trade, logistics, hospitality and food businesses (C16 target segments, not a customer list) | "These people build software around how we work; I can start a project now; their product is coming." | Discuss a project |
| Secondary | **Engineering buyers** — heads of operations/technology needing contract engineering, automation or integration | "Credible engineering process, clear scope, honest maturity." | Solutions → Discuss a project |
| Secondary (product) | **Commerce-curious operators** — businesses whose orders run through chat and manual entry | "Commerce is being built for problems like mine; I can help shape it; I'm not being sold access." | Become a design partner |
| Tertiary | Partners, prospective talent, investors | "Who is behind this, what they focus on, how to reach them." | Company section → Contact |

### 2.2 Jobs to be done (hypotheses)

| ID | When… | I want to… | So I can… | Where answered |
|---|---|---|---|---|
| J1 | orders arrive through WhatsApp and calls | capture them in one structured place without changing how customers order | stop re-typing and losing orders | Home services; Commerce problem framing |
| J2 | my tools don't talk to each other | connect what we already use | keep context moving between teams | Solutions → Systems Integration |
| J3 | my team does the same admin every day | automate routine steps while people approve the important ones | spend time on exceptions, not data entry | Solutions → AI Automation |
| J4 | no off-the-shelf product fits | have a focused system designed and built for us | run the operation the way it actually works | Solutions → Custom Engineering |
| J5 | I'm evaluating a vendor | see how they work and what is real | decide without a sales call first | Home "How we work", status labels, Company |

### 2.3 Objections and the honest answer

| Objection (hypothesis) | Proposed answer on the site | Claim | Evidence still needed |
|---|---|---|---|
| "Can I use your product today?" | No. CornerTech Commerce is in development. Engineering services are available now. | C07, C02 | Founder approval of wording |
| "Will AI make decisions for my business?" | AI handles routine steps; consequential actions stay under clear human control. | C04, C17 | Founder approval; engagement-specific design |
| "Will you work with our existing tools?" | Integration is scoped per engagement after discovery. We don't claim pre-built connectors. | C02, C06, C11 | Per-engagement scoping; no compatibility list |
| "Have you done this before?" | We show our process and principles. Specific work is discussed only where clients have given permission. | C17, C14 | Case permission (D4) or Founder-approved reference policy |
| "Who are you / will you be around?" | Company section: what we do, where we focus, how to reach us. | C01, C18 | Legal identity, team facts — Founder evidence before any addition |
| "What does it cost?" | No published pricing. Projects are scoped after a first conversation. | C02 | Founder approval of wording; no prices |
| "Is joining as a design partner a commitment or a purchase?" | No. It is a conversation. It does not provide product access, pricing or a release date. | C20 | Founder approval of design-partner wording |

### 2.4 Validation plan (V2-407, proposed)
Five consented sessions if practical; Founder recruits. Tasks only: (1) "What does this company do?" (2) "Can you use CornerTech Commerce today?" (3) "Name the three services." (4) "What would you click to start a project?" Pass = participant answers correctly in their own words; record verbatim, no scores or conversion metrics.

---

## 3. V2-103 — Narrative hierarchy and dual CTA model

### 3.1 CTA model (implements D1 recommended default — PROPOSED)

| Intent | Label (identical everywhere) | Weight | Target |
|---|---|---|---|
| `project` | **Discuss a project** | Primary — one filled button per viewport | `/#contact` (Contact section, project card) |
| `design-partner` | **Become a design partner** | Secondary — outline button | `/#contact` (Contact section, design-partner card) |
| `explore-commerce` (navigation, not conversion) | **See what we're building** | Text link with arrow | `/products/commerce` |

Rules: never "Talk to us", "Contact us", "Get started", "Book a demo", "Request access", "Buy", "Sign up". At most one filled (primary) button per viewport, so the header CTA "Discuss a project" uses outline styling and the hero or section carries the filled one. Channel buttons (Email, WhatsApp, and "Book a call" only when a verified `bookingUrl` exists) appear only inside the Contact section, under an intent.

### 3.2 Page section order

**Home `/`** — 1 Hero (company promise + flagship card) → 2 Services trio → 3 Commerce showcase (synthetic illustration) → 4 How we work (process; permission-independent fallback for D4) → 5 Principles → 6 Who we build for (target segments, C16) → 7 Company (`#company`) → 8 Contact (`#contact`) → Footer.

**Commerce `/products/commerce`** — 1 Hero with status "In development" → 2 Problem → 3 How it is shaped (synthetic illustration) → 4 Capability status matrix (fail-closed) → 5 What "in development" means → 6 Design-partner invitation → 7 "Need something working now?" (project CTA) → Footer.

**Solutions `/solutions`** — 1 Hero (with services overview) → 2 Three services in depth → 3 How engagements run: illustrative engagement shape mapped to the five process steps (not a case) → 4 What we will and won't promise → 5 Questions → 6 Contact CTA → Footer.

---

## 4. V2-106 — Proposed English copy

> All copy below is **PROPOSED · NOT APPROVED**. Keys map to `content@1` (§9). Every block lists claim IDs. Rendered capability items additionally need per-item approval (§6); copy blocks that state facts need Founder sign-off of the block text before publication.

### 4.1 Route metadata (`RouteCopy`)

| routeId | title (≤60) | description (≤155) | h1 | Claims |
|---|---|---|---|---|
| home | CornerTech AI — Software built for real operations (50) | Software engineering for UAE and GCC operators: custom engineering, AI automation and systems integration. Building CornerTech Commerce. (136) | Software built for real operations. | C01, C02, C07, C18 |
| commerce | CornerTech Commerce — in development · CornerTech AI (52) | Our flagship operating layer for commerce orders and their exceptions. In development; design-partner conversations are open. (125) | CornerTech Commerce | C07, C10, C20 |
| solutions | Engineering services · CornerTech AI (36) | Custom engineering, AI automation and systems integration, scoped around how your operation works. Available for projects in the UAE and GCC. (141) | Engineering for the way your operation actually works. | C02, C05, C18 |

`ogTitle`/`ogDescription` omitted (consumers fall back to title/description). Character counts measured with Python `len()` on the exact strings.

### 4.2 Shared frame

| Key | Copy | Claims |
|---|---|---|
| `frame.skipLink` | Skip to content | — |
| `frame.brandLabel` | CornerTech AI home | — |
| `frame.nav` | Commerce · Solutions · Company · Contact | — |
| `frame.menuButton` | Menu / Close menu | — |
| `frame.headerCta` | Discuss a project | C02 |
| `frame.footer.statement` | CornerTech AI — software engineering for operators in the UAE and GCC. | C01, C18 |
| `frame.footer.status` | CornerTech Commerce is in development. Engineering services are available. | C07, C02 |
| `frame.footer.legal` | © 2026 CornerTech AI. (Privacy and Terms links render only when real approved URLs exist.) | C21 |

### 4.3 Home

| Key | Copy | Claims |
|---|---|---|
| `home.hero.eyebrow` | Software engineering · UAE & GCC | C01, C18 |
| `home.hero.h1` | Software built for real operations. | C01 (D5 phrase) |
| `home.hero.lede` | CornerTech AI designs, builds and integrates the systems operators run on — custom software, AI automation and connected tools, engineered around how your work actually happens. | C02, replaces C03 |
| `home.hero.primary` | Discuss a project | C02 |
| `home.hero.secondary` | See what we're building → | C07 |
| `home.flagship.label` | Flagship product | C01 |
| `home.flagship.name` | CornerTech Commerce | C07 |
| `home.flagship.status` | In development | C07 |
| `home.flagship.line` | An operating layer for commerce orders and the exceptions around them. Not yet available. | C07 |
| `home.flagship.items` | Order intake and validation — In development / Order event history — In development / Payments and storefront — Planned (capability rows: fail-closed per §6.3; if none approved, the list is omitted and the card keeps name, status and link) | C07–C10 |
| `home.services.eyebrow` | Available now | C02 |
| `home.services.h2` | Three ways we work with operators. | C02 |
| `home.services.intro` | Engineering services you can start today. Every engagement is scoped after we understand how your operation runs. | C02, C17 |
| `home.services.custom.title` | Custom Engineering | C02 |
| `home.services.custom.body` | Focused software for the workflow no product fits: operational consoles, internal tools and customer-facing ordering. | C05, C06 |
| `home.services.automation.title` | AI Automation | C02 |
| `home.services.automation.body` | AI that reads requests and prepares the routine steps, with consequential actions kept under clear human control. | C04 |
| `home.services.integration.title` | Systems Integration | C02 |
| `home.services.integration.body` | Connect the tools your team already uses so orders, records and context move without re-typing. Scoped per engagement. | C06 |
| `home.services.link` | How engagements work → (to /solutions) | C17 |
| `home.commerce.eyebrow` | Flagship · In development | C07 |
| `home.commerce.h2` | CornerTech Commerce: one place for orders and the exceptions around them. | C07 |
| `home.commerce.body` | Many operators take orders through chat, calls and spreadsheets. We're building CornerTech Commerce to bring that intake into one structured record, so a team can see what was ordered, what is waiting and what needs a person. It is in development and not yet available. | C07, C08 |
| `home.commerce.link` | See what we're building → | C07 |
| `home.commerce.visualCaption` | Illustration · synthetic data | — |
| `home.commerce.visualMeta` | Fictional names and IDs · not a running system | — |
| `home.commerce.visualAlt` | Illustration with synthetic data: a fictional chat request becomes a structured order record, its changes are recorded as events, and one order is flagged in a queue for a person to review. Each stage is labelled in development. Payments and storefront are labelled planned. | C07–C10 |
| `home.process.eyebrow` | How we work | C17 |
| `home.process.h2` | From the real bottleneck to working software. | C17 |
| `home.process.intro` | The same five steps on every engagement, whatever we build. | C17 |
| `home.process.steps` | Understand — Find the bottleneck and the people, tools and decisions around it. / Design — Define the workflow, the experience and what done looks like. / Build — Ship a focused system your team can test with real work. / Integrate — Connect the stack, agree the controls, support the handover. / Improve — Review what happens in practice and refine. | C17 |
| `home.principles.h2` | What we hold ourselves to. | C17 |
| `home.principles.items` | Systems that ship — Working software, usable workflows and a clear handover are the deliverables. / AI with a clear role — Routine work is accelerated; consequential actions stay under human control. / Your stack, connected — Build on the tools your team already uses. / Status in plain words — We say what is available, what is in development and what is planned. | C17, C04, C06, C01 |
| `home.segments.h2` | Built with operators in mind. | C16 |
| `home.segments.body` | Our focus is operations-heavy businesses in the UAE and GCC, including: | C16, C18 |
| `home.segments.items` | Logistics & trade · Distribution & commerce · Hospitality & food · Construction & infrastructure · Industry & manufacturing · Energy & field operations | C16 (target segments — not a customer list) |
| `home.company.eyebrow` | Company | C01 |
| `home.company.h2` | An engineering company, focused on the Gulf. | C01, C18 |
| `home.company.body` | CornerTech AI is a software engineering company serving operators in the UAE and GCC. We build custom systems and AI automation for clients, and we're building CornerTech Commerce as our own product. | C01, C02, C07, C18 |
| `home.company.facts` | Focus — UAE & GCC operators / Services — Available now / Flagship — In development | C18, C02, C07 |
| `home.contact.eyebrow` | Contact | C21 |
| `home.contact.h2` | Choose the conversation you want to have. | C21 |
| `home.contact.project.title` | Discuss a project | C02 |
| `home.contact.project.body` | Tell us what you're running today and where it breaks. We'll reply to scope a first conversation. | C02, C21 |
| `home.contact.partner.title` | Become a design partner | C20 |
| `home.contact.partner.body` | Help shape CornerTech Commerce. Tell us how your orders flow today. This is a conversation, not a sign-up: it does not provide product access, pricing or a release date. | C20 |
| `home.contact.channels` | Email · WhatsApp · Book a call ("Book a call" only when `siteConfig.bookingUrl` is verified and non-empty) | C21 |
| `home.contact.privacyNote` | This page has no enquiry form or first-party analytics. Email and WhatsApp have their own privacy practices. A message is sent only if you choose to send it. | C21 |

### 4.4 Commerce

| Key | Copy | Claims |
|---|---|---|
| `commerce.hero.eyebrow` | Flagship product | C01 |
| `commerce.hero.h1` | CornerTech Commerce | C07 |
| `commerce.hero.status` | In development — not yet available | C07 |
| `commerce.hero.lede` | An operating layer for commerce orders and the exceptions around them — designed for businesses whose orders arrive through chat, calls and spreadsheets. | C07 |
| `commerce.hero.primary` | Discuss a project (primary per D1; see note) | C02 |
| `commerce.hero.secondary` | Become a design partner | C20 |
| `commerce.glance.heading` | Status at a glance | C07 |
| `commerce.glance.items` | Product — In development / Customer access — Not available / Pricing — Not published / Release date — Not announced / Design partners — Conversations open | C07, C10, C20 |
| `commerce.problem.eyebrow` | The problem | C07 |
| `commerce.problem.h2` | Orders don't arrive in one place. | C07 |
| `commerce.problem.items` | An order is a chat message, then a note, then a row someone re-types. / Payment confirmation lives in a different thread from the order. / Exceptions — a missing address, a changed quantity — have no owner. / Nobody can answer "what is waiting right now?" without asking around. | C07 (problem framing, no metrics) |
| `commerce.shape.eyebrow` | How it is shaped | C07 |
| `commerce.shape.h2` | One record per order. Every change on the record. | C07, C08, C09 |
| `commerce.shape.body` | Every order becomes one canonical record. Each change to it is recorded as an event, scoped to the business it belongs to. Orders that need a person surface in one queue. | C07, C08, C09 |
| `commerce.shape.visualCaption` | Illustration · synthetic data | — |
| `commerce.shape.visualMeta` | Demo Kitchen is fictional · not a running system | — |
| `commerce.shape.stageNotes` | Arrives as free text. Nothing is re-typed. / Each change is an event, scoped to Demo Kitchen. / A person resolves it. Nothing is sent automatically. | C08, C09, C07 |
| `commerce.shape.visualAlt` | Illustration with synthetic data. Four stages: Request (a fictional chat message from "Sample Customer"), Order record ORD-DEMO-0042 with three validation checks, Event history with three fictional events, and an Exceptions queue with one item marked "Needs a person". All four stages are labelled in development. Payment status and storefront are shown separately as planned. | C07–C10 |
| `commerce.matrix.eyebrow` | Capability status | — |
| `commerce.matrix.h2` | What exists, and what doesn't yet. | C07–C12 |
| `commerce.matrix.intro` | Each capability carries its status in words. | F05/F09 |
| `commerce.matrix.items` | See §6.4 (fail-closed items) | C07–C12 |
| `commerce.meaning.h2` | What "in development" means. | C07 |
| `commerce.meaning.body` | Parts of CornerTech Commerce exist as working code under test. That is not the same as a product you can use: there is no customer access, no published pricing and no release date. When that changes, this page will say so. | C07, C08, C09, C10 |
| `commerce.partner.h2` | Shape it with us. | C20 |
| `commerce.partner.body` | We want to learn from operators whose orders arrive through chat and manual entry. Share how your orders flow today and where they break. Becoming a design partner is a conversation — not product access, a purchase or a release date. | C20 |
| `commerce.partner.cta` | Become a design partner | C20 |
| `commerce.services.h2` | Need something working now? | C02 |
| `commerce.services.body` | Our engineering services are available today — custom systems, AI automation and integration, scoped to your operation. | C02 |
| `commerce.services.cta` | Discuss a project | C02 |

Note on the Commerce hero: D1 keeps "Discuss a project" as the single filled button site-wide, so on the Commerce hero the design-partner action is the outline button next to it. If the Founder prefers the design-partner action as the filled button on this page only, that is a D1 variant to record, not a default.

### 4.5 Solutions

| Key | Copy | Claims |
|---|---|---|
| `solutions.hero.eyebrow` | Engineering services · Available now | C02 |
| `solutions.hero.h1` | Engineering for the way your operation actually works. | C02 |
| `solutions.hero.lede` | Custom engineering, AI automation and systems integration — scoped after we understand the real workflow, built with your team, and handed over clearly. | C02, C17 |
| `solutions.hero.primary` | Discuss a project | C02 |
| `solutions.hero.overview` | Services: 01 Custom Engineering · 02 AI Automation · 03 Systems Integration — each "Available" | C02 |
| `solutions.services.eyebrow` | What we do | C02 |
| `solutions.services.h2` | Three services, scoped to your operation. | C02 |
| `solutions.custom.title` | Custom Engineering | C02 |
| `solutions.custom.body` | When no product fits, we design and build the focused system you need. | C05 |
| `solutions.custom.scope` | Operational consoles and internal tools · Customer-facing ordering experiences · Data views for the decisions your team makes daily | C05, C06 |
| `solutions.automation.title` | AI Automation | C02 |
| `solutions.automation.body` | AI that reads incoming requests, prepares the routine steps and hands consequential decisions to a person. | C04 |
| `solutions.automation.scope` | Request reading and triage · Drafting routine responses and records · Human approval for consequential actions | C04, C17 |
| `solutions.integration.title` | Systems Integration | C02 |
| `solutions.integration.body` | Connect the tools you already use so records and context move without re-typing. | C06 |
| `solutions.integration.scope` | Scoped per engagement after discovery · Built on your existing tools where practical · No pre-built connector promises | C06, C11 |
| `solutions.engagement.eyebrow` | How engagements run | C17 |
| `solutions.engagement.h2` | What an engagement can look like. | C17 |
| `solutions.engagement.label` | Illustrative engagement shape — not a client case | — |
| `solutions.engagement.body` | Phases, not a promise. Timing is agreed per project. | C17 |
| `solutions.engagement.phases` | Understand: Discovery — Find the bottleneck and the people, tools and decisions around it. / Design: Design checkpoint — You approve the workflow, the experience and what done looks like. / Build: First release — A focused system your team tests with real work. / Integrate: Integration & handover — Connect the stack, agree the controls, document the handover. / Improve: Review in practice — See what happens once it runs, and refine. | C17 |
| `solutions.promise.h2` | What we will and won't promise. | C17, C22, C23 |
| `solutions.promise.will` | A clear scope before we build · Working software you can test · Human control over consequential actions · A documented handover | C17, C04 |
| `solutions.promise.wont` | Outcome guarantees or ROI figures · Certifications we don't hold · Integrations we haven't scoped · Access to products that aren't available | C22, C23, C11 |
| `solutions.faq.h2` | Before you get in touch. | — |
| `solutions.faq.items` | Do you publish prices? — No. Projects are scoped after a first conversation. / Can you work with our current tools? — That is usually where we start; feasibility is confirmed during discovery. / Can we use CornerTech Commerce? — Not yet. It is in development; you can talk to us about becoming a design partner. / Where do you work? — Our focus is the UAE and GCC. | C02, C06, C07, C18, C20 |
| `solutions.cta.h2` | Start with the bottleneck. | C02 |
| `solutions.cta.body` | Tell us where work gets re-typed, delayed or lost. We'll reply to scope a first conversation. | C02 |
| `solutions.cta.primary` | Discuss a project | C02 |

### 4.6 D3 intent prefill strings (PROPOSED, Founder approval required)

| Intent | mailto subject | WhatsApp prefill |
|---|---|---|
| project | Project enquiry — CornerTech AI | Hello CornerTech AI, I'd like to discuss a software project. |
| design-partner | CornerTech Commerce — design partner interest | Hello CornerTech AI, I'm interested in CornerTech Commerce as a design partner. |

No visitor data, identifiers, tracking parameters, access or date promises. The calendar CTA "Book a call" appears only when a verified `bookingUrl` exists (current default is empty, per commit `3c500c4`).

---

## 5. Unsupported-claims policy (V2-104 proposal side)

1. **Blocked outright (C23):** revenue/efficiency/time-saved figures, customer counts, logos, testimonials, certifications, paid plans, prices, launch dates.
2. **Blocked words** (list in §1.4) fail copy review; Codex may add a lint test over `publicContent.ts` in S02 (request §13).
3. **No customer case** on initial pages (D4). The process/principles composition replaces it.
4. **No blanket security claim.** Security may be described only as a specific practice already covered by C04/C17 wording ("consequential actions stay under human control").
5. **Source-verified ≠ available.** Code under test supports at most "In development".
6. **Synthetic visuals** follow §8.6 and never imply a running system.

---

## 6. Claim gating: evidenceLevel vs publicStatus, fail-closed approval

### 6.1 Two fields, two places

| Field | Values | Lives in | Ships in public bundle? |
|---|---|---|---|
| `evidenceLevel` | `founder-confirmed` · `source-verified` · `case-verified` · `roadmap` · `research` | Internal claim-evidence record (Codex-owned ledger data; proposed shape §9.4) | **Never** |
| `evidenceRef`, `approver`, `approvedAt`, `approvedTextSha256` | — | Internal claim-evidence record | **Never** |
| `publicStatus` | `available` · `in-development` · `planned` · `research` | Public content item | Yes, rendered as text |
| `approvalId` | opaque string, e.g. `A-C08-1` | Public content item | Yes (opaque; carries no evidence) |

Rendered labels: `available` → "Available", `in-development` → "In development", `planned` → "Planned", `research` → "Research". `VERIFIED`, `VERIFIED CASE` and `LIVE` are not values.

### 6.2 Compatibility (CI fails on violation)

| evidenceLevel | Allowed publicStatus |
|---|---|
| founder-confirmed | available, in-development, planned, research |
| source-verified | in-development, planned |
| case-verified | none — case narrative only, no capability badge; rendering as a capability fails CI |
| roadmap | planned, research |
| research | research |

### 6.3 Fail-closed rule (per capability)

A public capability renders **only if all** of the following hold at build time; otherwise it is **omitted** (no placeholder, no warning text). If every item of a section is omitted, the whole section, heading included, is omitted.
1. `claimId` exists in the ledger (unknown ID → **CI fails**).
2. An internal approval record exists for `approvalId` with approver, ISO date, approved text SHA-256 and approved status.
3. `sha256(label + "\n" + summary)` equals the approved hash (text drift → omitted; CI reports it as stale).
4. The approved status equals `publicStatus`, and `evidenceLevel` → `publicStatus` is compatible per §6.2 (incompatible → **CI fails**).
5. Required permissions (for example client permission) are recorded where applicable.
6. The approval date is not older than the ledger row's last revision (stale → omitted).

A boolean `approved: true` is not sufficient (ledger F09). The mechanism (generated allow-list of approval IDs or a build-time filter) is Codex's choice; the invariants above are the contract. Claude supplies rendering/omission tests; Codex supplies ledger-sync/approval tests.

### 6.4 Commerce capability candidates (all PENDING approval)

| id | Label (proposed) | Summary (proposed) | publicStatus | Claim | Expected evidenceLevel |
|---|---|---|---|---|---|
| order-intake | Canonical order intake | Incoming orders are validated into one canonical record. | in-development | C08 | source-verified |
| event-history | Order event history | Each change to an order is recorded as an event, scoped to its business. | in-development | C09 | source-verified |
| exceptions | Order tracking and exceptions | Orders that need a person surface in one place. | in-development | C07 | source-verified |
| storefront | Storefront | A customer-facing ordering experience. | planned | C10 | roadmap |
| payments | Payment status | Payment confirmation attached to the order it belongs to. | planned | C10 | roadmap |
| merchant-ops | Merchant operations console | A day-to-day view for the team running orders. | planned | C10 | roadmap |
| connectors | Channel connectors | Connections to commerce channels and marketplaces. No provider is named until one is available. | planned | C11 | roadmap |
| ai-assist | Supervised AI assistance | AI that prepares routine order steps for a person to approve. | planned | C12 | roadmap |

Services (`available`, C02, founder-confirmed): Custom Engineering, AI Automation, Systems Integration — text per §4.3/§4.5; each still requires its own approval record.

---

## 7. V2-105 — Design tokens (`tokens@1`)

### 7.1 Contrast calculation method

WCAG 2.x relative luminance. Each sRGB channel `c = value/255` is linearized as `c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`; `L = 0.2126R + 0.7152G + 0.0722B`; ratio `(Lhi+0.05)/(Llo+0.05)`, **truncated** (not rounded) to two decimals so 4.499 never reports as 4.50. Translucent colours are composited over the stated background before measuring. Computed on 2026-10-23 with a standalone Python script (not committed); Codex should re-derive the values with an independent implementation in the S02 contrast test. Thresholds: body text ≥ 4.5; large text (≥ 24 px regular, or ≥ 18.66 px at weight ≥ 700 — Geist 500 does not count as bold, so 24 px applies) ≥ 3.0; meaningful non-text and focus indicators ≥ 3.0.

### 7.2 Colour roles (D2 recommended default — PROPOSED)

| Token | Value | Role | Previous `--ct-*` |
|---|---|---|---|
| `--ct-color-bg` | `#070B12` Obsidian | Page background (dark) | `--ct-black` #05070B |
| `--ct-color-surface` | `#111A29` Midnight | Panels, cards | `--ct-navy` #07111F |
| `--ct-color-surface-raised` | `#18243A` | Raised elements, illustration frames | — (new) |
| `--ct-color-text` | `#F5F7FA` Pearl | Primary text on dark | (#F7F9FC inline) |
| `--ct-color-text-muted` | `#B8C8D9` Silver | Secondary text on dark **only** | `--ct-muted` #999DA3 |
| `--ct-color-text-subtle` | `#8D9DB3` | Mono labels and meta on dark | (#858B8D inline) |
| `--ct-color-action` | `#2563EB` Cobalt | Primary button fill **only** | `--ct-blue` #0066FF |
| `--ct-color-action-strong` | `#1D4ED8` | Hover/pressed fill; links and focus on light | (#075BFA inline) |
| `--ct-color-on-action` | `#F5F7FA` | Text on action fills | white |
| `--ct-color-accent` | `#00D7FF` Cyan (preserved) | Links on dark, focus ring on dark, data highlight | `--ct-cyan` #00D7FF |
| `--ct-color-border-strong` | `#6B7B93` | Boundaries of interactive controls on dark | — |
| `--ct-color-rule` | `rgba(184,200,217,.14)` | Decorative hairlines (exempt from 1.4.11) | `--ct-rule` |
| `--ct-color-bg-inverse` | `#F5F7FA` Pearl | Light sections | `--ct-light` #F5F5F0 |
| `--ct-color-surface-inverse` | `#E6EBF2` | Panels inside light sections | — |
| `--ct-color-text-inverse` | `#070B12` | Text on light | (#080B0C inline) |
| `--ct-color-text-inverse-muted` | `#4A5568` | Secondary text on light | (#646963 in `.ct-light`) |
| `--ct-color-border-inverse` | `#7A8699` | Control boundaries on light | — |
| `--ct-status-available` | `#34D399` | Icon tint only; label text keeps the text colour | — |
| `--ct-status-in-development` | `#F5B83D` | Icon tint only | — |
| `--ct-status-planned` | `#B8C8D9` | Icon tint only | — |
| `--ct-status-research` | `#A5B4FC` | Icon tint only | — |
| `--ct-color-draft` | `#F5B83D` | Review-only DRAFT banner fill (never in production) | — |

Status meaning is carried by **text plus shape**: Available = filled square; In development = half-filled circle; Planned = hollow circle; Research = dashed circle. Tint is secondary.

### 7.3 Semantic contrast pairs (numeric)

| # | Foreground → background | Ratio | Use | Requirement | Result |
|---|---|---|---|---|---|
| P1 | text #F5F7FA → bg #070B12 | 18.36 | Body, headings | 4.5 | Pass |
| P2 | text → surface #111A29 | 16.25 | Card text | 4.5 | Pass |
| P3 | text → surface-raised #18243A | 14.46 | Illustration text | 4.5 | Pass |
| P4 | text-muted #B8C8D9 → bg | 11.54 | Secondary prose | 4.5 | Pass |
| P5 | text-muted → surface | 10.22 | Card secondary | 4.5 | Pass |
| P6 | text-muted → surface-raised | 9.09 | Illustration secondary | 4.5 | Pass |
| P7 | text-subtle #8D9DB3 → bg | 7.13 | Mono labels | 4.5 | Pass |
| P8 | text-subtle → surface | 6.31 | Mono labels in cards | 4.5 | Pass |
| P9 | text-subtle → surface-raised | 5.62 | Mono labels in illustrations | 4.5 | Pass |
| P10 | accent #00D7FF → bg | 11.41 | Links, focus ring | 4.5 / 3.0 | Pass |
| P11 | accent → surface | 10.10 | Links/focus on cards | 4.5 / 3.0 | Pass |
| P12 | accent → surface-raised | 8.99 | Highlight in illustration | 4.5 / 3.0 | Pass |
| P13 | on-action #F5F7FA → action #2563EB | 4.81 | Primary button label (16 px / 500) | 4.5 | Pass |
| P14 | on-action → action-strong #1D4ED8 | 6.24 | Hover/pressed label | 4.5 | Pass |
| P15 | action #2563EB → bg | 3.81 | Button boundary vs page | 3.0 non-text | Pass (non-text only) |
| P16 | action → surface | 3.37 | Button boundary vs card | 3.0 non-text | Pass (non-text only) |
| P17 | border-strong #6B7B93 → bg | 4.57 | Secondary button/menu boundary | 3.0 | Pass |
| P18 | border-strong → surface | 4.05 | Control boundary on card | 3.0 | Pass |
| P19 | border-strong → surface-raised | 3.60 | Control boundary in illustration | 3.0 | Pass |
| P20 | text-inverse #070B12 → bg-inverse #F5F7FA | 18.36 | Light-section text | 4.5 | Pass |
| P21 | text-inverse → surface-inverse #E6EBF2 | 16.45 | Light panel text | 4.5 | Pass |
| P22 | text-inverse-muted #4A5568 → bg-inverse | 7.01 | Light secondary | 4.5 | Pass |
| P23 | text-inverse-muted → surface-inverse | 6.28 | Light panel secondary | 4.5 | Pass |
| P24 | action-strong #1D4ED8 → bg-inverse | 6.24 | Links and focus ring on light | 4.5 / 3.0 | Pass |
| P25 | action-strong → surface-inverse | 5.59 | Links and focus on light panel | 4.5 / 3.0 | Pass |
| P26 | action #2563EB → bg-inverse | 4.81 | Button boundary on light | 3.0 | Pass |
| P27 | border-inverse #7A8699 → bg-inverse | 3.43 | Control boundary on light | 3.0 | Pass |
| P28 | border-inverse → surface-inverse | 3.07 | Control boundary on light panel | 3.0 | Pass (narrow margin — prefer bg-inverse) |
| P29 | status-available #34D399 → surface | 9.07 | Status icon | 3.0 | Pass |
| P30 | status-in-development #F5B83D → surface | 9.80 | Status icon | 3.0 | Pass |
| P31 | status-planned #B8C8D9 → surface | 10.22 | Status icon | 3.0 | Pass |
| P32 | status-research #A5B4FC → surface | 8.75 | Status icon | 3.0 | Pass |
| P33 | bg #070B12 → draft #F5B83D | 11.07 | Review DRAFT banner | 4.5 | Pass |

**Forbidden pairs (they fail; tests must assert they are never used for text):**

| Pair | Ratio | Rule |
|---|---|---|
| action #2563EB text → bg / surface | 3.81 / 3.37 | No cobalt text on dark |
| text-muted #B8C8D9 → bg-inverse | 1.59 | No silver on pearl |
| accent #00D7FF → bg-inverse | 1.60 | No cyan on light; use action-strong |
| accent #00D7FF → action #2563EB | 2.99 | No cyan text or ring directly on cobalt; the focus ring's 2 px offset keeps it on the page background (P10/P11) |
| border tokens → any background | — | Border tokens are never text colours |

Legacy reference (current V1, for migration review): #0066FF on #05070B 4.17; #00D7FF on #05070B 11.67; #999DA3 on #05070B 7.39; #646963 on #F5F5F0 5.13.

### 7.4 Alias mapping (one-release compatibility)

| Old | New | Value change |
|---|---|---|
| `--ct-black` | `--ct-color-bg` | #05070B → #070B12 |
| `--ct-navy` | `--ct-color-surface` | #07111F → #111A29 |
| `--ct-blue` | `--ct-color-action` | #0066FF → #2563EB |
| `--ct-cyan` | `--ct-color-accent` | unchanged |
| `--ct-light` | `--ct-color-bg-inverse` | #F5F5F0 → #F5F7FA |
| `--ct-muted` | `--ct-color-text-muted` (dark) / `--ct-color-text-inverse-muted` inside `.ct-light` | #999DA3 → #B8C8D9; #646963 → #4A5568 |
| `--ct-rule` | `--ct-color-rule` | #FFFFFF12 → rgba(184,200,217,.14) |

Old names alias the new ones for one release inside `.ct-site` in `cornertech.css`; they are removed only after a consumer audit. `globals.css` stays untouched.

### 7.5 Typography

Fonts: **Geist** 400 (`/brand/geist.ttf`) and 500 (`/brand/geist-medium.ttf`); **Geist Mono** 400 (`/brand/geist-mono.ttf`). OFL licences are already in `frontend/public/brand`. No other weights or families, no external font hosts. `font-display: swap`. Fallbacks: `Geist, ui-sans-serif, system-ui, sans-serif` / `"Geist Mono", ui-monospace, monospace`.

Geist for all prose and headings. Geist Mono only for eyebrows, labels, status, IDs and tabular data (`font-variant-numeric: tabular-nums`). Headings use Geist 400 with negative tracking (identity carried from V1); weight 500 for buttons, card titles and the wordmark.

| Token | Value (min @320 → max @1440) | Line-height | Tracking | Use |
|---|---|---|---|---|
| `--ct-type-display` | `clamp(2.5rem, 1.6rem + 4.5vw, 5.5rem)` 40 → 88 px | 0.98 | −0.05em | Home h1 |
| `--ct-type-h1` | `clamp(2.25rem, 1.65rem + 3vw, 4.5rem)` 36 → 72 px | 1.02 | −0.045em | Route h1 |
| `--ct-type-h2` | `clamp(1.75rem, 1.35rem + 2vw, 3.25rem)` 28 → 52 px | 1.08 | −0.035em | Section h2 |
| `--ct-type-h3` | `clamp(1.25rem, 1.15rem + .5vw, 1.625rem)` 20 → 26 px | 1.2 | −0.02em | Card titles |
| `--ct-type-lede` | `clamp(1.125rem, 1.05rem + .4vw, 1.375rem)` 18 → 22 px | 1.5 | −0.01em | Lede |
| `--ct-type-body` | `1rem` 16 px | 1.6 | 0 | Body |
| `--ct-type-small` | `0.875rem` 14 px | 1.5 | 0 | Notes, footer |
| `--ct-type-label` | `0.75rem` 12 px, Geist Mono, uppercase | 1.4 | 0.12em | Eyebrows, status |

Rules: every clamp has rem-based min and max with max/min ≤ 2.5, so browser text resize to 200 % still scales; prose measure ≤ 68ch; no text below 12 px (V1 used 10 px labels — raised for legibility); no `px` font sizes in components.

### 7.6 Spacing, grid, radius

Spacing (4 px base, rem): `--ct-space-1` .25 · `-2` .5 · `-3` .75 · `-4` 1 · `-5` 1.5 · `-6` 2 · `-7` 3 · `-8` 4 · `-9` 6 · `-10` 8 rem. Section block padding `clamp(4rem, 2.5rem + 6vw, 8rem)`.

| Range | Columns | Gutter | Outer margin | Max content |
|---|---|---|---|---|
| < 600 px (designed at 390; supports 319/320) | 4 | 16 px | 20 px (16 px at ≤ 359 px) | fluid |
| 600–1023 px (designed at 768) | 8 | 24 px | 40 px | fluid |
| ≥ 1024 px (designed at 1440) | 12 | 24 px | 64 px | 1280 px |

Radius: `--ct-radius-1` 4 px (buttons — carried from V1), `--ct-radius-2` 8 px (cards), `--ct-radius-3` 12 px (illustration frames). No pill shapes except status chips.

### 7.7 Motion

`--ct-motion-fast` 150 ms, `--ct-motion-base` 240 ms, `--ct-motion-slow` 400 ms (maximum). Easing `--ct-ease: cubic-bezier(.2,0,0,1)`. Allowed: hover/press colour, menu disclosure, and a one-time illustration stage reveal (opacity + 8 px translate, staggered, ≤ 400 ms total) that explains sequence. Forbidden: loops, parallax, particle fields, scroll-jacking, auto-advancing content, glows. `@media (prefers-reduced-motion: reduce)` sets all durations to `0ms`, disables smooth scrolling and shows final states immediately. No content is reachable only through animation.

### 7.8 Focus

- `:focus-visible` outline 2 px solid `--ct-color-accent` (dark) / `--ct-color-action-strong` (light), `outline-offset: 2px`, never removed. Ring vs adjacent background is ≥ 5.59 (P10/P11/P24/P25).
- Programmatic focus targets (h1, section headings with `tabindex="-1"`) show no ring unless keyboard-reached, and must still scroll clear of the header.
- **Not obscured (2.4.11):** `html { scroll-padding-top: calc(var(--ct-header-h) + 1rem) }` with a 64 px header; the sticky header never covers a focused element; the mobile menu pushes content instead of overlaying it.

### 7.9 Targets, reflow and resize

- Buttons and the menu toggle ≥ 44 × 44 px; nav links ≥ 44 px tall below 1024 px and ≥ 32 px at 1024 px and above; footer links ≥ 24 px tall with ≥ 8 px spacing. Inline links in prose use the WCAG 2.5.8 inline exception.
- **320 px reflow (1.4.10) / 400 % zoom equivalent:** no horizontal document scroll at 320 CSS px; content reflows to one column; illustrations reflow to a vertical stage list instead of scaling below legibility.
- **319 px — current public V1 observation:** CT-WEB-LIVE-02 production acceptance at merge `4894c5b` (`outputs/CT-WEB-LIVE-02/POST_DEPLOYMENT_REPORT.md`) found no overflow at measured CSS widths 341 and 931 px, but the default browser's **319 px viewport reported overflow** on the public Website 1.0; that hotfix changed no layout CSS and records it as an open narrow-viewport follow-up, not a resolved responsive audit. It is not claimed fixed in public V1. (The older private-dashboard note in `design-qa.md` is a separate, earlier observation and is not this evidence.) V2 rule: no fixed `min-width` at or above 320 px; `document.documentElement.scrollWidth ≤ clientWidth` at **319 and 320** as explicit S02 regression checks, recorded in S02/S04 QA alongside 390/430/768/1024/1280/1440.
- **200 % text resize (1.4.4):** all type and spacing in rem; no fixed-height text containers; buttons grow with their text; verified with browser text-only zoom (Firefox) and full zoom (Chromium/WebKit).
- Long strings: `overflow-wrap: anywhere` on headings and IDs (e.g. `ORD-DEMO-0042`).

### 7.10 `tokens@1` schema and sample record

```ts
// tokens@1 — provider: Claude (EXPERIENCE_SPEC + cornertech.css). Consumers declare `tokens@1`.
interface TokensV1 {
  tokensVersion: 'tokens@1';
  scope: '.ct-site';
  color: Record<ColorRole, { value: string; surface: 'dark' | 'light' | 'any'; use: string }>;
  contrastPairs: Array<{ id: `P${number}`; fg: ColorRole; bg: ColorRole; ratio: number; requirement: 4.5 | 3; kind: 'text' | 'large-text' | 'non-text' }>;
  forbiddenTextPairs: Array<{ fg: ColorRole; bg: ColorRole; ratio: number }>;
  type: Record<'display' | 'h1' | 'h2' | 'h3' | 'lede' | 'body' | 'small' | 'label', { size: string; lineHeight: number; tracking: string; family: 'Geist' | 'Geist Mono'; weight: 400 | 500 }>;
  space: Record<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10', string>;
  grid: Array<{ minWidth: number; columns: 4 | 8 | 12; gutter: number; margin: number; maxContent?: number }>;
  motion: { fast: string; base: string; slow: string; ease: string; reducedMotion: '0ms' };
  focus: { width: '2px'; offset: '2px'; darkColor: 'accent'; lightColor: 'action-strong' };
  aliases: Record<string, string>; // old --ct-* → new --ct-color-*, retained for one release
}
```

```json
{
  "tokensVersion": "tokens@1",
  "scope": ".ct-site",
  "color": {
    "bg": { "value": "#070B12", "surface": "dark", "use": "page background" },
    "action": { "value": "#2563EB", "surface": "any", "use": "primary fill only" },
    "accent": { "value": "#00D7FF", "surface": "dark", "use": "links, focus, highlight on dark" }
  },
  "contrastPairs": [
    { "id": "P13", "fg": "on-action", "bg": "action", "ratio": 4.81, "requirement": 4.5, "kind": "text" },
    { "id": "P17", "fg": "border-strong", "bg": "bg", "ratio": 4.57, "requirement": 3, "kind": "non-text" }
  ],
  "forbiddenTextPairs": [{ "fg": "action", "bg": "bg", "ratio": 3.81 }],
  "motion": { "fast": "150ms", "base": "240ms", "slow": "400ms", "ease": "cubic-bezier(.2,0,0,1)", "reducedMotion": "0ms" },
  "focus": { "width": "2px", "offset": "2px", "darkColor": "accent", "lightColor": "action-strong" },
  "aliases": { "--ct-black": "--ct-color-bg", "--ct-blue": "--ct-color-action", "--ct-cyan": "--ct-color-accent" }
}
```

Compatibility: an additive role is `tokens@1.x` (minor); a rename, removal, or value change that breaks a recorded pair is `tokens@2`, with before/after examples and migration tests.

---

## 8. Navigation, hash and focus behaviour

Owner split (contract): Codex implements router scroll/focus/history; Claude renders frame and nav from props and reviews keyboard experience. This section is the experience requirement both test against.

### 8.1 Navigation items (from Codex manifest)

| Label | href | Notes |
|---|---|---|
| Commerce | `/products/commerce` | `aria-current="page"` on that route |
| Solutions | `/solutions` | `aria-current="page"` on that route |
| Company | `/#company` | Home section |
| Contact | `/#contact` | Home section |
| Header CTA "Discuss a project" | `/#contact` | Outline styling (one filled primary per viewport, §3.1); filled inside the mobile menu panel |
| Brand "CornerTech AI home" | `/` | Mark `alt=""`; accessible name on the link |

No hard-coded same-page anchors in components; on Home the same `/#…` hrefs work as in-page links.

### 8.2 Header and mobile menu

- ≥ 1024 px: inline nav + CTA. Below 1024 px: brand, CTA (≥ 600 px only) and a **Menu** button (`aria-expanded`, `aria-controls="site-menu"`, label toggles Menu/Close menu).
- The menu is a **disclosure**, not a modal: it expands below the header in document flow (no focus trap, no scroll lock). Escape closes it and returns focus to the toggle. Activating a link closes it. Resizing to ≥ 1024 px closes it. Tab order: toggle → menu links → CTA → page.
- Sticky header is 64 px and does not change height on scroll (this removes the V1 62 → 58 px shift that complicates scroll offsets).

### 8.3 Route change (PUSH)
1. Scroll to top instantly. 2. Update `document.title` from `RouteCopy.title`. 3. Move focus to the route's `h1` (`tabindex="-1"`, `preventScroll: true`). 4. Close the mobile menu.

### 8.4 Hash arrival (`/#company`, `/#contact`)
- **Same page (Home):** scroll the target section to the `scroll-padding-top` offset (smooth unless reduced motion), push a history entry, and focus the section's `h2` (`tabindex="-1"`).
- **From another route, or on direct load/refresh:** render Home, wait for hydration and layout, then scroll instantly to the target and focus its `h2`. If the hash matches no section: stay at the top, focus `h1`, no error.
- Only hashes listed in the manifest are honoured; others are ignored.

### 8.5 Back/forward (POP)
Restore the saved scroll position for that history entry (`history.scrollRestoration = 'manual'` with positions keyed by entry). Do not jump focus to `h1`; move focus to `main` with `preventScroll: true` so assistive technology has context. If there is no saved position, behave as PUSH (§8.3) or hash arrival (§8.4).

### 8.6 Synthetic illustration rules (F14)
Coded HTML/SVG only; visible in-frame caption **"Illustration · synthetic data"**; `role="img"` plus a text alternative (or a visually hidden equivalent list); fictional IDs (`ORD-DEMO-…`, "Demo Kitchen", "Sample Customer"); no real businesses, SKUs, or phone/email/card/IBAN patterns; amounts only when structurally needed and rounded (e.g. "AED 100"); no provider logos; no "Live", "Connected" or pulsing indicators; each stage labelled with its publicStatus in text.

### 8.7 Landmarks
Skip link "Skip to content" → `main#main` (`tabindex="-1"`); `header`; `nav aria-label="Primary"`; `main`; `footer` with `nav aria-label="Footer"`; exactly one `h1` per route; headings strictly nested.

---

## 9. `content@1` schema

### 9.1 Public types (Claude-owned `frontend/src/config/publicContent.ts`, proposed)

```ts
export const contentVersion = 'content@1' as const;
export type RouteId = 'home' | 'commerce' | 'solutions';
export type PublicStatus = 'available' | 'in-development' | 'planned' | 'research';
export type CtaIntent = 'project' | 'design-partner';
export type ClaimId = `C${number}`;

export interface RouteCopy {          // consumed by Codex PublicRouteManifest by routeId
  routeId: RouteId;
  title: string;                       // ≤ 60 chars
  description: string;                 // ≤ 155 chars
  h1: string;
  ogTitle?: string;                    // omitted → consumers use title
  ogDescription?: string;              // omitted → consumers use description
  claimIds: ClaimId[];
}

export interface PublicCapability {    // public bundle: NO evidenceLevel/evidenceRef/approver
  id: string;
  claimId: ClaimId;
  approvalId: string;                  // opaque; resolved only by the build/test gate
  label: string;
  summary: string;
  publicStatus: PublicStatus;          // rendered as text + shape
}

export interface Cta {
  intent: CtaIntent | 'explore-commerce';
  label: string;
  target: { kind: 'route'; routeId: RouteId; hash?: 'company' | 'contact' };
}

export interface ContactIntentCopy {   // D3 strings; Codex builds URLs from siteConfig
  intent: CtaIntent;
  title: string;
  body: string;
  mailtoSubject: string;
  whatsappText: string;
  claimIds: ClaimId[];
}

export interface SyntheticVisualCopy {
  synthetic: true;                     // literal
  caption: 'Illustration · synthetic data';
  description: string;                 // text alternative
  stages: Array<{ label: string; publicStatus: PublicStatus; detail: string }>;
}
```

### 9.2 Sample public records

```json
{
  "contentVersion": "content@1",
  "routes": {
    "commerce": {
      "routeId": "commerce",
      "title": "CornerTech Commerce — in development · CornerTech AI",
      "description": "Our flagship operating layer for commerce orders and their exceptions. In development; design-partner conversations are open.",
      "h1": "CornerTech Commerce",
      "claimIds": ["C07", "C10", "C20"]
    }
  },
  "commerceCapabilities": [
    {
      "id": "order-intake",
      "claimId": "C08",
      "approvalId": "A-C08-1",
      "label": "Canonical order intake",
      "summary": "Incoming orders are validated into one canonical record.",
      "publicStatus": "in-development"
    }
  ],
  "contactIntents": [
    {
      "intent": "design-partner",
      "title": "Become a design partner",
      "body": "Help shape CornerTech Commerce. Tell us how your orders flow today. This is a conversation, not a sign-up: it does not provide product access, pricing or a release date.",
      "mailtoSubject": "CornerTech Commerce — design partner interest",
      "whatsappText": "Hello CornerTech AI, I'm interested in CornerTech Commerce as a design partner.",
      "claimIds": ["C20"]
    }
  ]
}
```

### 9.3 Resolved contact channel (Codex-owned resolver output, consumed as props)

```ts
export interface ContactChannel { channel: 'email' | 'whatsapp' | 'calendar'; label: string; href: string; external: boolean }
// The calendar entry exists only when siteConfig.bookingUrl is a verified, non-empty https URL.
// A missing channel omits that button; an intent with zero channels is omitted.
```

### 9.4 Internal claim-evidence record (proposed shape for Codex; never imported by the public entry graph)

```json
{
  "approvalId": "A-C08-1",
  "claimId": "C08",
  "evidenceLevel": "source-verified",
  "evidenceRef": "CanonicalOrderIntakeService + commerceOsOrderIntake tests @ <SHA>",
  "approvedStatus": "in-development",
  "approvedTextSha256": "<sha256 of label + \"\\n\" + summary>",
  "approver": "Founder",
  "approvedAt": "YYYY-MM-DD",
  "permissions": [],
  "ledgerRevision": "YYYY-MM-DD"
}
```
No such record exists yet, so under the fail-closed rule every capability is omitted until the Founder approves it.

### 9.5 Exact separation statement
`evidenceLevel`, `evidenceRef`, `approver`, `approvedAt` and hashes exist **only** in internal records consumed by the build/test gate. The public bundle contains `publicStatus` (rendered as text) and an opaque `approvalId`. A test (Codex, S02) scans the built JS/HTML for the strings `evidenceLevel`, `source-verified`, `founder-confirmed`, `case-verified` and `evidenceRef`, and fails if any appear.

Versioning: an additive optional field is `content@1.x` with omission behaviour documented; a renamed, removed or retyped field is `content@2`, with before/after samples and consumer tests.

---

## 10. Responsive composition targets

Design targets are 390 / 768 / 1440 (reviewable in `sprint-01/experience-preview.html`); 319 / 320 / 430 / 1024 / 1280 are supported.

| Element | 390 (4 col) | 768 (8 col) | 1440 (12 col) |
|---|---|---|---|
| Header | Brand + Menu (CTA inside menu) | Brand + CTA + Menu | Brand + 4 nav items + CTA |
| Home hero | Stacked: eyebrow, h1, lede, primary + text link, flagship card full width | Larger h1; flagship card below | 7/5 split: copy left, flagship card right |
| Services trio | 1 column | 2 + 1 | 3 columns |
| Commerce illustration | Vertical stage list | 2 × 2 | 4 stages in a row |
| Capability matrix | Stacked rows: label, status, summary | 3-column table | 3-column table |
| Process | Vertical numbered list | 2 columns | 5 columns |
| Contact intents | Stacked cards | 2 columns | 2 columns |

---

## 11. Component prop boundaries (proposed for the S02 handoff — no files created)

All in `frontend/src/components/public/`. Deterministic presentation, typed props, no fetch, no private/auth/API imports, no `siteConfig` reads in leaves (CTA URLs arrive resolved), no route side-effects in leaves.

| Component | Props | Boundary notes |
|---|---|---|
| `PageFrame` | `{ routeId: RouteId; navItems: NavItem[]; headerCta: Cta; footer: FooterCopy; children }` | Skip link, landmarks, `main#main`; no routing logic |
| `SiteHeader` | `{ navItems: NavItem[]; cta: Cta; currentRouteId: RouteId }` | `NavItem = { label; href; current?: boolean }` from the manifest; disclosure menu per §8.2 |
| `Hero` | `{ eyebrow?; heading; lede; primary: Cta; secondary?: Cta; status?: PublicStatus; flagship?: FlagshipCopy }` | `heading` renders the route's only h1 |
| `FlagshipCard` | `{ label; name; status: PublicStatus; line; link: Cta }` | Status via `StatusLabel` |
| `StatusLabel` | `{ status: PublicStatus }` | Text + shape icon; icon `aria-hidden` |
| `ServiceTrio` | `{ services: PublicCapability[] }` | All must be `available`; omitted items vanish |
| `SyntheticFrame` | `{ visual: SyntheticVisualCopy; children }` | Caption always rendered in-frame; `role="img"` + description |
| `CapabilityMatrix` | `{ heading; intro; items: PublicCapability[] }` | Receives gate-filtered items; zero items → renders nothing |
| `ProcessSteps` / `Principles` | `{ heading; items: { title; body }[] }` | Permission-independent fallback (D4) |
| `CompanySection` | `{ copy: CompanyCopy }` | `id="company"`, h2 `tabindex="-1"` |
| `ContactSection` | `{ intents: Array<ContactIntentCopy & { channels: ContactChannel[] }> }` | `id="contact"`; no inputs or forms; external links `rel="noopener noreferrer"`, accessible name ends "(opens in a new tab)" |
| `SiteFooter` | `{ navItems; copy: FooterCopy; legalLinks: { label; href }[] }` | Legal links omitted when absent |
| `HomePage` / `CommercePage` / `SolutionsPage` | `{ content: RouteContent; nav: NavItem[]; channels: ResolvedChannels }` | Compose only; no data access |

The existing `ContactActions` behaviour (booking → WhatsApp fallback) is preserved per intent inside `ContactSection`. Each component ships colocated tests: renders with `fetch` spied and never called, keyboard behaviour where interactive, unapproved capabilities omitted, synthetic caption present, status text present.

---

## 12. Founder decisions — all PROPOSED, with recommended defaults

| ID | Decision | Recommended default (this spec assumes it) | Needed by |
|---|---|---|---|
| D1 | CTA hierarchy | Project enquiry primary ("Discuss a project"); Commerce visually prominent; design partner secondary | S01 sign-off |
| D2 | Palette | Preserve cyan #00D7FF accent; cobalt #2563EB for fills only; tokens §7.2 | S01 sign-off |
| D3 | Intent prefill | Strings in §4.6, with no visitor data. **Corporate email:** `joel@cornertech.ae` is **VERIFIED per Founder** and is the **proposed public replacement** for the personal Gmail default. Proposal only — no `siteConfig`, deployment or provider change in S01; the switch is a separate Founder-approved change | S01 sign-off; email change separately |
| D4 | Case | Exclude Tres Leches; the process/principles composition replaces it | Before S02 build |
| D5 | Claims policy | Ban list in §1.4; "Software built for real operations." as the home h1 | S01 sign-off |
| D6 | 404/static review | Narrow review before S03; no server change authorized | Before S03 |
| D7 | V2-201 owner | Claude as sole writer of the `CornerTechSite.tsx` split | Before S02 |

## 13. Requests to Codex (I do not edit these files)

1. Ledger: confirm `home.hero.lede` replaces C03; confirm C01/C17 cover the D5 phrase and the "Status in plain words" principle, or add rows.
2. Ledger/test: add the forbidden-word lint (§5.2) and the evidence-string bundle scan (§9.5) to the V2-200 S02-entry plan.
3. PRD: record that Sprint 01 proposed copy now lives in this spec (§4) and that the PRD hero is superseded as a draft reference.
4. Contrast test: re-derive P1–P33 and the forbidden pairs with an independent implementation.
5. Manifest: honour only `company`/`contact` hashes; implement §8.3–§8.5.
6. QA matrix: add 319 and 320 px to the responsive width checks.

## 14. Review artifact

`docs/website-v2/sprint-01/experience-preview.html` holds standalone static compositions of Home, Commerce and Solutions, switchable with local `#home` / `#commerce` / `#solutions` controls. It is a docs-only design artifact, not Sprint 02 implementation. Serve it from the repository root (for example `python3 -m http.server` at the repo root, then open `/docs/website-v2/sprint-01/experience-preview.html#home`) so the relative `../../../frontend/public/brand/` font and mark paths resolve; opened as a file, fonts fall back to system fonts. It makes no network requests beyond those relative local assets, and has no trackers, forms, external fonts or external scripts; its inline JS only switches views and shows the mobile-menu disclosure. Every view shows **DRAFT · NOT APPROVED**; Commerce status is explicit; illustrations are captioned "Illustration · synthetic data"; contact buttons are inert and show no real email address or phone number. Codex captures the screenshots at 390 / 768 / 1440, plus 319 / 320 for reflow.
