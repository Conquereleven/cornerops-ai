# Lovable single-pass prompt: SupplyGraph v1.10

Update the existing CornerOps Dashboard in one focused pass after the backend v1.10 contracts are live.
Reuse the current layout, navigation, tables, filters, status cards, safety labels, Settings credentials,
token behavior, error states and empty states. Do not redesign unrelated screens or create duplicate
navigation/components.

Add SupplyGraph views backed only by the live endpoints documented in
`docs/api/supplygraph-v1.10.md`:

1. Suppliers: canonical identity, source, verification and observation date.
2. Catalog: supplier, product identity, latest observed commercial facts and provenance.
3. Demand Requests: status, priority, emirate, segment, missing fields, items and versions.
4. Data Quality: counts, freshness, missing price/stock/MOQ/lead-time/shelf-life and source states.

Requirements:

- Create no mock suppliers or demand requests.
- Show honest empty, partial, unavailable and configuration-required states.
- Display `unknown` rather than zero for unproven facts.
- Label matching and quote generation `not implemented`.
- Label supplier outreach and autonomous purchasing `blocked`.
- Preserve operator-token reads and Founder Action Token mutations without exposing credentials.
- Keep all dangerous actions disabled and approval-oriented.
- Do not add service-role credentials or direct Supabase writes.
- Run one typecheck, one build and one visual QA pass.
- Preserve structure and avoid unrelated refactors or repeated iterations.
