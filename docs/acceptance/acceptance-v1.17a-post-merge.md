# CornerOps v1.17A Post-Merge Production Acceptance

## Executive verdict

Final verdict: `ACCEPT_POST_MERGE_INACTIVE`.

CornerOps Commercial Operations v1.17A is deployed but intentionally inactive. PR #78 introduced
the commercial core. The initial production acceptance then found that disabled authenticated reads
could reach absent persistence and return HTTP 500 / `42P01`. PR #82 corrected that boundary and was
merged from the independently approved exact head. Final read-only production acceptance verified
the remediation on the exact deployed merge commit.

Commercial Operations remains disabled. The proposed migration is not recorded in Supabase
migration history, its required objects are absent, and no partial application or automatic migration
runner exists. No production mutation, migration, flag change, restart, deployment, payment,
fulfillment event, external send, or Intermex action was performed by acceptance.

Evidence was captured on `2026-07-30` in `America/Mexico_City`.

## Acceptance chronology

### 1. Original implementation

- PR #78: `feat: add commercial operations core v1.17`.
- Reviewed head: `5f1cbc65693483bb80f44e1e32d51b98b2a16aee`.
- Merge commit: `7bb5bde197a966a0e864a500a055b13f1fdf7843`.
- Initial Railway deployment: `88c49401-f0fc-4f04-ba90-1fb03524c70d`.

### 2. Initial acceptance failure

The first production acceptance found that all eleven authenticated commercial GET routes could
reach PostgreSQL while Commercial Operations was disabled. The absent private relations produced
HTTP 500 / `42P01`. This was a fail-closed contract defect, not an authorized activation or data
mutation. PR #81 was kept draft pending remediation.

### 3. PR #82 remediation

- PR #82: `fix: fail closed before commercial persistence`.
- First remediation head: `aded2c6305cfdddfdbc593410e61e0f573ee3de8`.
- Final reviewed head: `7c81484baeeb778c037021ef020b75a03522948d`.
- Formal review: `APPROVED` by `cornermexuae-netizen` on the final exact head.
- Merge commit: `325294244ea191db3260561fa33cb7f1fd1945d4`.

PR #82 enforces feature availability before persistence access, returns truthful disabled and
configuration-required states, sanitizes availability details through an explicit whitelist, and
does not claim unverified migration state.

### 4. Final production acceptance

`origin/main` and the active Railway deployment both resolve to
`325294244ea191db3260561fa33cb7f1fd1945d4`. There were no later commits at acceptance time.

## CI evidence

| Surface | Run | SHA | Result |
| --- | --- | --- | --- |
| PR #82 exact head | `30506454180` | `7c81484baeeb778c037021ef020b75a03522948d` | `SUCCESS` |
| Merge commit / main | `30567901099` | `325294244ea191db3260561fa33cb7f1fd1945d4` | `SUCCESS` |
| Production watch | `30574586876` | `325294244ea191db3260561fa33cb7f1fd1945d4` | `SUCCESS` |
| Supabase Preview on PR #82 | n/a | exact PR head | `SKIPPED` |

The main CI job passed install, lint, typecheck, backend tests, frontend tests, build, and safe beta
demos. No workflow was rerun during final acceptance.

## Railway deployment identity

| Field | Result |
| --- | --- |
| Project | `CornerOps AI` |
| Service | `cornerops-ai` |
| Environment | `production` |
| Previous deployment | `88c49401-f0fc-4f04-ba90-1fb03524c70d`, source `7bb5bde197a966a0e864a500a055b13f1fdf7843`, removed |
| Active deployment | `e2e42e1d-1da7-4ce2-883c-8635b631053d` |
| Trigger | Automatic GitHub deployment after PR #82 merge |
| Created | `2026-07-30T17:52:27.591Z` |
| Status | `SUCCESS`, online |
| Source SHA | `325294244ea191db3260561fa33cb7f1fd1945d4` |
| Deployments caused by merge | One |

No manual deployment, restart, rollback, Railway variable change, or healthcheck change occurred.

## Runtime acceptance

All probes were GET-only.

| Probe | Result |
| --- | --- |
| `GET /api/health` | HTTP 200, `status=ok` |
| `GET /health` | HTTP 200, `status=ok` |
| `GET /` | HTTP 200 |
| `GET /readiness` | HTTP 200 frontend HTML fallback; not a dedicated readiness endpoint |
| Eleven unauthenticated commercial GETs | 11/11 HTTP 401; no availability, SQL, schema, relation, or migration disclosure |
| Authenticated commercial status | HTTP 200, `status=disabled`, `featureEnabled=false`, `available=false`, `querySkipped=true`, `readOnly=true`, `writesBlocked=true`, `reason=FEATURE_DISABLED` |
| Disabled status warning | `Commercial Operations is disabled. Persistence readiness was not queried.` |
| Ten authenticated commercial data GETs | 10/10 HTTP 503, `status=unavailable`, `code=COMMERCIAL_OPERATIONS_DISABLED`, no fabricated empty collections |
| HTTP 500 | Zero |
| `42P01` | Zero |

The final commercial envelope truthfully reports disabled/read-only/write-blocked state. Responses
contain no unverified migration assertion, SQL, SQLSTATE, schema or relation names, stack traces,
connection details, or secrets.

## Effective safety state

- `CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED`: absent, therefore fail-closed `false`.
- `CORNEROPS_COMMERCIAL_DEMO_ENABLED`: absent, therefore `false`.
- General internal persistence: enabled for existing private internal systems; the commercial gate
  prevents commercial persistence access while the feature is disabled.
- Controlled actions and real internal action flags: absent, therefore disabled; default dry-run and
  approval requirements remain active.
- CornerMex/Supabase writes: disabled.
- External sends and payment capture: blocked.
- Commercial fulfillment execution and Intermex actions: blocked.
- Agents: framework default enabled, global dry-run and approval defaults active.
- OpenClaw: disabled.

## Migration and database state

Migration:
`supabase/migrations/20260722010000_cornerops_commercial_operations_v117a.sql`.

| Check | Result | Classification |
| --- | --- | --- |
| Repository SHA-256 | `44cee38fe62e540b7bb12fea27ece4e424e448678ce47c497c268faeacd36705` | `VERIFIED` |
| Supabase migration version `20260722010000` | Not recorded | `VERIFIED` |
| `commercial_entities` | Absent | `VERIFIED` |
| `commercial_transition_events` | Absent | `VERIFIED` |
| `commercial_evidence_registry` | Absent | `VERIFIED` |
| Mutation-protection function | Absent | `VERIFIED` |
| Partial application | None | `VERIFIED` |
| Automatic migration runner | Not configured in CI, Railway manifest, start command, or package scripts | `VERIFIED` |

The private-schema RLS advisory is generic. Read-only privilege introspection confirmed that
`anon`, `authenticated`, and `service_role` have no schema usage, table SELECT, or table write
privileges in `cornerops_internal`. No remediation was applied during acceptance.

## Runtime logs

Logs from deployment `e2e42e1d-1da7-4ce2-883c-8635b631053d` through final acceptance contained:

- zero `42P01` or commercial relation-name matches;
- zero exact HTTP 500 responses;
- zero crash loops, unexpected migrations, payments, fulfillment events, Intermex actions,
  external sends, or secret patterns;
- the ten expected fail-closed HTTP 503 responses generated by acceptance;
- one non-blocking npm production-config warning recommending `--omit=dev`.

## No-write attestation

| Action | Count |
| --- | ---: |
| GitHub production or code writes | 0 |
| Railway writes | 0 |
| Supabase writes | 0 |
| PostgreSQL writes | 0 |
| Variable changes | 0 |
| Restarts or manual deployments | 0 |
| Commercial records created | 0 |
| Payments | 0 |
| Fulfillment events | 0 |
| External sends | 0 |
| Intermex actions | 0 |

The single automatic Railway deployment caused by the authorized PR #82 merge is recorded
separately and is not a platform write performed by acceptance.

## Remaining Low findings

1. No dedicated application readiness endpoint; `/readiness` resolves to the frontend fallback.
2. Readiness health probes may repeat across commercial calls.
3. The shared commercial envelope reports `approvalRequired` unconditionally.
4. The shared commercial envelope audit ID is generated in-process rather than persisted.
5. The internal test-helper export has no route or state-changing capability but remains visible to
   CommonJS consumers.
6. npm emits non-blocking production/deprecation guidance.

These findings do not make Commercial Operations reachable while disabled. They require review
before any future activation.

## Activation disposition

| Dimension | State |
| --- | --- |
| Code remediation | `VERIFIED` |
| Exact source deployed | `VERIFIED` |
| Disabled runtime contract | `VERIFIED` |
| Migration applied | `NOT_AUTHORIZED` |
| Production input package | `NOT_VERIFIED` |
| Commercial activation | `NOT_AUTHORIZED` |
| External commercial use | `BLOCKED` |

The next authorized step is a separate non-activating readiness sprint. Migration application and
Commercial Operations activation require distinct Founder decisions.

## Final status

Final verdict: `ACCEPT_POST_MERGE_INACTIVE`.

Final status token: `cornerops_v1_17a_post_merge_accepted_inactive`.
