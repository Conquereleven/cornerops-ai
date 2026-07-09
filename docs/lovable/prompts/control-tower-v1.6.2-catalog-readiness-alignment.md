# Lovable Prompt: Control Tower Catalog Readiness Alignment v1.6.2

Build/update the CornerOps Control Tower dashboard display using only the CornerOps backend contract. Do not invent product counts. Do not duplicate backend logic. Do not hardcode `149` as truth unless the backend response exposes it as `expectedFounderProductCount`.

Do not update production data, Supabase, CornerMex marketplace, Telegram, WhatsApp, email, OpenClaw, or customer channels. This is dashboard display alignment only.

## Data Source Rules

Use the backend responses from:

- Founder Review / founder daily contract
- catalog read report contract if exposed
- Control Tower frontend API contract

Display these fields when present:

- `operatingStage`
- `launchDate`
- `daysToLaunch`
- `launchReadinessScore`
- `launchReadinessStatus`
- `catalogReadiness`
- `expectedFounderProductCount`
- `readableProductCount`
- `productCountMismatch`
- `productCountMismatchWarning`
- `catalogReadModelStatus`
- `sourceSummary`
- `sources`
- `launchRisks`
- `launchActions`
- `missingData`
- `safetyPosture`

## Required Dashboard Display

Add or update the pre-launch Founder Review panel with:

1. Pre-launch Founder Review status
2. Launch countdown using `launchDate` and `daysToLaunch`
3. Launch readiness score and status
4. Catalog readiness card
5. Expected product count from `expectedFounderProductCount`
6. Readable product count from `readableProductCount` or `catalogReadiness.productCount`
7. Product count mismatch warning from `productCountMismatchWarning`
8. Discovered catalog/product sources from `sourceSummary` or `sources`
9. Launch risks
10. Founder launch actions
11. Missing launch data
12. Safety posture:
    - read-only
    - writes blocked
    - external sends blocked
    - PII masked
    - no customer channels

## Mismatch Handling

If `productCountMismatch` is true or `catalogReadModelStatus` is `partial`, show this exact dashboard instruction:

> Show catalog read model as partial. Do not present launch readiness as final.

Use a visible warning pill:

- Label: `Catalog partial`
- Tone: warning/high
- Explanation: show `productCountMismatchWarning`

If the mismatch is resolved and `catalogReadModelStatus` is `reconciled`, show this exact dashboard instruction:

> Use the reconciled catalog count as the basis for catalog readiness.

## Current v1.6.2 Evidence to Represent If Backend Exposes It

The current backend may report:

- `expectedFounderProductCount`: `149`
- `readableProductCount`: `9`
- primary source: `cornerops_products_v`
- primary source count: `9`
- base `products` count: `0`
- auxiliary product sources such as `product_translations`, `product_variants`, `catalog_events`, `import_batches`, `product_imports`, `catalog_imports` unavailable/missing from read-only schema cache

Do not hardcode those values. Only display them if returned by the backend.

## UI Guidance

- Dark internal cockpit style
- Compact, high-signal cards
- Clear source-mode labels
- Show audit IDs when present
- Keep disabled actions visibly disabled
- Do not add fields for secrets
- Do not add send buttons for WhatsApp/email
- Do not imply production writes are available

## Copy Guidance

Use wording like:

- `Catalog read model: partial`
- `Readable products: 9`
- `Expected founder count: 149`
- `Launch readiness is not final until catalog count is reconciled.`
- `Writes blocked`
- `External sends blocked`
- `Read-only source`

Again: values are examples from backend evidence. The frontend must render backend values, not hardcoded assumptions.
