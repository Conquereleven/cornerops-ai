# CO-1.17A Commercial Operations Core Acceptance

Branch: `feature/cornerops-v1.17a-commercial-operations`

Base: `8ae0d4966edfbc70c9da1b561b87eb7114e23a2c`

## Implemented

- Versioned JSON/CSV account and SKU input with per-record errors, duplicate detection, preview,
  checksum and explicit confirmation.
- Opportunity, quote, order, payment, fulfillment, exception and Daily Close contracts.
- Deterministic totals and evidence gates; unknown commercial facts remain unknown.
- Stable order, payment, fulfillment, exception, Work Queue and approval keys.
- Independent Work Queue reconciliation scopes for quote, order/fulfillment and exception conditions.
- Explicit CornerMex commercial-owner, Intermex warehouse-custodian and separate carrier roles.
- Manual evidence-gated Intermex handoff and warehouse lifecycle; no automated integration.
- Separate COD collection/remittance and Bank Transfer settlement semantics.
- Destination-aware shipping and freshness-bounded inventory evidence.
- Commercial Founder Daily separates quotes, pending revenue, confirmed revenue and cash.
- Existing Command Center extended with commercial modules; no second dashboard.
- Private PostgreSQL migration proposed with forward/rollback instructions; not applied.
- Deterministic demo labeled `COMMERCIAL_DEMO_DATA_NOT_PRODUCTION` and disabled in production.

## Human boundary

Humans may create and approve internal records, export a quote, confirm a manual send, record
payment evidence, record Intermex/carrier milestones with attributable evidence and resolve exceptions with evidence. CornerOps cannot send
email/WhatsApp, capture/refund money, buy inventory, create shipments, contact another party,
activate products, change external prices or write CornerMex.

## Required business inputs

Joel must provide actual priority B2B accounts, launch SKUs, costs, approved prices, MOQs,
inventory evidence, payment terms, shipping rules, owners, SLAs and regulatory restrictions.
Nothing is generated to reach the 10-account or 18-SKU targets.

## Activation

Production activation is deferred. It requires separate migration approval, grant introspection,
rolled-back forbidden-operation probes, business input review and explicit enablement of
`CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED`. No platform action belongs to this PR.

## Remediation status

Sonnet exact-head findings on Work Queue reconciliation, Intermex roles/lifecycle, external
evidence, COD remittance, destination shipping, exception taxonomy and inventory freshness are
implemented and covered by focused regression tests. The migration remains review-only and
unapplied; real Intermex references, carrier configuration, rates and inventory reports remain
founder-provided.

R3 adds canonical evidence subject binding and a durable anti-replay registry. Exact retries reuse
the accepted fulfillment/payment result. Conflicting reuse across orders, fulfillment records,
states, amounts, currencies or methods is rejected and surfaced as a stable exception. COD and
Bank Transfer identity no longer depends on caller `paymentId`; validated integer minor units back
settlement arithmetic, and overpayment remains a non-cash discrepancy. Founder Daily and Daily
Close expose integrity blockers without raw financial references.

Final status: `cornerops_v1_17a_evidence_integrity_ready_for_sonnet_rereview`

## Final validation

- Focused remediation: 2 suites / 41 tests passed.
- Focused commercial API: aggregate 3 suites / 44 tests passed.
- R3 adversarial memory suite: 1 suite / 33 tests passed.
- R3 disposable PostgreSQL suite: 1 suite / 3 tests passed, including concurrent duplicate
  remittance, append-only probes and runtime-grant introspection.
- Backend: 129 suites passed of 131; 2 skipped. 724 tests passed of 729; 5 skipped.
- Frontend: 8 files / 16 tests passed.
- Lint: 615 JavaScript files passed; typecheck and build passed.
- Migration SHA-256: `afa0d41f51f098d8f70762ff6df4b26336c4fb742621321a8a64f7b1282430c2`.
- Migrations applied, deployments, platform writes and external sends: zero.
