# Corner Tech AI Website Reconstruction & Integration Sprint v1

## Checkpoint 0 — Reference and base

Clean checkout: `22c8510559b6a583a7a13b63301e79cdfe1b7d10`, exact open PR #91 head. Created `feature/cornertech-public-site-v1` from it. #91 is the integration base; #85 overlaps its auth work, #89 is a separate Shopify connector, #83 commercial readiness, #81 acceptance docs and #80 older UX prototype. None merged or modified.

Read 00 → 01 → 02 → 03 before code, then 04 for logo/case context. Recording inspected through supplied sequence and an extracted 2-second frame; 32.558s at 60fps, 2880×1800. All eight supplied key frames/contact sheets used. Supplemental Emergent and current production accessible. Production capture read-only.

Conflicts resolved by explicit user instruction: video outranks live preview; older STOP rule superseded; old CornerGlass AGENTS decisions superseded for this public sprint. Historical Phase 1-only handoff does not limit the new sprint's broader narrative. No resource/domain/auth-production changes authorized.

File map: `frontend/src/routes/PublicLanding.tsx` public entry; `frontend/src/styles/public.css` legacy landing/login styles; `frontend/src/App.tsx` route boundary; `frontend/src/auth/` guards; `frontend/src/config/siteConfig.ts` contacts/domain; `frontend/index.html` metadata; `frontend/vite.config.ts` canonical/sitemap behavior.

Plan delivered in `CornerTechSite.tsx`: Header, Hero, CornerTechIntelligence, WhatWeBuild, OperationalFriction, FeaturedWork/ProductSurfaceComposition, SystemsAndIndustries, ProcessAndPrinciples, CompanyAndContact. Copy centralized in `publicContent.ts`, identity/contacts in `siteConfig.ts`, public tokens/styles in `cornertech.css`.

## Checkpoint 1 — Design system

Original blue/cyan logo, local Geist/Geist Mono, dark nav, three-line hero, business. blue emphasis. Finite low-amplitude entrance, nav compacting/blur, CSS reduced motion. Native mobile scroll and keyboard menu. Compared against recording frame 001; tightened heading weight during final audit.

## Checkpoint 2 — Core narrative

Static original topology, simplified four-node mobile variant, source transition hairlines, architectural dark-to-light boundary. Uncontained AI Agents, two secondary modules and three supporting rows. Friction in editorial split. Compared with frames 002/004/005; fixed global heading color and anchor spacing.

## Checkpoint 3 — Proof and conversion

Tres Leches uses four reconstructed product surfaces and Founder-supplied facts. Example labels distinguish illustrations from live orders. View project opens real on-page context. Internal Command Center and Commerce OS stage labels preserved; speculative Trade/Atlas proof omitted. Six UAE operating environments, five-step process, three principles, quiet technology list, company thesis and current working contacts. Compared against frames 003/006 and recording sequence: main ordering surface dominant, restrained accent and whitespace.

## Checkpoint 4 — Integration

`/` new public site; `/login` real inherited auth gateway; `/app` and `/app/*` keep PR #91 identity + backend membership guard. App.tsx/AuthContext/security implementation unchanged. Visible frontend labels updated, primary legacy slug mapped to current display name; namespaces retained. No database migration/config changes. Local auth unavailable truthfully disables sign-in. Anonymous /app/sales browser redirect verified; member isolation remains covered by frontend tests.

Six responsive captures and DOM checks in evidence directory. All no overflow/broken images, console error/warning log empty. Keyboard menu and reduced-motion tests pass. Canonical/domain unset; no cornertech.ai connection. Actual legal links absent until configured real documents exist.

## Checkpoint 5 — Visual audit

See root `design-qa.md`, combined source/implementation comparison boards and responsive evidence README. All major fidelity issues fixed; remaining differences explicit. Added lower sections are extensions because recording ends after the case study. No six-card grid, heavy glow, continuous decorative animation or unsupported proof introduced.

## Validation

- Typecheck: pass.
- Frontend: 12 files, 95 tests passed (including route/auth/membership, mobile menu and public claim labels).
- Lint: pass, syntax check of 652 JS files; TypeScript covered by tsc.
- Build: pass; inherited >500kB bundle warning remains (private app/Supabase imported by existing route structure).
- Secret scan: pass.
- Route inventory: current.
- Security regressions: 8 suites, 84 passed, 10 database-dependent tests skipped. No local PostgreSQL configured for this run, no production database accessed.
- An existing guard test race was fixed by waiting for the deferred request before resolving it. New frontend test imports corrected before final passing run.

## Limits and Founder decisions

Real configured sign-in/membership and exact integrated candidate staging still need staging acceptance. PR #91 is unmerged and contains its own migration/production gates. Visual approval, later staging authorization, domain/email cutover and resource naming remain Founder decisions. Public production was not changed.

Recommended next action: Founder visual review of the local preview and screenshot comparisons.
