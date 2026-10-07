# Corner Tech AI visual QA

final result: passed

Source visual truth: Founder package `visual_refs/emergent_screen_recording.mov`, frames `frame_001.jpg`, `frame_003.jpg`, `frame_004.jpg`, contact sheets. Supplemental live Emergent capture: `docs/evidence/cornertech-public-site-v1/emergent-live-desktop.jpg`.

Implementation: local browser at `http://127.0.0.1:5174/`; evidence under `docs/evidence/cornertech-public-site-v1/`.

## Normalization and comparisons

Canonical frames are 1440×900 including 88px browser chrome. Comparison boards remove that chrome and compare 1440×812 content regions against 1440px local captures at density 1. Browser CSS viewport 1440×900. Work source is mid-scroll while implementation is at its anchor; its section boundary differs, but interior spacing is comparable. Combined inputs opened and inspected: `hero-comparison.jpg`, `solutions-comparison.jpg`, `work-comparison.jpg`. The full boards make hero type, topology, primary capability and ordering UI legible; focused reference frames and local section captures were also inspected. Mobile has no canonical recording viewport; supplemental Emergent mobile and handoff guide the adaptation, not a claim of pixel parity.

## Iteration history

1. P1: malformed exported SVG displayed alt text. Fixed XML namespace and image element cleanup; verified loaded images at all sizes and restored original logo inside topology.
2. P1: global workspace h2 color caused white text on the off-white solutions canvas. Scoped public heading colors; captured and compared again.
3. P2: anchor offset introduced about 38px extra dark gap above Solutions. Reduced desktop anchor margin to 62px; current comparison shows intended compact nav and light editorial hierarchy.
4. P2: heading weight was lighter than the canonical recording. Bundled real Geist 500, applied it to headings, recaptured desktop/mobile and all six responsive sizes.
5. Corrected an evidence capture whose viewport changed asynchronously; final hero board uses a verified 1440×900 CSS viewport, not the stale mobile capture.

## Final review

- Fonts: local Geist 400/500 and Geist Mono 400; tight editorial typography. No network dependency at runtime.
- Rhythm: three-line left-heavy hero; quiet topology; silent hard light transition; AI Agents uncontained, two secondary modules, lower capabilities in rows. Core white-space/hierarchy matches the reference closely.
- Color: near-black/navy, warm off-white, limited action blue and cyan. No legacy green on the new public site.
- Asset quality: original logo and source topology/transition, no generated replacement art. Source metadata and continuous SVG motion removed.
- Copy: active brand Corner Tech AI; founder-provided case facts only. Demo UI labelled Example, internal systems labelled Internal system/In development. No commercial metrics, testimonials or invented deployment proof.
- Case: ordering remains dominant, with WhatsApp, operations and checkout offsets. Mobile stacks them into a readable native layout.
- Responsive: 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844; zero horizontal overflow/broken images in DOM measurements.
- Accessibility: semantic headings, one main landmark, visible focus, keyboard-operated menu/Escape, contact targets, native scrolling, CSS reduced-motion override and tested media preference. Topology has a descriptive equivalent; product composition has an explicit illustrative description. No formal WCAG audit or screen-reader session performed.
- Interactions: desktop anchors, mobile open/select/close, project-context anchor, approved contact hrefs, anonymous /app/sales redirect. Browser console errors/warnings empty.

Remaining P3 differences: no pointer tilt/parallax, node cycling or Lenis; finite entrance/nav motion only. Topology uses a static source state and its embedded text uses fallback sans-serif rendering. Thin background grid from the recording omitted. Extra Sign in nav item and truthful Example labels; added lower narrative sections are sprint-required extensions. Source recording has white punctuation after blue business, while the user explicitly requested blue emphasis on business. including the period. Mobile differs from Emergent's narrow supplemental viewport to improve legibility and contact access.

No actionable P0/P1/P2 visual issue remains for Founder review. Approval is not implied. Configured live authentication and staging acceptance remain outside this visual QA.
