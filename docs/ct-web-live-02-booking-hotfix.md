# CT-WEB-LIVE-02 — booking CTA hotfix / integration handoff

Status: Codex contribution prepared; NOT RELEASE READY until Claude contribution and all gates pass. Founder authorization on2026-10-22 covers implementation, cross-review, conditional merge/deployment and targeted production verification for this hotfix only. No further Founder authorization is required inside that scope; failed gates prevent release. PR96 and Website2.0 remain untouched.

Base main:264588059418cb34fbc9319e922de8dec116522c. Current accepted production deployment:e3807143-b411-464b-80eb-7e0706016157. Fresh baseline must be rechecked before integration/release; no automatic security-baseline regeneration.

## Ownership and exact contract
- Codex: frontend/src/config/siteConfig.ts; frontend/src/components/public/BookingCta.test.tsx; this handoff/evidence; integration and release checks.
- Claude exclusively: frontend/src/components/public/CornerTechSite.tsx. Codex does not edit this file, including during conflict resolution. Any review correction goes back to Claude.
- Claude works from the verified main above in a separate branch/worktree, changes only the owned component, and supplies base/head SHA,exact file inventory and tests. Codex reviews the full commit diff before integration, preserves authorship and records the integrated SHA. No writes to Claude checkout/branch. Claude cross-review of Codex config/tests is required before release; a component handoff alone is not reciprocal approval.

Configuration contract: siteConfig.bookingUrl is empty when VITE_PUBLIC_BOOKING_URL is missing,blank or rejected by existing URL validation. No hardcoded Google fallback. This change does not alter other public URLs or add network validation. A syntactically valid configured URL is not proof of an available appointment: future booking configuration must have independent real-browser verification. The existing approved WhatsApp/email defaults remain unchanged.

Claude component contract, within contact action group:
1. Nonempty bookingUrl: primary “Book a call” to bookingUrl; secondary email and a single WhatsApp action remain.
2. Empty bookingUrl: primary “Discuss a project” to siteConfig.whatsappUrl; secondary “Email us”; no duplicate WhatsApp action and no Book a call.
3. Preserve external target/rel safety, styles,accessibility and other page sections; no private imports,fetch,forms or new data collection.

## Focused regression matrix
BookingCta.test.tsx tests actual config + actual component with isolated Vite environment stubs. Missing,empty,whitespace,malformed,javascript and remote-http configurations must disable booking. For each,assert primary WhatsApp fallback,one WhatsApp link,one primary button,email secondary and no booking link. Explicit HTTPS configuration must render booking primary with distinct email/WhatsApp. Reserved example URL is test data only; no appointment/provider action occurs.

Codex-only results:34 frontend tests pass,6 fail because the exclusive Claude component has not yet implemented the fallback. Do not skip/weaken these tests. Typecheck and production build pass; default built JS excludes the known broken calendar URL. This is intentionally incomplete integration evidence, not GO.

## Conditional release gates / targeted checklist
- [ ] Receive Claude exact commit and independently review component-only diff; no unrelated history.
- [ ] Claude reviews Codex configuration/tests; record genuine reciprocal disposition and SHA.
- [ ] Integrate reviewed contributions; compare combined diff against fresh main. All protected files/security fixtures/dependencies/deployment configuration byte-identical; existing boundary test passes without regeneration.
- [ ] All frontend tests,backend applicable security/full CI,lint,typecheck,build,safe CI demos and secret scan pass on exact combined head.
- [ ] Locally serve actual production build with missing/invalid booking and inspect primary fallback + email,no duplicate WhatsApp; future configured booking build verified separately. Capture mobile/desktop screenshots after integrated component; console/assets clean.
- [ ] Establish effective production booking build value without exposing secrets. If broken URL is explicitly configured,removing source fallback alone is insufficient: stop and report, do not silently change production variables. Deployment config/credentials remain out of scope.
- [ ] Reconfirm baseline/deployment/source mapping and secure rollback option read-only; no incidental DNS/database/private-app changes.
- [ ] Only once all gates pass,land exact reviewed head under Founder’s conditional authorization. Treat merge auto-deploy as the deployment trigger; do not trigger redundant redeploy. Observe final deployed SHA/SUCCESS.
- [ ] Production strict HTTPS/browser recheck: Discuss a project resolves to approved WhatsApp,Email us correct,one WhatsApp action,no broken calendar; no message sent. Health/assets200; protected endpoints retain expected503/401; existing monitor remains healthy.

Rollback candidate is the preceding secure deployment, reverified at release time. It restores the known broken-booking state and therefore is an availability/security rollback, not a fix. If a post-deploy regression occurs,stop rollout and report evidence; do not change DNS,databases or secrets. No release action has occurred at the Codex-only stage.
