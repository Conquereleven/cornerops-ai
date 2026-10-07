# Corner Tech AI reconstruction evidence

Canonical: Founder recording (32.558 seconds, 2880×1800, 60fps) and the supplied 1440×900 key frames/contact sheets. Recording inspected at 2 seconds as well as the supplied sequence. Browser chrome occupies the top 88px of frames 1–7; comparisons remove it. The source files remain in the Founder package, not duplicated into the repository.

Supplemental Emergent and production pages were accessible on 2026-10-07. Assets come from the Emergent page: original logo, business topology and transition SVG. SVG metadata and continuous animation were removed. The mobile topology retains four surrounding nodes. Geist and Geist Mono are locally hosted with their OFL licenses.

Full-page screenshots: 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844. `responsive-checks.json` records browser DOM measurements. No overflow or broken images at any size.

`hero-comparison.jpg`, `solutions-comparison.jpg`, `work-comparison.jpg`: canonical frame on the left, local implementation on the right. Case-study source is captured mid-scroll, so its section boundary differs from the anchor screenshot; compare offsets within the section rather than absolute screen position.

`login-guard-390x844.jpg`: anonymous `/app/sales` redirects to `/login?next=%2Fapp%2Fsales`; configured sign-in was not exercised.

Browser interaction checks: desktop anchors; mobile menu open, select Industries and close; View project points to project context; booking/email/WhatsApp hrefs use existing approved contacts; anonymous deep link remains closed. No contact was submitted. Console error/warning log empty after final implementation (an initial malformed SVG was repaired).

No preview deployment, production change, migration, resource rename, external commercial action or domain connection occurred.
