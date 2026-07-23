# CornerOps v1.17A Post-Merge Production Acceptance

## Executive verdict

Verdict: `ACCEPT_WITH_LOW_FINDINGS`.

PR #78 is merged, the reviewed implementation is contained in current `main`, GitHub CI passed,
and Railway is running the exact accepted merge SHA. Production health is good. Commercial
Operations is inactive: the activation and demo flags are false, the commercial migration is not
recorded or present even partially, and no commercial record can exist because its three tables do
not exist. No Critical or High finding or stop condition was observed.

Three non-activating findings remain: there is no dedicated readiness route; the authenticated
commercial response envelope statically advertises `readOnly=false`, `dryRun=false`, and
`writesBlocked=false` even while the feature flag blocks every mutation; and the existing rollback
runbook says to drop “the two commercial tables” although the proposed migration creates three.
These findings must be corrected and reviewed before a future activation but do not make a
commercial mutation reachable in the accepted production state.

Evidence captured on `2026-07-23` in `America/Mexico_City`. This sprint performed inspection and
documentation only; it did not authorize or perform activation.

## Git and merge identity

| Field | Result | Evidence |
| --- | --- | --- |
| Repository | `Conquereleven/cornerops-ai` | `VERIFIED_LOCAL`, `VERIFIED_GITHUB` |
| Agent/model | Codex / GPT-5 | `AGENT_REPORTED` |
| GitHub identity | `Conquereleven` | `VERIFIED_GITHUB` |
| PR | `#78`, `MERGED` at `2026-07-23T14:32:28Z` | `VERIFIED_GITHUB` |
| PR title | `feat: add commercial operations core v1.17` | `VERIFIED_GITHUB` |
| Reviewed head | `5f1cbc65693483bb80f44e1e32d51b98b2a16aee` | `VERIFIED_GITHUB` |
| Merge commit | `7bb5bde197a966a0e864a500a055b13f1fdf7843` | `VERIFIED_GITHUB`, `VERIFIED_LOCAL` |
| Current `origin/main` | `7bb5bde197a966a0e864a500a055b13f1fdf7843` | `VERIFIED_LOCAL` |
| Commits after merge | None | `VERIFIED_LOCAL` |
| Reviewed head ancestry | Ancestor of merge commit | `VERIFIED_LOCAL` |
| Review threads | Zero total; therefore zero unresolved Critical/High threads | `VERIFIED_GITHUB` |

There is no post-merge commercial, deployment, database, flag, or runtime drift to classify.

## Package-manager gate

- `pnpm --version`: `11.15.1`; disposition: `VERIFIED_AVAILABLE_NOT_ADOPTED`.
- Repository npm version used for local commands: `11.17.0`.
- Root and frontend `package-lock.json` remain present. Their SHA-256 values are respectively
  `ff88a28bc2ac53e3c55aedf25f1706720a3e150ec426f3779e7dc633366e8ae1` and
  `ef7f542b4b55a779b7af5112d0fe65c36ef8cf9637ae1443a6cde8f542e6ac1` before and after local checks.
- No `pnpm-lock.yaml` exists and root `package.json` has no `packageManager` field.
- CI and Railway continue to use npm. No install, package script, lockfile, CI, Railway, or build
  command was changed in this sprint.

## CI integrity

CI is accepted for both the reviewed head and current `main` (`VERIFIED_GITHUB`).

| SHA / event | Run | Conclusion | Covered gates |
| --- | --- | --- | --- |
| `5f1cbc6` / push | `30014807285` | `SUCCESS` | npm install, lint, typecheck, backend tests, frontend tests, build, safe demos |
| `5f1cbc6` / pull request | `30014811439` | `SUCCESS` | Same complete CI job |
| `7bb5bde` / push to `main` | `30016303319` | `SUCCESS` | Same complete CI job |

The current-main job completed at `2026-07-23T14:33:50Z`. Scheduled production-watch runs
`30022676788`, `30028996688`, and `30037113237` also completed successfully against the same SHA.

Focused local verification used existing installed dependencies without an install:

- `npm run lint`: 615 JavaScript files passed.
- Four focused commercial suites: 4/4 suites and 84/84 tests passed.
- The focused API suite verified unauthenticated read denial, read-only preview behavior, founder
  authentication, missing-migration fail-closed behavior, and exact-origin denial.
- CI remains the source of truth for the full typecheck, frontend test, backend test, and build gates.

## Railway deployment identity

| Field | Result | Evidence |
| --- | --- | --- |
| Project | `CornerOps AI` | `VERIFIED_RAILWAY` |
| Environment | `production` | `VERIFIED_RAILWAY` |
| Service | `cornerops-ai` | `VERIFIED_RAILWAY` |
| Deployment ID | `88c49401-f0fc-4f04-ba90-1fb03524c70d` | `VERIFIED_RAILWAY` |
| Status / instance | `SUCCESS` / `RUNNING` | `VERIFIED_RAILWAY` |
| Created | `2026-07-23T14:32:31.209Z` | `VERIFIED_RAILWAY` |
| Source SHA | `7bb5bde197a966a0e864a500a055b13f1fdf7843` | `VERIFIED_RAILWAY` |
| Expected SHA | `7bb5bde197a966a0e864a500a055b13f1fdf7843` | `VERIFIED_LOCAL` |
| Previous deployment | `b434f2f5-8ba8-4ac9-b259-ba54fdb51fc7`, `REMOVED`, SHA `8ae0d4966edfbc70c9da1b561b87eb7114e23a2c` | `VERIFIED_RAILWAY` |
| Deployments caused by merge | One | `VERIFIED_RAILWAY` |
| Current running deployment | `88c49401-f0fc-4f04-ba90-1fb03524c70d` | `VERIFIED_RAILWAY` |

Railway built with `npm --prefix frontend ci && npm --prefix frontend run build`, starts with
`npm start`, and uses `/api/health` as its healthcheck. There is no pre-deploy migration command.

## Runtime health and readiness

All probes were GET-only (`VERIFIED_RUNTIME`).

| Route | HTTP | Result |
| --- | ---: | --- |
| `/api/health` | 200 | JSON `status=ok`; no stack or secret-like match |
| `/health` | 200 | JSON `status=ok`; no stack or secret-like match |
| `/api/ready` | 404 | JSON route-not-found; dedicated readiness is absent |
| `/api/readiness` | 404 | JSON route-not-found; dedicated readiness is absent |
| `/` | 200 | Production frontend HTML loaded |
| `/api/intelligence/commercial/status` without credentials | 401 | Fails closed with `CONTROL_TOWER_FRONTEND_TOKEN_MISSING`, `writesBlocked=true`, and `externalSendsBlocked=true` |

Railway readiness is currently represented only by the `/api/health` deployment healthcheck. The
missing application readiness route is recorded as a Low residual and was not repaired.

## Effective commercial and execution flags

Only non-secret effective booleans were inspected (`VERIFIED_RAILWAY`, `VERIFIED_LOCAL`).

| Control | Effective state |
| --- | --- |
| `CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED` | `false` (variable absent; fail-closed default) |
| `CORNEROPS_COMMERCIAL_DEMO_ENABLED` | `false` |
| Commercial shipping fallback / COD compatibility | `false` / `false`; version `unconfigured` |
| Controlled actions | `false`; dry-run `true`; local internal writes `false` |
| Agent framework / execution | Framework `true`, global dry-run `true`; execution remains simulated |
| Real operator channel | `false` |
| Telegram activation / operator | `false` / `false` |
| Slack operator | `false` |
| OpenClaw | `false` |
| Business DB writes | `false` |
| CornerMex Supabase writes | `false` |
| Frontend bridge | read-only `true`, fail-closed `true` |

Commercial writes are `OFF`. External sends are `OFF`. Payment capture/refund is absent and
blocked by design. Fulfillment is a manual evidence ledger with no shipment adapter. The code has
no automated Intermex adapter. Production logs contain no external-action attempt.

## Migration and PostgreSQL state

Migration under inspection:
`supabase/migrations/20260722010000_cornerops_commercial_operations_v117a.sql`.

| Check | Result | Evidence |
| --- | --- | --- |
| Repository SHA-256 | `44cee38fe62e540b7bb12fea27ece4e424e448678ce47c497c268faeacd36705` | `VERIFIED_LOCAL` |
| Supabase migration history | Version `20260722010000` absent | `VERIFIED_DATABASE` |
| Commercial tables | 0 of 3 present | `VERIFIED_DATABASE` |
| Commercial mutation-protection function | Absent | `VERIFIED_DATABASE` |
| Commercial triggers | 0 present | `VERIFIED_DATABASE` |
| Commercial grants | 0 present | `VERIFIED_DATABASE` |
| Partial application | None | `VERIFIED_DATABASE` |
| Automatic migration runner | Not configured in CI, Railway manifest, start command, or package scripts | `VERIFIED_LOCAL`, `VERIFIED_RAILWAY` |

The direct runtime-role audit ran as `cornerops_internal_app` inside a PostgreSQL transaction with
`transaction_read_only=on`. The intended `cornerops_internal_runtime` role exists and is non-login,
non-superuser, cannot create roles/databases, cannot replicate, and cannot bypass RLS. The proposed
SQL revokes public API roles and grants only the private runtime role. The private
`cornerops_internal` schema has no `USAGE` or table grants for `public`, `anon`, `authenticated`, or
`service_role`; the generic “RLS disabled” table advisory therefore does not represent Data API
exposure in this configuration.

Migration state: `NOT APPLIED`. Partial application: `NONE`. Automatic runner:
`NOT CONFIGURED FOR THIS FILE`.

## Fail-closed commercial runtime

Static and local behavioral evidence shows:

- every commercial route first passes operator-token auth;
- every state-changing service method calls `assertEnabled()` and receives effective flag `false`;
- founder-action auth, JSON content type, exact-origin checks, and rate limiting protect mutation routes;
- even with valid founder auth in the focused test, unavailable persistence returns HTTP 503;
- the production schema has no commercial tables, so no commercial record or demo record exists;
- demo data is an in-memory fixture labeled `COMMERCIAL_DEMO_DATA_NOT_PRODUCTION`, requires an
  explicit script, and is disabled in production;
- quote output remains `DRAFT_NOT_SENT`; no messaging, payment-capture, shipment, purchasing, or
  CornerMex mutation adapter exists;
- fulfillment and payment state changes require attributable evidence, and immutable evidence has
  append-only/replay protections in the proposed migration and focused tests.

No production mutation probe was made. The safe GET probe failed closed at authentication.

Low finding: `commercialEnvelope()` statically reports `readOnly=false`, `dryRun=false`, and
`writesBlocked=false` instead of reflecting the disabled activation flag. This is misleading status
metadata for an authenticated operator, although the feature flag assertion and absent schema still
prevent every mutation. Correct the envelope before activation.

## Logs and runtime stability

Sanitized review covered 423 runtime records and 279 build records for deployment
`88c49401-f0fc-4f04-ba90-1fb03524c70d` (`VERIFIED_RAILWAY`).

- No crash loop, unhandled exception, migration error, permission error, retry storm, payment event,
  fulfillment event, Intermex event, queue failure, agent execution, or secret pattern was found.
- The single restart-pattern match was normal container startup; the instance remains `RUNNING`.
- Startup reached `CornerOps AI Workers listening on http://0.0.0.0:8080`.
- Two known fail-safe warnings were emitted: missing `INTERNAL_API_KEY` keeps internal endpoints
  locked; agents enabled with global dry-run keeps agent execution simulated.
- Build warnings were npm production-config guidance and deprecations for `inflight`, `glob@7`,
  `node-domexception`, and `whatwg-encoding`. No build failure occurred.

## No-write attestation

This acceptance sprint caused:

| Action | Count |
| --- | ---: |
| GitHub production-code writes | 0 |
| Railway writes | 0 |
| Supabase writes | 0 |
| PostgreSQL writes | 0 |
| Feature-flag changes | 0 |
| Restarts | 0 |
| Redeployments | 0 |
| External sends | 0 |
| Commercial records created | 0 |
| Payments captured | 0 |
| Fulfillment events created | 0 |
| Intermex contacts/actions | 0 |

The database `audit_events` count was 1,013 both before and after runtime probing, and commercial
object counts remained zero. GitHub/Railway/Supabase inspection was read-only. The only allowed
write is this documentation artifact on a dedicated branch and its draft documentation PR.

## Activation readiness matrix

| Gate | State | Basis |
| --- | --- | --- |
| Code merged | `VERIFIED` | PR #78 merge identity |
| CI accepted | `VERIFIED` | Reviewed-head and main CI success |
| Correct source deployed | `VERIFIED` | Railway SHA equals accepted main |
| Runtime healthy | `VERIFIED` | Health and frontend HTTP 200; stable logs |
| Commercial flag off | `VERIFIED` | Effective production config false |
| Migration unapplied | `VERIFIED` | History absent and objects absent |
| Migration hash verified | `VERIFIED` | Exact expected SHA-256 |
| Migration dependency review | `VERIFIED` | Runtime role exists; transaction/grant/function dependencies reviewed |
| PostgreSQL grants reviewed | `VERIFIED` | Proposed grants inspected; live commercial grants absent; API roles isolated |
| Rollback plan documented | `VERIFIED` | Existing runbook, with table-count correction required before use |
| Forbidden operation probes designed | `VERIFIED` | Runbook and focused PostgreSQL test design |
| Seed/input package available | `NOT_VERIFIED` | Demo fixture exists but is not an authorized production package |
| Accounts configured | `NOT_VERIFIED` | No commercial tables or production input package |
| Launch SKUs configured | `NOT_VERIFIED` | No commercial tables or production input package |
| Intermex data available | `NOT_VERIFIED` | No production fulfillment references or commercial evidence pack |
| Shipping rules available | `NOT_VERIFIED` | Shipping configuration is unconfigured |
| Payment terms available | `NOT_VERIFIED` | Demo values are pending verification; no production package |
| Activation authorized | `NOT_AUTHORIZED` | Founder activation approval is outside this sprint |

## Readiness disposition and blockers

| Dimension | State | Disposition |
| --- | --- | --- |
| Code readiness | `VERIFIED` | Merged, CI accepted, exact source deployed, fail-closed tests passed |
| Data readiness | `BLOCKED` | Production accounts, SKUs, prices, costs, MOQ, inventory, shipping, payment terms, and Intermex references missing |
| Operational readiness | `BLOCKED` | Window, backup validation, corrected rollback, forbidden probes, ownership, SLAs, and evidence retention not approved |
| Production authorization | `NOT_AUTHORIZED` | Migration and feature activation explicitly forbidden in this sprint |

Before any future migration or activation, obtain and verify:

1. Founder-approved production migration window and exact accepted SHA.
2. Validated database backup/restore posture and a corrected rollback runbook covering all three
   commercial tables, the function, triggers, evidence preservation, and dependency order.
3. Rolled-back forbidden-operation probes for runtime and owner roles, including update, delete,
   truncate, public-role access, replay, and duplicate settlement.
4. Confirmed production runtime database role and post-migration grant introspection.
5. Authorized accounts and launch-SKU packages with prices, costs, MOQs, inventory evidence, and
   source/checksum ownership.
6. Real Intermex fulfillment/handoff references, warehouse and carrier evidence rules, UAE
   destination/shipping configuration, and COD/bank-transfer policy.
7. Evidence retention requirements, commercial owner/operator assignments, exception ownership,
   Daily Close responsibility, and service-level expectations.
8. Explicit Founder authorization for migration first and activation only after a separate
   post-migration verification.

## Rollback posture and residual risks

No database rollback is required because the commercial migration was not applied. The commercial
flag is already false. A code rollback reference would be merge commit
`7bb5bde197a966a0e864a500a055b13f1fdf7843`; the previous Railway deployment is
`b434f2f5-8ba8-4ac9-b259-ba54fdb51fc7`. Neither rollback was performed or authorized.

Residuals:

1. Low: no dedicated application readiness endpoint; Railway relies on `/api/health`.
2. Low: the commercial response envelope does not reflect disabled/write-blocked state accurately.
3. Low: rollback prose refers to two commercial tables although the migration creates three.
4. Operational: npm dependency deprecation warnings remain; they did not affect build or runtime.
5. Activation: all real business inputs, operator controls, window, backup proof, and Founder
   authorization remain absent or not verified.

## Recommended next authorization

Authorize a separate, non-activating remediation and activation-preparation sprint to correct the
two documentation/runtime-status findings, add an explicit readiness contract, validate backup and
rollback, design rolled-back forbidden probes, and assemble founder-reviewed production input
packages. Only after that evidence is independently accepted should a distinct exact-head migration
window be considered. Do not enable `CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED` in that preparation
sprint.

## Evidence labels

- `VERIFIED_LOCAL`: observed from the exact accepted repository/worktree.
- `VERIFIED_GITHUB`: read from GitHub commit, PR, review, or Actions metadata.
- `VERIFIED_RAILWAY`: read from Railway deployment/configuration/log metadata without mutation.
- `VERIFIED_RUNTIME`: observed through safe production GET requests.
- `VERIFIED_DATABASE`: read from Supabase/PostgreSQL metadata or a transaction forced read-only.
- `STATIC_REVIEW`: concluded from source, migration, test, or runbook inspection.
- `AGENT_REPORTED`: agent/runtime identity declared by this audit.
- `AUTHOR_REPORTED`: implementation documentation statement not independently established live.
- `NOT_VERIFIED`: evidence is missing or insufficient; it is not a pass.
- `NOT_AUTHORIZED`: outside the Founder authorization boundary.

## Final status

Final verdict: `ACCEPT_WITH_LOW_FINDINGS`.

Final status token: `cornerops_v1_17a_post_merge_accepted_inactive`.
