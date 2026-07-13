# Seller Catalog Ingestion v1.13

Offline flow: official source resolution, bounded capture, deterministic normalization, checksum, package preview, Work Queue review, founder approval, then append-only application. Limits are 32 sellers, 250 products per seller, 2,000 products total, three images per product, 5 MB per image, concurrency three, one-second domain delay and one retry. HTTP 401/403, CAPTCHA and login requirements are terminal blocks.

Public prices are labeled `public_web_price`; no wholesale, cost, FX, unit or availability inference is allowed. Product hypotheses are never catalog records.
