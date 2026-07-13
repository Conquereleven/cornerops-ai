# Wave 1 Catalog Security Boundary v1.14

## Data Boundary

All mutations remain in `cornerops_internal`. CornerMex public tables remain read-only. Runtime uses the restricted PostgreSQL role and never a Supabase service-role key.

## Source Safety

- Only HTTPS official seller hostnames and approved public storefront CDNs are accepted.
- Search results, credential-bearing URLs, private APIs, logins, CAPTCHA bypass and anti-bot circumvention are prohibited.
- Product text is bounded and sanitized data, never instructions.
- Source and asset evidence uses SHA-256 checksums.

## Media Safety

Only JPEG, PNG and WebP under 5 MB are eligible. MIME and magic bytes must agree. HTML, SVG, executable content, disallowed hosts and duplicate payloads are rejected or reused safely. Downloaded binaries are never committed.

## Mutation Controls

- Operator authentication plus separate Founder Action authentication
- exact origin, JSON content type and rate limit
- Approval before every catalog extension
- application remains a distinct authenticated step
- append-only audit and immutable inventory ledger
- Work Queue and Approval decisions remain `executed:false`

## Claims

Operational inventory is never seller-confirmed or physically verified. Public prices are never wholesale or negotiated. Seller comparison is never complete-market comparison.

## Disabled Capabilities

Seller/customer contact, email, WhatsApp, Auth-user creation, RFQs, carts, orders, purchasing, quote generation, CornerMex product activation and OpenClaw remain disabled.
