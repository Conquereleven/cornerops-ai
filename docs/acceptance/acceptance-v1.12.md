# Acceptance v1.12

## Build Record

- Starting main: `b88791ca2b9cfdaba1269a6aa055c4f5d7dc9fe4`
- Branch: `feature/supplygraph-supplier-evidence-v1.12`
- Evidence model: `supplygraph-evidence-v1.12.0`
- Match engine: `supplygraph-match-v1.12.0`
- Migration: `20260713070000_supplygraph_supplier_evidence_v112.sql`
- Migration SHA-256: `92522d3a25acd985c63837083a884d8e861acf7d39854013cd4a0193dea59ae7`
- Migration review: `approved_for_application`
- Lovable executions: `0`

## Required Evidence

- Focused validation, resolver, workflow, migration, API and match regression tests pass.
- Full lint, typecheck, build and Jest gate pass once after implementation.
- Migration review result and SHA-256 are recorded before application.
- Supabase migration, advisors, grants and forbidden-operation probes are verified.
- Railway flags and one deployment are verified.
- Package A production no-change preview, Approval and application persist.
- Package B acceptance-test application is isolated from production resolution.
- Verified evidence raises Confidence Score in local fixture without changing Match Score.
- Work Queue, Approval and audit records remain non-executing and durable after restart.
- CornerMex counts/read-only checks remain unchanged.
- Supplier/customer contact, quotes, purchasing, activation, sends and OpenClaw remain blocked.

## Production Record

- Implementation PR: `#58`, merged at `ae3e217` after 2/2 CI checks passed.
- Migration applied once to Supabase project `nhxpujypqxbjiqqddxqt`.
- Runtime role: `cornerops_internal_app`; delete, fact update and application truncate probes returned `42501` and rolled back.
- Advisors: no new critical v1.12 security finding; new-table unused-index notices are expected before traffic. Existing unrelated public-schema and v1.11 index notices remain open.
- Railway deployment: `334603a5-0e21-4ec3-95da-03362f803059`, online with both evidence flags enabled.
- Package A: `5748dbee-1f85-4c87-892e-004c26f2dd93`, production, approved, `no_material_change`, conflict count `0`.
- Package B: `47ee1cd6-fc3a-44e2-8065-0207f8410da7`, acceptance test, approved, `acceptance_test_only`, conflict count `0`.
- Conflicting second Approval decision returned `409 APPROVAL_CONFLICT`.
- Production evidence after A/B contains one price fact only; synthetic stock/MOQ/lead time did not enter production resolution.
- Work Queue: two evidence-review items, zero automatic rematch items.
- Audit: two package-created and two package-applied events persisted.
- Restart verification: packages, applications, approvals, Work Queue and audit remained available over HTTP `200`.
- SupplyGraph remained one verified supplier and 190 catalog items; market comparison remained unavailable.
- CornerMex remained `real_read_only` with 9 readable public products, writes blocked and external sends blocked.
- Kill switches passed locally; production was restored/left enabled after verification.
- Lovable executions: `0`; consolidated prompt remains pending.
