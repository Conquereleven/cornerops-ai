# Product & Web Consolidation v1 — Progress

## Session A — Baseline & threat model: DONE

- Baseline recorded in `baseline.md` (all green at `f74b5dc`).
- Threat model T1–T10 recorded.
- Decisions D1–D7 recorded.

## Next action (Session B)

1. Migration `workspaces` + `workspace_memberships`; internal table allowlist.
2. `src/core/identity` (verifier, membership stores, policy) + `src/middleware/appAuth.js`.
3. `GET /api/app/session`; remount legacy routers behind the boundary; webhook boundary; IVR/WhatsApp fail-closed.
4. `npm run workspace:grant`.
5. Port PR #85 frontend auth; `ProtectedWorkspaceRoute`; `/app/*`.
6. Security test matrix + `docs/security/api-route-inventory-v1.md`.
