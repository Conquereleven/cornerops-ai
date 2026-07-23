# CornerGlass design system v1

**Sprint:** CO-UX-1.1 — CornerGlass Command Center Prototype
**Status:** visual prototype (draft). Does **not** authorize production rollout.
**Preview route:** `/design/cornerglass-preview` (frontend-only, lazy-loaded, absent from the module registry).

## Doctrine

CornerGlass is a restrained, Liquid Glass-inspired visual system for CornerOps. Intended
composition:

```
70% enterprise mission control
20% liquid glass
10% operational intelligence interface
```

It should make CornerOps feel premium, spatial, intelligent, operationally serious, readable,
deterministic and trustworthy — and must **not** feel decorative, playful, translucent
everywhere, copied from Apple, ambiguous, or like a consumer entertainment dashboard.

**Glass belongs to navigation, overlays and temporary controls. Dense operational content stays
solid.**

## Product-truth rules (non-negotiable)

Visual effects must never imply a fact the data does not support. Specifically:

- Brighter/lighter glass **must not** imply better health.
- Transparency **must not** imply confidence.
- Animation **must not** imply live data.
- Glow **must not** imply successful completion.
- Blur **must not** hide an unknown state.
- Colour **alone must not** represent severity — always pair with icon + text + shape.
- Demo data **must not** look like production data (the preview is explicitly badged
  `NON-PRODUCTION PREVIEW`).

Unknown, unavailable, unconfigured and disabled states remain explicit. **Critical alerts are
always solid, opaque and high-contrast — never glass.**

## Permitted use

Topbar, desktop sidebar shell, mobile navigation drawer, operator/connection popovers, command
palette, filter/action toolbars, one floating detail panel shell, compact status controls.

## Prohibited use

Financial evidence, payments, order/inventory/audit tables, exception history, long forms and
operational text, critical alerts, dense metrics grids (by default), fulfillment history — these
stay on solid surfaces. Also prohibited: animated/continuous gradients, star fields, particle
systems, video/WebGL/canvas backgrounds, mouse-tracking reflections, rainbow refraction, large
glowing blobs, translucent text or icons, stacking many blurred surfaces.

## Tokens

Defined in `frontend/src/styles/cornerglass.css`, **scoped under `.cg-root`** (not `:root`) so the
stylesheet has zero effect on any page that does not render a `.cg-root` container.

| Token | Purpose |
|---|---|
| `--cg-surface` / `--cg-surface-strong` | glass surface backgrounds |
| `--cg-opaque` | solid fallback surface |
| `--cg-solid` | dense operational content surface |
| `--cg-border` / `--cg-border-strong` | thin surface borders |
| `--cg-highlight` | subtle inner top highlight |
| `--cg-blur` / `--cg-saturation` | backdrop-filter parameters |
| `--cg-shadow` / `--cg-shadow-overlay` | restrained / overlay elevation |
| `--cg-focus` | focus ring colour |
| `--cg-backdrop` | overlay scrim |
| `--cg-warning-surface` | tinted warning surface |
| `--cg-critical-surface` | solid, opaque critical surface |
| `--cg-motion-duration` / `--cg-motion-ease` | entry/transition motion |

Reduced-transparency overrides raise surface opacity and set `--cg-blur: 0`.

## Primitives

`frontend/src/components/cornerglass/`:

- `GlassSurface` — base glass panel (auto solid fallback via CSS).
- `GlassToolbar` — `role="toolbar"` glass action bar.
- `GlassPopover` — non-modal menu popover; Escape / outside-click close; focus returns to trigger.
- `GlassDrawer` — modal mobile nav drawer; focus trap; Escape / scrim close.
- `GlassDetailPanel` — glass shell wrapping a **solid** inner evidence region; modal dialog.
- `GlassCommandPalette` — `role="dialog"` command palette; safe navigation/preview actions only.
- `useGlassDialog` — shared focus-trap / Escape / focus-return hook.

No design-system framework and no new UI dependency were introduced. Existing production panels
were not replaced.

## Accessibility rules

- WCAG AA contrast for normal text; text and icons always opaque.
- Visible `:focus-visible` ring (`--cg-focus`); outlines never removed without a replacement.
- Command palette and detail panel: `role="dialog"` + `aria-modal`, focus trapped, Escape closes,
  focus returns to the opener. Drawer: labeled modal dialog. Popovers: `role="dialog"` with a label,
  non-modal, Escape/outside-click close.
- Status conveyed by icon + text + shape, never colour or transparency alone.
- Critical alerts opaque. Usable at 320px width and 200% zoom.

## Performance rules

- `backdrop-filter` used **only** through shared CornerGlass surface classes, always paired with
  `-webkit-backdrop-filter`.
- No backdrop blur on scrolling tables, large grids, long lists, logs, or entire page content.
- Overlays do not cause layout shift; visual-state toggles are CSS/data-attribute driven to avoid
  unnecessary re-renders. Prefer CSS over JS for purely visual behaviour.
- The preview is **lazy-loaded**, so production routes carry no additional bundle weight.

## Reduced-motion behaviour

`@media (prefers-reduced-motion: reduce)` removes non-essential animation and transitions. A
`data-cornerglass-motion="reduced"` root attribute mirrors this for demonstration. Motion is
limited to subtle entry/state transitions — no continuous float, pulse or shimmer.

## Reduced-transparency behaviour

Driven by `data-cornerglass-transparency="reduced"` on `.cg-root` (and the OS
`prefers-reduced-transparency` media query). When active: surfaces become substantially opaque,
blur is disabled, borders and hierarchy remain intact, text contrast is unchanged, and no
functionality is lost.

## Fallback behaviour

`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` replaces
glass with solid opaque surfaces while preserving borders, elevation, layout, focus and
interaction. A `.cg-force-fallback` root class lets reviewers simulate this on capable browsers.

## Examples

The preview at `/design/cornerglass-preview` demonstrates: standard dark CornerGlass, reduced
transparency, reduced motion, unsupported-blur fallback, desktop sidebar, mobile drawer, command
palette, floating detail panel, normal/warning/critical status, unknown/unconfigured data, loading
and empty states, and keyboard focus — with toggle controls for the demonstration states (not
persisted anywhere).

## Future rollout stages (not authorized here)

- **UX-1.1** CornerGlass Command Center Prototype — *this sprint (prototype only)*.
- **UX-1.2** CornerGlass Operational Shell Pilot — future.
- **UX-1.3** CornerGlass Controlled Rollout — future.

## Non-goals

Not a full re-skin, not a component-library migration, not a backend or data change, not a
production rollout, not a new dependency, and not a replacement of the canonical module registry
or navigation semantics.
