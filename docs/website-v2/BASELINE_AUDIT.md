# Sprint00 source and release audit
Date: 2026-10-21. VERIFIED means directly inspected source, tool metadata or check result; PROPOSED/PENDING are not release claims.

## Source/release identity
- Fresh fetched origin/main: `264588059418cb34fbc9319e922de8dec116522c`. PR94 MERGED 2026-10-21T05:51:56Z, merge commit matches. No unexpected drift relative to attached plan.
- Security foundation main: `3f352911c597672a3231e427f106d4b165d01bae`. Diff to current main is public presentation/tests/docs only; src/, workflows, manifests/locks and migrations unchanged.
- Open PR inventory at audit: 93 CTO docs; 92 public design stacked on91; 91 private consolidation; 89 Shopify read connector; 85 auth; 83 activation; 81 acceptance docs; 80 CornerGlass. None incorporated or modified by Sprint00.
- Railway read-only list: project `10deb808-6af7-4529-a6f8-b63026c88db9`, production env `6d33520e-bd58-4ad6-bf03-4bb4439964da`, service `3c57d108-d956-49b2-b65f-d798cbedd656`. Deployment `e3807143-b411-464b-80eb-7e0706016157` SUCCESS, exact main SHA, snapshot `ec3c5689-f497-43e4-aab7-92fe335b37b6`, created05:51:58Z; rollback/redeploy flags true. No changes staged or deployed by this task.
- Main CI [39551984433](https://github.com/Conquereleven/cornerops-ai/actions/runs/39551984433) success. Latest observed Prod Watch [39607929976](https://github.com/Conquereleven/cornerops-ai/actions/runs/39607929976) success at same SHA. This sprint did not trigger Prod Watch or its database check.
- New isolated shell worktree `work/cornerops-v2-s00`, branch `feature/ct-web-v2-s00-foundation`. Managed-worktree tool could not resolve this projectless directory as a Git repo; explicit git worktree used from known repository. Other worktrees preserved. No implementation or protected file modified.

## Public inventory
| Area | Exact source / finding |
|---|---|
| Bootstrap | frontend/src/main.tsx mounts PublicApp; imports globals.css |
| Routes | frontend/src/PublicApp.tsx: `/` public, `*` unavailable; www redirect via browser effect only |
| Landing | frontend/src/routes/PublicLanding.tsx; reduced-motion listener, skip link, section composition |
| Sections | frontend/src/components/public/CornerTechSite.tsx: Brand/Header/Hero/WhatWeBuild/OperationalFriction/FeaturedWork/SystemsAndIndustries/ProcessAndPrinciples/CompanyAndContact; reconstructed CaseVisual |
| Data | frontend/src/config/publicContent.ts: hero, capabilities, friction, industries, process, principles, systems, case |
| Public config | frontend/src/config/siteConfig.ts: public origin, calendar, email, WhatsApp, optional LinkedIn/privacy/terms; signInEnabled false |
| Design | cornertech.css scoped .ct-site; Geist/Geist Mono, black #05070b, navy #07111f, blue #0066ff, cyan #00d7ff, light #f5f5f0, muted #999da3; globals.css is shared/protected |
| Assets | frontend/public/brand: logo-mark.png, geist.ttf, geist-medium.ttf, geist-mono.ttf, two OFL licenses, intelligence-source.svg, intelligence-mobile.svg, transition-source.svg |
| SEO | frontend/index.html title/description/OG/Twitter/root canonical; root-only sitemap; robots Disallow / with root/assets/brand allowances; unavailable noindex injected client-side |
| Tests | PublicApp.test.tsx private/wildcard no-fetch/noindex; PublicLanding.test.tsx; App.test.tsx; public-release-boundary; frontendStaticServingV114; CT-WEB-SEC-01 containment/inventory/logging tests |
| Build | Vite6.4.2 React19.2 TypeScript router7; root build delegates frontend; CI Node22 runs syntax/typecheck/backend/frontend/build/safe demos |
| Legacy source | Private App and auth/services remain in repository; they are not part of public entry imports. Do not mistake retained source for public product availability |

Reviewed transitive public source imports: React, React DOM, router, lucide, PublicLanding, CornerTechSite, publicContent, siteConfig and CSS. No private/auth/API client imported by this entry graph. Existing import test is narrower than the graph; stronger recursive/negative tests proposed, not claimed implemented. Current config supports public VITE_PUBLIC_SITE_URL, BOOKING_URL, CONTACT_EMAIL, WHATSAPP_NUMBER, LINKEDIN_URL, PRIVACY_URL, TERMS_URL only in this path. No environment values/secrets were retrieved.

## Read-only reachable-page sample
Railway origin: https://cornerops-ai-production.up.railway.app . GET Accept text/html, normal TLS verification, no authorization or mutations.
| Path | Result |
|---|---|
| `/` | 200 text/html, 1350 bytes, CornerTech AI title, no-cache/no-store |
| `/robots.txt` | 200 text/plain,110 bytes,300s cache |
| `/sitemap.xml` | 200 application/xml,153 bytes,300s cache |
| `/products/commerce` | 200 same1350-byte homepage HTML; not an implemented product route |
| `/s00-missing-page` | 200 same HTML; confirms soft404 |
| `/api/health` | 200 JSON,40 bytes; minimal health |
| https://cornertech.ae/ and https://www.cornertech.ae/ | Connection refused from audit environment; no HTTP status obtained |

CSP and HSTS absent on sampled Railway responses. Domain failure is a bounded observation, not proof of the DNS cause or a global outage. V1 full custom-domain acceptance remains PENDING; Railway SUCCESS alone does not close it. No DNS/panel/certificate change attempted. No new browser screenshot or V2 design exists: previous V1 responsive evidence is under docs/evidence/ct-web-live-01, not fresh V2 acceptance.

## Independent protected baseline
Used git ls-tree and git show at fresh main, classified paths using current test boundary, sorted path + NUL + bytes + NUL. 1173 tracked base files; 792 protected files; SHA256 `be91c76a09f9bff3a83742bfc9446fe72edc535c095bdb4094e5bb5b697e5e90`; zero worktree byte differences. This independently agrees with the historical fixture rooted at secure main3f35291. Neither test nor fixture edited. All S00 additions live under docs/website-v2; review that path content too because docs exemption is not a security sanitizer.

## Local validation
- Focused tests: 8 suites passed,39 tests passed; 1 suite/3 database-dependent tests skipped. Includes boundary, apiContainment, apiRouteInventory, requestLoggingContainment, frontendStaticServingV114, Commerce profile/intake/persistence contracts. Database behavior not independently revalidated.
- Frontend:10 suites,27 tests passed. Typecheck and production build passed. Built assets: CSS47.49kB (gzip10.22), JS253.70kB (gzip80.38). These are bundle observations, not performance certification.
- Security guards are source-identical to secure main: request logging before denial, bounded raw JSON, mandatory internal key fail-closed, webhook signature/verification guards and decoded API fallback preserved. Expected unconfigured internal endpoints remain503; missing/invalid operator credentials remain401; approved monitoring auth remains separate from marketing.
- Final draft-PR exact-SHA CI and secret scan recorded in delivery report. No full production security certification inferred from local fixtures.

## Links and delivery map
[PR94](https://github.com/Conquereleven/cornerops-ai/pull/94), [PR95](https://github.com/Conquereleven/cornerops-ai/pull/95), [baseline tree](https://github.com/Conquereleven/cornerops-ai/tree/264588059418cb34fbc9319e922de8dec116522c).
PRD defines product/routes/brand inputs; ADR defines implementation boundaries and SEO decision; claims ledger defines factual gates; backlog defines all five sprints/dependencies; risk register defines Founder decisions and rollback. Sprint00 is complete as planning; Sprint01 remains unstarted and requires authorization.
