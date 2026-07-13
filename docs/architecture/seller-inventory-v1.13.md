# Seller Inventory v1.13

Inventory uses an append-only ledger and derived balance. Founder initialization is exactly 100 `operational_units` per new product with `physical_count_verified=false`. The idempotency key prevents resetting existing balances; Intermex inventory is preserved. Inventory is not a physical count or availability promise.
