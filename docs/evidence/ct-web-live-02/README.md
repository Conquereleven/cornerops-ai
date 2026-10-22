# CT-WEB-LIVE-02 — contact CTA hotfix (Claude Code handoff)

Base: `264588059418cb34fbc9319e922de8dec116522c` (main, deployed). Branch: `hotfix/ct-web-live-02-contact-cta`.

## Changed files

| File | Change |
|---|---|
| `frontend/src/components/public/CornerTechSite.tsx` | Contact buttons moved into exported `ContactActions`; no other section touched |
| `frontend/src/components/public/ContactActions.test.tsx` | New: 7 focused tests |
| `docs/evidence/ct-web-live-02/*` | This note and screenshots |

`siteConfig.ts`, CSS, routing and every protected file are untouched.

## Behaviour

| `siteConfig` state | Primary (blue) | Secondary |
|---|---|---|
| `bookingUrl` non-empty | **Book a call** → booking URL (new tab) | Email us · WhatsApp (unchanged from today) |
| `bookingUrl` empty, `whatsappUrl` set | **Discuss a project** → WhatsApp (new tab) | Email us. No separate WhatsApp button |
| neither | **Email us** | — |
| no channels | nothing rendered | — |

New-tab links carry `rel="noopener noreferrer"` and an accessible name ending "(opens in a new tab)" that starts with the visible label. Arrow icons are `aria-hidden`.

## Interface for Codex (siteConfig owner)

`ContactActions` reads `siteConfig.bookingUrl`, `whatsappUrl` and `contactEmail` by default; the props exist only for tests. **"Verified booking URL" means `siteConfig.bookingUrl` is non-empty.** To switch production to the fallback, `siteConfig.bookingUrl` must resolve to `''` when the booking page is not verified. Today an empty `VITE_PUBLIC_BOOKING_URL` falls back to the hardcoded calendar default, so this needs Codex's change in `siteConfig.ts` (for example an empty default or an explicit verification flag). The screenshots of the fallback were produced locally with `VITE_PUBLIC_BOOKING_URL=unverified`, which `httpsUrl()` rejects to `''`; no source change was used.

## Evidence

- `booking-desktop-1024.jpg`, `booking-mobile-375.jpg`: default configuration.
- `fallback-desktop-1024.jpg`, `fallback-mobile-375.jpg`: booking unset.
- `fallback-keyboard-focus.png`: Tab from the paragraph lands on "Discuss a project"; 2 px focus ring (`:focus-visible`).
- Both states: no horizontal overflow at 375 and 1024 px, buttons 44 px high, console clean. No new motion; existing `prefers-reduced-motion` rules apply unchanged.

## Checks run on the branch

- `npm --prefix frontend test`: 11 files, 34 tests passed (7 new).
- `npm run typecheck`: pass. `npm run lint`: pass (632 files).
- `npx jest tests/public-release-boundary.test.js`: 2 passed (protected set unchanged).
