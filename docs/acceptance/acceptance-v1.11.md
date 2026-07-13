# Acceptance v1.11

- Starting main: `32112567c9b74c422d20c4f049e1c8dc61aa7e3c`
- Branch: `feature/supplygraph-match-engine-v1.11`
- Engine: `supplygraph-match-v1.11.0`
- Scope: one verified supplier; no market comparison or best-supplier claim.
- Safety: CornerMex writes, external actions, contact, quotes, purchasing, activation and OpenClaw blocked.

## Validation and release evidence

- Focused tests: 7 suites / 33 tests passed.
- Complete gate: syntax 562 JavaScript files; frontend typecheck/build; 111 suites / 547 tests passed.
- Migration checksum: `618b6865d795219e526d9750d545d7dbecea36e30fa6fac1b507d0dff0860947`.
- Migration review: `approved_for_application`; applied once as `20260713045221_supplygraph_match_engine_v111`.
- Tables created: `sourcing_match_runs`, `sourcing_match_item_results`, `sourcing_match_candidates`, and
  `sourcing_recommendations` in `cornerops_internal`.
- Runtime grants: `SELECT, INSERT` only. Rolled-back runtime probes allowed `SELECT` and denied `UPDATE`,
  `DELETE`, `TRUNCATE`, and DDL. `public`, `anon`, `authenticated`, and `service_role` have no schema or
  matching-table access.
- Supabase advisors: no new matching-engine security finding. Performance advisor reported informational
  uncovered foreign keys; the focused run/history/rank/identity indexes required by the API are present.
- Railway activation: `SUPPLYGRAPH_MATCHING_ENABLED=true`, maximum candidates `5`; deployment succeeded.
- Authentication matrix: missing operator `401`, missing founder `401`, invalid founder `403`, invalid exact
  origin `403`, non-JSON `415`, authenticated request `201`.

## Production acceptance

- Acceptance demand: two sanitized equal-unit items; no PII or customer/supplier contact data.
- First corrected run: `6b24b5dc-53d0-4ed0-8bce-b44daeac69d4`; fingerprint prefix `192ee7306b3c`.
- Exact catalog item: `catalog_match_found`, Match Score `72.00`, Confidence Score `47.50`.
- Deliberately nonexistent item: `no_catalog_match`, Match Score `43.60`, Confidence Score `47.50`.
- Aggregate: Match Score `57.80`, Confidence Score `47.50`, one matched, zero ambiguous, one unmatched,
  `catalog_coverage_partial`, recommendation `mixed_coverage_review`.
- Scope invariants: `single_verified_supplier`, supplier count `1`, no market comparison and no best-supplier
  claim. Unknown stock, MOQ, lead time, and shelf life remain human-verification requirements.
- Identical request returned `200`, reused the same run and fingerprint. Priority/version change created run
  `7700f298-50b5-4380-96db-088849c3e84f`; stale version returned `409`; both historical runs remained readable.
- Work Queue review, supplier-fact verification, alternative research, pending approval, and append-only audit
  were created atomically. Founder approval returned `approved`, `executed:false`; conflicting decision returned
  `409` and caused no downstream action.
- A production acceptance run exposed nested PostgreSQL offer JSON remaining in snake_case. PR #56 normalized
  that store boundary and added a PostgreSQL-shaped regression test; CI passed before the corrected acceptance.
- After redeploy, both run IDs, scores, recommendation, approval, and audit were unchanged. Acceptance demand
  was then closed without external action.
- CornerMex aggregates before and after remained `products=199`, `orders=5`, `customers=4`, `b2b_leads=0`.
  The sanitized read-only check stayed connected with writes and external sends blocked.
- Kill switch is covered by the focused test: disabled POST returns `503` with zero match writes while historical
  reads remain available. Production was restored to enabled after verification.
- Lovable single-pass execution was attempted once after backend acceptance and returned `403 insufficient_scope`
  because the connector lacks `projects:write`. No UI generation or credit-consuming retry was performed.

Final release state: `supplygraph_v1_11_live_backend_lovable_pending`.
