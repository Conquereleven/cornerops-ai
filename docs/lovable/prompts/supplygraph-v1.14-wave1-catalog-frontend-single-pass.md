# SupplyGraph v1.14 Wave 1 Frontend Single-Pass Prompt

Current project: CornerOps Dashboard. The repository already has working navigation, authentication, design tokens, an authenticated API client and SupplyGraph pages. Backend contracts are frozen and production data is live.

Objective: refine only the existing SupplyGraph seller-network experience for these routes: `/authorized-sellers`, `/authorized-sellers/:sellerId`, `/seller-catalog`, `/seller-inventory`, `/seller-comparison`.

Reuse the current AppShell, Sidebar, StatusBadge, table, panel and API client. Live endpoints:

- `/api/intelligence/supplygraph/wave1-activation`
- `/api/intelligence/supplygraph/sellers/:id/catalog-health`
- `/api/intelligence/supplygraph/sellers/:id/catalog`
- `/api/intelligence/supplygraph/sellers/:id/inventory`
- `/api/intelligence/supplygraph/sellers/:id/media-status`
- `/api/intelligence/supplygraph/catalog`
- `/api/intelligence/supplygraph/inventory/initialization-status`
- `/api/intelligence/supplygraph/match-runs`

Use existing bearer-token behavior and backend URL settings. Never store or expose credentials. Use live APIs only: no mock sellers, products, images, counts or inventory.

Required views: network overview and Wave 1 board; seller directory and detail; catalog with public price type/source; operational inventory with founder-initialized and physical-count-not-verified labels; comparison with evaluated sellers, scores, confidence, inventory provenance, ties and split-sourcing indication.

Always display: `Verified Seller Scope, Not Complete Market`, writes blocked, external contact blocked, market comparison false and best-seller claim false. Sending, purchasing, quoting and activation controls stay absent or disabled.

Provide accessible loading, empty, partial-data and error states. Keep keyboard navigation, semantic tables, focus visibility, responsive desktop/laptop layout and readable contrast. Preserve working authentication, backend settings, navigation, design language and unrelated pages.

Do not add dependencies, another API client, another design system, mock data, secrets, new backend contracts, Basket Optimizer, external actions or unrelated redesign. Modify the minimum necessary files and return the changed-file list plus typecheck/build result.

“Make one cohesive implementation pass. Do not redesign or regenerate unrelated areas. Reuse existing code and components wherever possible to minimize Lovable credits, code churn and regression risk.”

Acceptance: TypeScript passes, production build passes, all five routes render from live API data, missing media uses neutral fallback, no hard-coded production values exist and no credential is embedded.
