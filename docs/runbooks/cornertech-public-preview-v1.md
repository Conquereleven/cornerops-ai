# CornerTech AI public preview v1

A static, public-only build of the informational site for Founder review on a temporary URL. **Nothing has been deployed.** Publishing it is a Founder decision.

## What the build is

```bash
npm --prefix frontend ci
npm --prefix frontend run build:public   # output: frontend/dist-public
```

- Only `/` and a 404 page. `/login`, `/auth/callback`, `/access-pending` and `/app/*` do not exist in this build; the workspace code and the Supabase client are not in the bundle.
- No sign-in link, no API call, no Supabase, no backend.
- No canonical URL, `og:url` or sitemap (`VITE_PUBLIC_SITE_URL` is empty in `frontend/.env.public-preview`).
- `robots.txt` disallows everything and `_headers` sends `X-Robots-Tag: noindex`, so a temporary URL is not indexed. Remove both when the site moves to its real domain.
- `_redirects` gives single-page fallback; `_headers` also forbids framing.
- Contact channels are the temporary ones in `siteConfig.ts`. Override with `VITE_PUBLIC_*` at build time once the corporate domain and mailbox exist.

It does not touch Railway, Supabase or production, and it does not depend on PR #91 being merged or deployed.

## Recommended host: Cloudflare Pages

Static hosting with a free tier, a `*.pages.dev` URL, and native support for the `_headers` and `_redirects` files this build emits. Expected cost for this site: none. Netlify works the same way with the same two files. A second Railway service was rejected: it is usage-billed and would live next to production.

Two ways to publish, both Founder actions:

1. **Direct upload (no repository access granted):** build locally and upload `frontend/dist-public` as a new Pages project.
2. **Git integration:** connect the repository, branch `feature/cornertech-public-site-v1`, build command `npm --prefix frontend ci && npm --prefix frontend run build:public`, output directory `frontend/dist-public`, Node 22. This grants Cloudflare read access to the repository.

Direct upload is the smaller commitment for a review preview.

## Check after publishing

- `/` renders at desktop, tablet and phone widths with no horizontal scroll.
- Booking, email and WhatsApp links are the intended ones.
- `/login` and `/app/sales` show the 404 page.
- Response headers include `X-Robots-Tag: noindex`.
- The browser network panel shows no request to `/api`.

## Taking it down

Delete the Pages project. Nothing else references it.
