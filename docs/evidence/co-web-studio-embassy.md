# CornerOps AI systems studio — commercial sprint

Base: PR #84, `774a3258b5f8d790928883f44517afe8de928c7d`.
New PR is stacked on its web branch to isolate this sprint. Draft only; no merge or deployment.

## Positioning and sections

AI agency / AI systems studio. AI, automation and custom software for sales, commerce, customer operations and back office. Commerce OS and the internal platform are supporting foundations.

Hero → Built for → What we fix → Solutions → Selected work → How we work → Why CornerOps → Capabilities → Contact → Footer.

## Portfolio evidence

- Specialty food distributor — Internal platform. Anonymized CornerMex operating environment; supported by `docs/architecture/cornerops-v1.16-reuse-map.md` and existing catalog/inventory routes. No external deployment or outcome claim.
- From quote to delivery — In development. Anonymized CornerMex/Intermex Commerce OS workstream; supported by `docs/architecture/commercial-operations-core-v1.17a.md` and the commercial module registry. No commercial activation claim.
- CornerOps operating platform — Internal platform. Founder Daily, Work Queue and Approvals documented in the reuse map and implemented in the existing platform.

Tres Leches and hospitality/real estate projects omitted: this checkout provides insufficient implementation/public-use evidence. No logos, testimonials or invented metrics.

## Validation

Manual browser viewport checks: 390, 768, 1280 and 1440 CSS pixels; document scroll width equals viewport at every size. Reviewed hero and portfolio screenshots, anchor navigation and the accessible page structure. Full-page capture showed stitching artifacts; viewport screenshots were used for visual judgment.

Existing CornerGlass login styles retained. No route, auth, backend, Railway, Supabase, CornerMex repository or PR #83 changes. Anime.js remains dynamically imported, finite and skipped for reduced motion; preference changes cancel active motion. No dependencies added. English document language and basic description/Open Graph metadata added.

Email and WhatsApp are now implemented with Founder-authorized values. Google Calendar booking remains the only missing contact input; see the RC evidence below.

Validation commands passed: root lint (615 JavaScript files), frontend typecheck, 20 frontend tests / 8 files, Vite build and diff whitespace check. Changed-file secret-pattern scan found no matches for private keys, AWS access keys, GitHub/OpenAI tokens or quoted secret assignments; this is a scoped pattern scan, not a full-history credential audit.

Build output: CSS 9.55 kB gzip; primary JS 101.10 kB gzip; separate dynamically imported Anime.js chunk 15.28 kB gzip. Existing root dependency install reports 7 audit advisories; dependency manifests and lockfiles are unchanged.

Full repository validation also passed: 129 backend suites / 766 tests (2 suites and 12 tests skipped), control:tower and demo:beta. Backend tests were rerun with local socket permission after the sandbox initially blocked Supertest's temporary listener.


## Embassy RC — 2026-09-08

- Scope: public landing contact and its styles only; no backend/auth/config changes.
- Email: `mailto:joel.escudero12@gmail.com`.
- WhatsApp: `https://wa.me/971555633651`, displayed as `+971 55 563 3651`; new-tab accessible label and `noopener noreferrer`.
- Calendar: no real public booking URL found by tracked-repository search (including config/docs) or GitHub default-branch calendar search. No generic event link or invented booking destination is rendered.
- Blocker: `GOOGLE_CALENDAR_BOOKING_URL_REQUIRED`. No merge or deploy permitted until the real booking URL is supplied and validated.
- Starting #84 head: `774a3258b5f8d790928883f44517afe8de928c7d`; CI success. This commit records Founder visual acceptance of `9cfccabf8338f1a8c6a052d8eea1d7e1a4dfd0d0` and changes documentation only.
- Starting #90 head: `0ba62c853667af97dd76cc7574284805e96b4403`; CI success; draft, stacked on #84.
- Local checks: lint, typecheck, 20 frontend tests, 129 backend suites / 766 tests passed (12 tests skipped), build, control:tower, demo:beta, diff check. Backend suite rerun outside sandbox because local test listeners initially received EPERM.
- Browser: document scrollWidth equals viewport width at 390/768/1280/1440; hero contact and portfolio anchors navigate correctly; email and WhatsApp exact hrefs inspected without sending messages; keyboard Tab reaches WhatsApp with visible solid focus outline; login retains the truthful disabled authentication gateway.
- Review: semantic heading hierarchy, existing SEO/OG basics, finite reduced-motion-aware animation and honest Internal platform / In development portfolio labels preserved.
- Calendar smoke and production checks deferred by the required booking blocker.
