# ADR — public marketing routes, SEO and isolation
Status: React/Vite retention confirmed as planning direction; prerender spike authorized for planning only, not implementation. Protected server changes NOT authorized. Baseline: `264588059418cb34fbc9319e922de8dec116522c`.

## Current constraints
`main.tsx -> PublicApp -> PublicLanding -> components/public/CornerTechSite -> publicContent/siteConfig`; React/router/lucide plus CSS and brand assets. `main.tsx` also imports protected `styles/globals.css`. The private App/auth/API client remains in source but is not imported by this public entry. PublicApp only recognizes `/`; wildcard renders unavailable and inserts client noindex. HTTP requests to unknown marketing URLs still return the same 200 HTML through Express fallback. Page-specific JS metadata alone cannot fix initial response metadata or HTTP status.

`src/app.js` runs sanitized requestLogger, bounded JSON parsing/raw body capture, API containment, CORS/routes and encoded API rejection before static delivery. Preserve that ordering. No frontend marketing route can authorize API use. `siteConfig` exposes only intentionally public VITE_PUBLIC values; Vite substitution means they are build-time public data, not secret storage. A variable change cannot dynamically rewrite hardcoded index/robots/sitemap metadata.

## Options
| Option | Benefit | Cost / limitation | Decision |
|---|---|---|---|
| Extend current SPA only | Small presentation diff, existing stack | Initial HTML duplicated; social previews weak; soft 404 remains | Accept only for local design preview; not sufficient for final SEO acceptance |
| Build-time route prerender/static HTML on existing Vite/React app | Reuses components and hosting, distinct initial content/meta | Requires deterministic route output, hydration checks and reviewed serving semantics | Recommended direction, subject to Founder/CTO review |
| New SSR framework or separate marketing service | Flexible rendering/status control | Dependency/server/deployment split and operational risk | Defer; disproportionate for initial three-route scope |

## Proposed implementation contract
Maintain an explicit public route/metadata manifest. Build only approved routes into static HTML using the public React tree and synthetic content, without network access or importing private runtime/config. Document mechanism options in the planning-only spike; select and execute a technical spike only after separate implementation approval; do not assume an untested plugin works with this router. Browser globals currently in effects are safe only after confirming build/hydration behavior. If an added package/build script is necessary, request explicit protected-file exception; do not hide it as presentation.

Each route must have unique title, description, canonical, OG URL/title/description and rendered headings in initial HTML. Generate sitemap from the same published-route list; robots must allow published routes and required assets while disallowing private paths. Keep one canonical origin, but require V1 domain/TLS acceptance before claiming it serves traffic. `www` currently redirects in JS only; HTTP canonical redirect is a separate reviewed hosting/server change, not a DNS implication.

Unknown public paths must return HTTP 404 with a noindex public page. Known static routes return 200; missing assets return 404, never homepage HTML. API-looking and encoded API paths retain current JSON/error/auth semantics. Existing legitimate `/health` and API monitoring remain unaffected. Path normalization/traversal tests are mandatory. Static route directories may redirect trailing slashes under express.static; decide one slash policy and test direct GET, refresh, navigation and canonical consistency.

**Real HTTP 404 requires a narrowly authorized change to protected `src/app.js` (or separately authorized edge configuration).** Static files/client routes cannot alone change today's wildcard 200. Proposed server exception touches only post-API static selection/fallback; no middleware movement, auth or API changes. It needs its own reviewed diff, tests and explicit scope approval before implementation. If refused, V2 SEO release gate stays blocked or Founder explicitly accepts documented soft-404 limitations; do not silently claim compliance. No such exception is made in Sprint00; Founder expressly withheld protected-server authorization. V2-306B remains blocked, not an assumed future grant.

## Exact proposed file boundary
Sprint 00: additions under `docs/website-v2/` only. No baseline/test changes.

Later presentation edits already permitted by current integrity regex: `frontend/src/PublicApp.tsx`, `frontend/src/PublicApp.test.tsx`, `frontend/src/routes/PublicLanding.tsx` and `.test.tsx`, `frontend/src/components/public/*`, `frontend/src/config/publicContent.ts`, `frontend/src/config/siteConfig.ts`, `frontend/src/styles/cornertech.css`, `frontend/index.html`, `frontend/public/*`. New page components and colocated tests should live in `components/public/` (CommercePage, SolutionsPage, TresLechesPage, CompanyPage, ContactPage, PublicNotFound and PublicRouteManifest); this avoids broadening the routes-directory exemption. Do not edit existing `main.tsx` merely because it is allowed. Do not place executable server code or secrets in broadly excluded docs/public directories.

Potential exceptions requiring separate approval (none currently granted): a single deterministic prerender script, necessary frontend build/package lock changes, targeted static-serving tests, and the post-API static block in `src/app.js`. Name exact files in that PR after the spike; no wildcard backend/config/dependency exemptions. Keep globals.css, App.tsx, auth, services, API clients, migrations, workflow/deployment files and all other protected files unchanged by default.

## Integrity procedure (must survive extension)
1. Fetch and pin reviewed main B. Compare head H against B, including added, removed and renamed paths. Stop on unexpected upstream security drift; do not automatically rebase/bless it.
2. Enumerate protected paths from B and H independently; compare bytes and membership, not just historical fixture hash. Review every allowed path too: the regex is not authorization.
3. Keep `public-release-boundary.test.js` assertions. For an explicitly approved new exception, document exact path/rationale and old/new protected counts and digests; inspect excluded diff before updating fixture. Never replace assertions with a freshly computed expected value.
4. At Sprint02 entry, before new component integration, expand import checks in a separate reviewed test change: traverse full public entry graph including reexports/dynamic imports, fail private/auth/Sales/AppShell/apiClient/Supabase imports and network calls; negative fixtures prove failures. Current regex checks only two files and is not a complete graph guarantee.
5. Run boundary, containment, route inventory, sanitized logging, authorized-monitoring and static-serving regressions, then all CI. Independently assert `src/`, migrations, config and dependencies unchanged unless the specific exception was approved.

## Preview and rollback
Local loopback Vite/static preview only, synthetic fixtures and no production credentials/API proxy calls; verify network requests. A generated preview artifact should carry noindex and robots disallow; that must not leak into release output. No hosted preview or infrastructure created without authorization. A local screenshot is not proof of HTTP production routing.

Docs-only rollback: close draft PR or revert documentation commit; no runtime effect. Future V2 rollback uses the last accepted secure V1 artifact, currently deployment e3807143-b411-464b-80eb-7e0706016157 at baseline SHA, reverified at release time. Founder must authorize rollback execution; never roll back to pre-CT-WEB-SEC-01 code.

## Coordination and product integration amendment
Initial standalone routes: Home, Commerce, Solutions; Company/Contact stay sections. S02–03 are public product showcasing only; S05 is commercial integration planning only. No authentication, private API wiring or customer data exposure is authorized. A later access design must pass independent product and security readiness review before a separate implementation/activation decision.

CODEX_CLAUDE_HANDOFF_CONTRACT.md assigns Claude Code public component/content/style authorship and Codex routing/metadata/config integration. Shared token/schema interfaces are versioned in a written handoff before implementation. Code ownership never overrides the protected-file boundary or authorizes this sprint to edit code. Cross-review and combined-SHA validation are mandatory.

## Reconciled interfaces and timing (F05/F08/F09/F11/F15/F17)
Claude solely owns V2-201 CornerTechSite.tsx section refactor and publicContent.ts RouteCopy (title/description/h1/OG text). Codex owns routes, integration and PublicRouteManifest consuming that copy by routeId; metadata text is not independently authored in index.html/manifest. publicStatus excludes VERIFIED: internal evidenceLevel never renders, every capability requires exact approved text/status provenance and build-time fail-closed omission. Versioned content@1/tokens@1 are specified in the handoff contract, with public-only typed props and no private data.

Manifest navigation must handle cross-route home hashes, route scroll/focus and back/forward restoration, one shared frame/skip link and trailing-slash policy; tests run after hydration and direct navigation. Initial three routes only. Schedule a narrow404/static-serving review before S03 (D6 PROPOSED) and assess hashed-asset300s caching in that same window (F17); no server implementation authorization. Ownership verified domains still await separately authorized routing cutover and certificate/traffic acceptance; canonical origin selection does not prove reachability.


## Sprint01 resumption — 2026-10-23 (supersedes historical current-state wording)
Founder authorized Sprint01 strategy, content and design specifications. Runtime baseline is `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`, Railway deployment `a1491b7b-9525-4de9-96db-c7fd3502fd69` SUCCESS, with strict HTTPS and working WhatsApp CTA accepted on both domains in CT-WEB-LIVE-02. The earlier pending-domain-cutover and calendar-default descriptions are historical, not current blockers. Booking is now opt-in; absent/invalid configuration yields Discuss a project on the approved WhatsApp destination, email separately secondary. Corporate `joel@cornertech.ae` is verified per Founder and may be proposed here, but public replacement is not authorized for deployment.

PR96 remains Draft at `754f4868026d4fa899c90fa201814178bf4339a7`. Its docs were copied byte-for-byte into an isolated branch from new main, without merging PR96 or importing PR91/92 history. Independent CLAUDE_S00_FINDINGS.md and evidence JSON remain historical and unchanged. See SPRINT01_ENGINEERING_REVIEW.md and EXPERIENCE_SPEC.md for current execution, decisions and limitations. No Sprint02 components, protected changes, merge or deployment are authorized. D1–D7 remain PROPOSED.
