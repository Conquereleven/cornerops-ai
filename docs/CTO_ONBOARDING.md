# CTO onboarding | CornerOps AI

**Snapshot:** 18 October 2026. **Visibility:** PUBLIC. This document contains only architecture and workflow information already suitable for the repository; it is not an operational access handover.

## Purpose and product boundaries

CornerOps AI is a controllable operational intelligence layer for the CornerMex commerce ecosystem. It integrates business data, agent execution patterns, human approvals, audit and an operator console. Under the CornerTech AI company umbrella, it is a product/technology asset, not a substitute for customer-facing systems or a claim of shared production databases.

Do not confuse the CornerOps AI repository with the separate 3L client application, Golositalia POS or independent CornerTech Trade Products architecture. Proposed interoperability needs design review, explicit contracts and data isolation.

## Architecture map

| Concern | Entry points | Review focus |
| --- | --- | --- |
| HTTP/runtime | `src/server.js`, `src/app.js`, `src/api/`, `src/routes/` | Auth boundary, policies, error semantics |
| Orchestration | `src/services/`, `src/core/`, `src/controllers/` | Intent/workflow routing, approvals and idempotency |
| External adapters | `src/integrations/`, `src/adapters/` | Real vs mock, retries, least privilege |
| Data access | `src/data/`, `supabase/`, `contracts/` | Source provenance, Postgres authority, read/write separation |
| Operator UI | `frontend/` | Exposure of evidence, source labeling and approval states |
| QA | `tests/`, `scripts/` | Negative-path checks, safe demo-mode behavior |

Architecture references: [system overview](architecture/overview.md), [commercial operations](architecture/commercial-operations-core-v1.17a.md), [controlled actions](architecture/controlled-actions-v0.9.md), [business data read-only](architecture/business-data-read-only.md).

## Core technical principles

1. Data origins must be explicitly labeled `mock`, `real_read_only`, `mixed` or the repository's more precise source mode. Never promote fixture results to customer truth.
2. Agent or provider access is not permission to execute a business action. Use allowlists, authenticated operators, approvals, audit and durable idempotency.
3. The Commercial Operations Core models account → opportunity → quote → authorization → order → payment evidence → fulfillment → exception → close. Inspect immutable evidence fingerprinting and discrepancy handling before proposing change.
4. OpenClaw is a gateway/execution boundary, not the source of truth for commerce, identity or permissions.
5. Supabase/Postgres, local JSON and in-memory modes have different durability guarantees. Do not treat them as equivalent for enterprise readiness.

## Safe local start

Use Node.js 18+ / npm 9+ per the repository instructions. Clone locally without inserting live credentials:

~~~bash
npm install
npm --prefix frontend install
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build
npm run demo:commercial-operations
~~~

The final command is an explicitly non-production demo. The broader README includes local `dev` and founder-mode commands, which should be considered only in a separately authorized, isolated local configuration.

## CTO diligence questions

- Which flows are executed on real data, which are mock, and which remain read-only?
- Where are trust boundaries between operators, automations, AI models, OpenClaw, partner data and customer systems?
- Is there a single source of truth for orders, product pricing, payable amounts and settlement evidence?
- Does a provider timeout or unknown result remain unresolved without duplicate writes/actions?
- How are credentials, audit retention, role permissions, tenant isolation and incident response handled?
- How mature are the CI pipelines, production observability, database migrations and disaster recovery?
- What should CornerTech AI productize next versus retire, deprecate or extract, based on validated demand and maintainability?

## Suggested review outcome

Produce a short architecture inventory, risks by severity (security, data integrity, maintainability and scalability), integration-boundary diagram, test-evidence table, and a prioritized 30/60/90-day recommendation. Treat these as review proposals until leadership accepts them.

**CEO-approved GitHub access for Eric:** code **read/write** access is authorized for this repository, including dedicated branches, commits and pull requests. This is distinct from approvals to merge to `main`, activate external business operations, access private databases or secrets, change connected accounts, or deploy to Production. Respect existing approval and review gates; the CTO role itself remains prospective.
