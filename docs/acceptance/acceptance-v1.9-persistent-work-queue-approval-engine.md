# Acceptance v1.9: Persistent Work Queue + Approval Engine

## Delivery state

- Branch: `feature/persistent-work-queue-approval-engine-v1.9`
- Persistence selection: existing Supabase PostgreSQL project, private `cornerops_internal` schema
- Current production state: no internal schema, restricted login, DB URL, or founder-action hash yet
- Migration state: `migration_review_required`; not applied
- Deployment state: not deployed; v1.8.1 remains production

## Implemented

- Durable PostgreSQL adapter with internal table allowlist
- Fail-closed unconfigured production adapter; no file/memory fallback
- Work item, approval, and append-only audit model
- Deterministic idempotency plus database unique constraint
- Row locking for concurrent sync and optimistic version checks for PATCH
- Persistent drafts represented by safe payload (`not_sent`, external send false)
- Separate founder-action hash authentication, JSON enforcement, rate limiting, and denial audit
- Read/list/sync/update/approval/audit/draft endpoints
- Lovable v1.9 Work Queue, persistent approvals/drafts/audit and dashboard metrics requested

## Lovable result

- Project: private `CornerOps Dashboard` (`de6bc54c-b2d7-4527-b464-adf97760ec25`)
- Lovable commit: `b72dbc7392a33f33c694ba0a894339bfe0ab1374`
- Preview: `https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`
- Typecheck: clean
- Visual QA: Work Queue renders honest migration-pending state, empty metrics, disabled sync,
  internal-only safety labels, filters, and no console errors
- Founder-action credential: sessionStorage only; it survives refresh and is never placed in
  localStorage
- Live response normalizers preserve raw v1.9 shapes and never merge invented mock records over a
  successful response

## Initial recommendations

Work items are materialized only from the live Action Engine. Current supported evidence includes
the real 190 imported Intermex drafts, product image/category readiness where exposed, first launch
batch review, founder payment/fulfillment readiness, and B2B/quote candidates only when readable.
No records are invented.

## Safety proof

- Migration references only `cornerops_internal`.
- Adapter rejects `public` and non-allowlisted tables.
- Approval responses always report `executed: false`.
- External sends and CornerMex production mutations have no execution path.
- Product activation remains recommendation-only.
- No secrets were added to source control.

## Validation

Focused v1.9 tests cover idempotency, concurrent sync, condition clear/reopen, optimistic conflicts,
service reconstruction, approvals, audit, drafts, auth separation, and migration scope.

- Backend Jest: 103 suites / 509 tests passed
- Syntax/lint: 542 JavaScript files passed
- Frontend TypeScript: passed
- Frontend build: passed
- Founder Review: passed in `real_read_only_partial`, writes/sends blocked
- Catalog report with expected count 190: passed; 199 readable rows are reported honestly as a
  mismatch (190 imported drafts plus 9 active), with no mutation
- Lovable typecheck and preview QA: passed

## Remaining production gate

1. Review and approve the migration.
2. Apply it to project `nhxpujypqxbjiqqddxqt`.
3. Run Supabase security/performance advisors.
4. Provision a restricted login granted only `cornerops_internal_runtime`.
5. Set its URL and the founder-action hash only in Railway.
6. Deploy, sync, verify reuse, decide an internal approval, and verify persistence after redeploy.

Final status: `migration_review_required`.
