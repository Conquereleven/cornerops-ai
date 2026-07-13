# Frontend Production Hosting v1.14

## Decision

Serve the existing Vite SPA from the same Railway Node service.

## Build

Railway runs:

```bash
npm --prefix frontend ci && npm --prefix frontend run build
```

The Node service starts with `npm start` and serves `frontend/dist` only when:

```env
CORNEROPS_FRONTEND_SERVE_ENABLED=true
```

## Routing Boundary

- API routers execute before static handling.
- SPA fallback accepts only `GET` requests that accept `text/html` and are outside `/api`.
- Unknown `/api` routes remain JSON 404 responses.
- Hashed assets receive immutable caching; `index.html` is never aggressively cached.
- Existing CORS, authentication, security headers and request logging remain intact.

Required routes:

- `/authorized-sellers`
- `/authorized-sellers/:sellerId`
- `/seller-catalog`
- `/seller-inventory`
- `/seller-comparison`

## Data And Authentication

The frontend uses the existing authenticated API client and live `/api/intelligence/supplygraph/*` endpoints. It embeds no token, key, count, product, image or inventory fixture.

## Rollback

Set `CORNEROPS_FRONTEND_SERVE_ENABLED=false` and redeploy. Backend APIs remain available and unchanged.
