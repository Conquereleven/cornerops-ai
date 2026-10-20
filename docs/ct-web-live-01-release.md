# CT-WEB-LIVE-01 — public-only release candidate

Production cutover requires Founder `GO PUBLIC LIVE`. Do not merge #91 or #92.

## Isolation

Base: `f74b5dcfe920ac5849b352745ebdc5f83ae37bc2` (verified main and deployed production).
Presentation source: #92 at `f6332f4fc5cfa36447c02f123567fb46046a30c0`, stacked on #91 at `22c8510559b6a583a7a13b63301e79cdfe1b7d10`.

Ported only the public landing, its component/content/styles, brand assets and public contact configuration. No cherry-pick or merge of the stacked history. The public entry imports only the informational website; private paths render an unavailable page and perform no API requests. Sign-in links are omitted. Existing App source stays for the separate private rollout but is not imported by the shipping entry. Public brand is CornerTech AI. No new legal-entity, testimonial, client-metric or traction claim.

786 protected files are SHA-256 compared with the production baseline by `tests/public-release-boundary.test.js`. Backend, health handlers, API permissions, identity code, private UI source, migrations, lockfiles, dependency manifests and deployment workflows remain byte-identical. The only entrypoint change is frontend `main.tsx`. Tests and this evidence are the non-presentation additions.

## QA

- Local lint, typecheck and build pass. No dependency changes.
- Full backend suite: 784 passed; 15 skipped (baseline optional integrations/database tests). 133 passing suites, 3 skipped.
- Frontend suite: 27 passing tests, including six private/unknown paths with no network calls.
- Protected-file and public-import boundary tests pass.
- Safe control-tower and beta demos pass.
- Six browser widths: 390, 430, 768, 1024, 1280, 1440. No horizontal overflow or broken images. Full-page and hero captures in `docs/evidence/ct-web-live-01/`.
- Mobile menu open/close, Escape focus, navigation anchors and reduced-motion behavior covered by frontend tests; browser checks recorded separately.
- Contact values match Founder-approved `frontend/AGENTS.md`: existing Gmail address, WhatsApp number and Google Calendar link. No future corporate mailbox invented. No messages or bookings sent.
- Gitleaks diff scan and exact GitHub CI/head evidence are recorded in the PR and final handoff.

## Deployment plan after authorization

1. Reconfirm main, candidate SHA, green CI, production deployment and unchanged DNS zone. Rebase/retest if main moves; never merge stacked branches.
2. Merge only this public release PR. Railway production is sourced from main and has `checkSuites: false`; CI must be checked before merging. Monitor the resulting deployment and `/health`, `/api/health`, `/`, assets, `/robots.txt`, `/sitemap.xml` on the retained Railway hostname.
3. Add `cornertech.ae` and `www.cornertech.ae` to the existing production service only after Founder authorization. Read the generated routing and ownership verification records for each hostname. Do not guess targets or reuse the diagnostic hostname as a custom-domain routing target.
4. In AEServer's existing DNS zone, replace parking `A @` with dynamic `ALIAS @` to the exact Railway-generated apex routing target, subject to confirming this panel's ALIAS semantics. Set `CNAME www` to its exact generated routing target. Add both domain verification TXT records with Railway's exact owner/value. Use TTL 300 for the cutover records. Preserve nameservers, SOA and all unrelated/email records. Do not purchase or activate another DNS product.
5. Verify authoritative answers and public resolvers, Railway ownership status, valid HTTPS certificates for both names, and root canonical URL. `www` uses a client-side redirect preserving path/query/hash; this is not a server-side HTTP 301. A 301 at an edge would require a separately reviewed routing change.
6. Verify the canonical public page, robots/sitemap, menu/contact links and no private modules in the served frontend. Capture public evidence before declaring `PUBLIC_SITE_LIVE`.

## Known gate limitations and inherited risks

Railway has no custom domain today. Its documentation says exact routing and ownership TXT values are generated when a domain is added. Adding a production domain is explicitly forbidden before `GO PUBLIC LIVE`; therefore the exact DNS value table cannot honestly be completed pre-authorization. Do not substitute examples. This is a gate blocker under the sprint's strict requirement for exact pre-cutover records.

The AEServer panel offers ALIAS, but its generic support article describes a different nameserver setup and advises A for apex. Do not change nameservers based on that generic article. Confirm dynamic ALIAS operation in the current `cnicdnsmanager`/rrpproxy zone before saving the cutover.

Existing backend behavior is intentionally preserved, including its legacy anonymous API surface. Removing private frontend imports is not backend access control. This release does not close #91's documented API security issues and does not certify private data as secure. Production `/api/health` currently reports HTTP 200 with `dataSource.mode=mock`. Unknown frontend paths retain the existing server's HTTP 200 fallback with an unavailable/noindex view, not a true server-side 404. Dependency install reports baseline advisories; no dependency remediation is bundled into this release.

## Rollback

Existing Railway deployment `e60316eb-bae5-4560-a2d8-d8055ca71f7f`, commit `f74b5dcfe920ac5849b352745ebdc5f83ae37bc2`, snapshot `9992e7af-d1c1-458e-b18f-41cfc9f5f6b9`: SUCCESS, `canRollback=true`, `canRedeploy=true` at audit. Recheck retention at cutover. Previous deployment `06f07a60-84b2-405f-9ddc-efe6d2c0fb5f` is REMOVED, redeployable but not directly rollback-enabled.

After an authorized cutover failure, restore the recorded successful deployment using Railway's rollback action; verify the deployed SHA and health. Coordinate a revert of only the public-release merge to keep main consistent and prevent a subsequent push from restoring the failed release. Preserve `cornerops-ai-production.up.railway.app` throughout. If a domain/DNS failure requires reverting DNS, restore `A @ 165.22.30.248 TTL 3600` and `CNAME www cornertech.ae TTL 3600`, removing only launch-added records. This restores the previous parking state, not the new website. Existing cached DNS can persist for the original TTL. No database rollback or migration is involved.

References: [Railway domains](https://docs.railway.com/networking/domains/working-with-domains), [AEServer DNS management](https://www.aeserver.com/support/dns-management-tool-manage-dns-records/).
