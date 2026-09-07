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

Contact destination is pending owner input. Talk to CornerOps currently navigates to the contact section with an in-person meeting invitation. This is a release blocker for remote lead capture; no email address or calendar has been fabricated.

Validation commands passed: root lint (615 JavaScript files), frontend typecheck, 20 frontend tests / 8 files, Vite build and diff whitespace check. Changed-file secret-pattern scan found no matches for private keys, AWS access keys, GitHub/OpenAI tokens or quoted secret assignments; this is a scoped pattern scan, not a full-history credential audit.

Build output: CSS 9.55 kB gzip; primary JS 101.10 kB gzip; separate dynamically imported Anime.js chunk 15.28 kB gzip. Existing root dependency install reports 7 audit advisories; dependency manifests and lockfiles are unchanged.
