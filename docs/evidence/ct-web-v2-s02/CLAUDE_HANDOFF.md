I've written the four files in `/tmp/ct-v2-s02-experience`, but **none of the tests have been run, and neither has the type-check.** My shell can't reach `/tmp`, and writes to the worktree are blocked by the `rodrigom.` path check. Please run vitest and tsc first when you import the files.

## Cross-review: `PublicImportBoundary.test.ts` (18 tests)

**Verdict: GO for integrating Sprint 02, with changes needed before the release gate.** The checks that are there work correctly. Imports, re-exports, cycles, literal dynamic imports, computed targets and `..` path escapes are all rejected. Imports of unknown assets (`?raw`, `.json`, `.svg`) fail closed as unresolved. The gaps are things the guard doesn't look at:

1. **`import.meta.glob(...)` gets through.** It's a call on a property named `glob`, which isn't on the forbidden list. Vite expands it at build time, so it could pull private modules into the bundle. Reject `import.meta.*` except `import.meta.env`.
2. **Static URLs in JSX aren't checked.** `<img src="https://tracker…">`, `<link rel="preconnect|prefetch">`, `<script src>`, `<iframe>`, `<form action>` and `new Image().src = …` would all make network requests with no fetch call. Reject absolute or `//` URLs in `src`/`srcSet`/`poster`/`data`/`action`/`formAction`, reject those elements outright, and allowlist outbound `href` schemes.
3. **Stylesheet content isn't scanned.** The approved CSS could add `@import url(https://…)` or `url(https://…)` (a font or beacon) without failing. Scan the allowlisted CSS for remote `url()` and `@import`.
4. **Gaps outside the import graph:** `index.html` (external `<script>`/`<link>`) and assets in `public/` (SVGs with external references) aren't audited.
5. **Minor:**
   - `const f = window["fetch"]; f()` isn't caught, because the string literal is only checked when it's being called. Flag string literals equal to the forbidden names.
   - `import x = require("…")` (TypeScript-only syntax) isn't visited.
   - `Worker`, `SharedWorker`, `serviceWorker.register` and `RTCPeerConnection` aren't on the forbidden list.
6. **Brittle setup:** the real-entry test finds `src` from `process.cwd()`. Run from the repo root it fails as "unresolved" (that does fail closed). Resolve it from `import.meta.url` instead.

My files comply with the guard as it stands. They only import `react`, `react-router-dom`, `./CornerTechSite` and `../../config/publicContent`, and contain no CSS imports or network identifiers.

## Changed files
1. `frontend/src/components/public/WebsiteV2.tsx` (new)
2. `frontend/src/components/public/WebsiteV2.test.tsx` (new)
3. `frontend/src/config/publicContent.ts`: `websiteV2Content` appended; the legacy `publicContent` export is unchanged.
4. `frontend/src/styles/cornertech.css`: block appended, scoped to `.ct-v2`; the V1 CSS is untouched.

## Public interface
- `PublicNavItem` and `ContactLinks` are exactly as in the contract.
- **`V2Frame({nav, children})`:**
  - Root is `div.ct-site.ct-v2`, with a skip link to `#main-content`, a sticky header and a footer.
  - The brand links to `/` and uses `/brand/logo-mark.png`.
  - One "Primary" nav built from your `nav` props with React Router `Link`, with `aria-current` on the matching page. The footer nav uses the same items.
  - Header "Discuss a project" goes to `/#contact`.
  - The menu button is labelled "Open menu"/"Close menu" and has `aria-expanded` and `aria-controls="v2-menu"`. Escape closes the menu and returns focus to the button; following a link or any navigation also closes it.
  - There is a single `main#main-content` with `tabIndex=-1`.
- **`V2Home({contact})`:**
  - Hero h1 with `tabIndex=-1`, and a Commerce card marked In development.
  - Three Available services.
  - Concept illustration labelled "Illustration · synthetic data".
  - Process, principles and audience segments sections.
  - `#company` and `#contact` sections, each with an h2 at `tabIndex=-1`.
  - The project card uses the existing `<ContactActions {...contact}/>`. A separate design-partner `mailto:` link ("Email us about design partnership", generic subject) appears only if an email is configured. WhatsApp appears once.
- **`V2Commerce()` and `V2Solutions()`:** each has its own h1, honest status and service copy, and `Link`s to `/#contact`. Commerce has no capability table and no per-module status.
- **`websiteV2Content`:** `routes.{home,commerce,solutions}.{title,description,h1}`, `navigation`, `content@1`/`tokens@1`, and `commerceCapabilities: [] as readonly []`. It contains copy only, with no approval or evidence keys.

## Known limitations
- **Possible focus conflict:** `V2Frame` focuses the heading at a hash target (`/#company`, `/#contact`) whenever the location changes. If `PublicApp` also moves focus to the h1 on route changes, its effect runs after mine and will win. Skip the h1 focus when `location.hash` is set.
- **Stylesheet loading:** `cornertech.css` has to be loaded on the V2 routes (today `PublicLanding` imports it). The boundary test's CSS allowlist needs updating if that import moves.
- **One selector sits outside `.ct-v2`:** `html:has(.ct-v2)` sets `scroll-padding-top` so the sticky header doesn't cover focused elements.
- **Responsive behaviour is unmeasured:** the 319/320/390/768/1440 and 200% zoom styles were written but never checked in a browser.
- **Differences from the S01 reference:** I left out the per-stage In development/Planned labels in the illustration and the capability rows on the home Commerce card, because neither has publication approval.
- **Copy still needing Founder sign-off:** the Commerce "Status at a glance" row "Design partners: Conversations open", and the Company copy.
- **Not handled here:** page `title`/`description` are exported but not applied, which is left to your route manifest. Contact details are unchanged; the existing Gmail/WhatsApp values come from `siteConfig`.

I'm not approving my own UI; that review is yours.
