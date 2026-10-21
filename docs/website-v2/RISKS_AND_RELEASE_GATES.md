# Risks, approvals and release gates
Status: no release authority granted. Sprint00 docs only. Evidence baseline `264588059418cb34fbc9319e922de8dec116522c`.

| Risk | Severity | Evidence / mitigation | Owner / gate |
|---|---|---|---|
| Auto-deploy on merge | High | PR94 merge followed by Railway deployment; draft docs PR must not merge automatically | Founder separate merge authorization |
| Private/security regression via old branch | High | PR91/92 open, no history imported; compare current protected tree and test containment | Codex each PR; security reviewer before release |
| Integrity regex trusts broad public/docs paths and checks only two source files | High | Existing test retained; supplement complete entry-graph and fresh-base diff before route expansion | Codex, explicitly reviewed test exception |
| True404 requires protected server change | High release dependency | Current GET missing route returns200; proposed limited static block exception | Founder/CTO approval before implementation; otherwise release limitation remains |
| Claim exceeds product maturity | High | Code contracts ≠ shipping commerce service; ledger separates states | Founder each factual claim |
| Tres Leches authorization/privacy | High | Existing reconstruction not independent permission evidence | Founder; omit case until permission; no customer repo/data access |
| New forms/tracking/privacy obligations | High | No collection authorized | Founder/legal/backend review before any new flow |
| Custom domain acceptance unknown | High for canonical release | Root/www connection refused from audit host; does not establish universal outage or DNS cause | Separate V1 owner investigates; no V2 DNS action |
| Missing CSP/HSTS on sampled Railway HTML | Medium | Response headers absent in GET sample; API auth is not a substitute for web headers | Separate reviewed hardening assessment; do not modify in S00 |
| SPA metadata, root-only robots and duplicate fallback | Medium | index.html, robots, sitemap, GET audit | Approved static architecture + initial HTML and HTTP tests |
| Build cache/asset detection mismatch | Medium | Server immutable regex expects dotted hex; Vite uses hyphenated asset names, generally falls back to300s | Measure before targeted approved cache change; not an availability failure |
| Brand continuity/accessibility | Medium | Palette proposal not contrast-tested; retain mark/type cues | Founder design review; Codex accessibility evidence |
| Zoho/contact readiness | Medium | Existing approved links only; no delivery/form exercised | Founder verifies any replacement separately |
| Core Commerce capacity | Medium | Website scope could grow into product work | Timebox and reduced complete route scope |
| Unproven proprietary/IP and customer outcomes | Medium | Positioning is not ownership/legal/commercial proof | Founder diligence; avoid unsupported claims |

## Gate sequence
G0: technical Sprint00 delivery accepted subject to coordination amendments. Keep PR96 Draft. First obtain Claude Code’s independent Sprint00 findings, pin their reviewed SHA, and publish Codex dispositions and unresolved issues. Only then request final Founder Sprint01 authorization. Recorded direction: flagship IN DEVELOPMENT; three available services; Geist/mark/navy-cobalt continuity; Home/Commerce/Solutions; Company/Contact sections; case permission gate; React/Vite; planning-only prerender spike. Protected server changes NOT authorized.

G1: approve final narrative, labels, route copy and responsive design system. No generated implementation in Sprint00.

G2: approve homepage/visual interactions with snapshots and no private bundle imports. G3: approve page facts, case permission, conversion paths, static build/server exceptions and SEO behavior. High-impact architecture changes require explicit review; CTA forms require separate privacy/backend authorization.

G4: exact-SHA CI and all applicable security/UI/SEO/performance checks; no severe unaccepted risk; renewed secure rollback evidence and domain acceptance. Evidence must identify unavailable checks, not label them passed.

G5: distinct Founder permission for merge (may itself auto-deploy), production deployment/redeployment, and any DNS cutover. No inference of these from planning or draft-PR authorization. Do not activate private UI, change databases/credentials or modify customer systems.

## Rollback
Sprint00: close the draft or revert documentation commit; no runtime, DNS or database rollback needed. If accidentally merged, Railway may rebuild despite docs-only content; follow incident approval rather than initiating deployment here.

Future V2: record current accepted release immediately before cutover. Observed V1 deployment `e3807143-b411-464b-80eb-7e0706016157` at `264588059418cb34fbc9319e922de8dec116522c` reports canRollback/canRedeploy. Prior secure deployment `4ff4bc86-99a5-4824-bc82-f76d1789d1db` at `3f352911c597672a3231e427f106d4b165d01bae` is REMOVED but metadata reports both capabilities; this is not proof of a successful restore. Prefer accepted V1 over pre-public security-only rollback; never pre-security SHA. With Founder authorization only, restore the selected immutable secure artifact and validate homepage/assets, minimal health, auth denial, authorized monitor and logs; preserve DNS and credentials unless separately authorized. No migration exists in this sprint.

## Acceptance limits
Read-only Railway metadata, public GETs and local tests establish a bounded current baseline, not full production security certification. No authenticated production probe, customer database, provider action, DNS panel mutation, browser V2 implementation, field performance or new accessibility certification performed. Existing main Prod Watch is evidence of its own workflow, not a new database check run by this sprint.

## Coordination and integration risks
- Shared-file collision: one named writer per path per handoff; separate agent worktrees/branches. No concurrent edits without a documented ownership/interface contract; serialize shared-file writes even when interfaces are agreed.
- Incomplete independent review: Claude Code’s Sprint00 findings are pending. Codex may not substitute its own review or imply Claude approved. Record findings, severity, evidence SHA and disposition before asking for Sprint01 approval.
- Product showcase mistaken for access: S02–03 remain public presentation. S05 authorizes only commercial integration planning when separately started. Independent security and product readiness, privacy/data contracts and explicit Founder approval gate all future authenticated access. No private CornerOps API or Tres Leches production-data exposure.
- Integration gate: reciprocal review, protected-file diff and tests on the combined head precede acceptance. A clean merge/cherry-pick is not review approval. Founder retains merge/deploy/DNS gates; neither agent can waive them.
