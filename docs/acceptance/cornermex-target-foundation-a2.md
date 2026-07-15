# CornerMex Target Foundation A2

- CornerMex implementation PR: `Conquereleven/corner-mex-uae#2`, merged as `80ec9a5b635e6654c07fa41648bba6899ddd7599`.
- Active CornerMex production project: `ywyiejqnbyzjfatojvkh`; unchanged.
- Target commerce project: `wlrfknmrhowldygmvtvn`; baseline and security boundaries applied.
- Target state after restart: 20 public tables, all RLS-enabled, 37 policies, zero Auth users, zero Storage buckets and zero commerce rows.
- Target security advisor: no findings. Performance advisor: non-blocking baseline INFO/WARN findings only.
- Railway staging: existing `CornerMex UAE` project, `staging` environment, `cornermex-web` service, healthy main deployment.
- Staging URL: `https://cornermex-web-staging.up.railway.app`.
- Health/readiness: HTTP 200 after an explicit restart; SSR and static assets verified.
- Shared contract: `cornermex-cornerops-boundary-v1`, checksum `b87acfbdeac1427e141677616a0d8fbda5ecabc10a4c84012a9bd5d8bc98249a` in both repositories.
- Data migration: `not_started`.
- Production cutover: `not_started`.
- CornerOps active CornerMex read source: existing limited masked/read-only replica; unchanged by A2.
- CornerOps target-project connection: not active.
- CornerOps writes to CornerMex: blocked.
- Future command bridge: not implemented.
- Marketing gate: `marketing_v1_16_internal_only_unblocked`; external publishing, contact and mutations remain blocked.

Rollback keeps the unchanged Lovable production deployment as the commercial anchor and uses the preceding successful Railway staging deployment for runtime rollback. Database rollback must preserve the A1 private execution boundary and must not restore client access to administrative functions.
