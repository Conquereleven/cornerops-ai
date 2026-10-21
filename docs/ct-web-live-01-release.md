# CT-WEB-LIVE-01 — refreshed public-only release candidate

Founder `GO PUBLIC LIVE` is required before merge/deployment or DNS changes. Do not merge #91 or #92. Security PR #95 has already been merged and deployed separately.

## Secured baseline and isolation

Base: `3f352911c597672a3231e427f106d4b165d01bae`, the verified secured main and deployed production commit. Railway SUCCESS deployment: `4ff4bc86-99a5-4824-bc82-f76d1789d1db`. Post-deployment Prod Watch [39478724743](https://github.com/Conquereleven/cornerops-ai/actions/runs/39478724743) passed public health, authenticated monitoring and its read-only database check.

The approved public presentation was originally ported from #92 (`f6332f4fc5cfa36447c02f123567fb46046a30c0`), which is stacked on #91 (`22c8510559b6a583a7a13b63301e79cdfe1b7d10`). Neither stacked history is imported. This branch is rebased onto secured main; all security changes are retained byte for byte. Public entry imports only the informational site; private paths render unavailable without API calls. Existing private application source remains unmodified and is not imported by the shipping entry. Sign-in links remain omitted. Emergent-derived CornerTech AI design and Founder-approved contact details are unchanged.

`tests/public-release-boundary.test.js` is unchanged. Its original allowlist and assertions still enforce the complete protected file set and SHA-256 content hash. Baseline regenerated from `git show` of secured main, after comparing every protected file with the worktree:

- Protected file count: **792**.
- Protected SHA-256: `be91c76a09f9bff3a83742bfc9446fe72edc535c095bdb4094e5bb5b697e5e90`.
- Backend, security guards/tests, migrations, private UI, dependency manifests/lockfiles and deployment workflows are identical to secured main.
- Final PR diff must contain only the previously approved public presentation, public tests and release evidence; no broadened test allowlist.

## Production acceptance — GET only

Checked 2026-10-20 on `https://cornerops-ai-production.up.railway.app`:

| GET path | Status | Evidence |
|---|---|---|
| `/` | 200 | HTML; existing CornerOps page renders visibly |
| `/api/health` | 200 | JSON, 40 bytes; minimal status/service contract |
| `/robots.txt` | 200 | **HTML SPA fallback**, not a valid robots file; this public release supplies the actual text file |
| `/assets/index-DUgMY2zv.js` | 200 | JavaScript, 337316 bytes; discovered from homepage HTML |
| `/assets/index-DcZp7wtP.css` | 200 | CSS, 45724 bytes; discovered from homepage HTML |
| `/api/products`, `/api/settings` | 503 | Expected unconfigured internal API denial |
| `/api/intelligence/work-queue/status` without token | 401 | Expected operator authentication denial |

Browser: the existing homepage rendered its heading and navigation, with no broken images and no captured warning/error console entries. Authenticated monitoring is evidenced by the successful supplied Prod Watch run; no credentials were retrieved. No production POST, mutation or provider action was performed. This is acceptance of the deployed containment and public/static availability, not a claim that every possible security issue has been eliminated.

## Refreshed release QA

- Full backend/security suite: **802 passed**, 15 pre-existing skipped; 136 passing suites, 3 skipped.
- Frontend: **27 tests passed**; lint (632 JavaScript files), typecheck and production build passed.
- Existing security logging, signatures, negative API tests and exact route inventory remain active.
- Protected-file and public-import boundary tests pass with the new baseline, without changing the integrity test.
- Safe control-tower/beta demos pass.
- Browser widths 390, 430, 768, 1024, 1280, 1440: no horizontal overflow or broken images; console has no captured warnings/errors. Mobile menu opens; Escape closes it and returns focus to its button.
- Approved Gmail, WhatsApp and Google Calendar contact links verified in rendered DOM, without sending messages or booking appointments. Canonical URL remains `https://cornertech.ae/`.
- Local Express preview uses the actual public build and secured backend; actual robots/sitemap/assets are checked before release.
- Exact-head GitHub CI and secret scan are recorded in the PR and final acceptance report.

## Domain preparation and gated deployment

Both `cornertech.ae` and `www.cornertech.ae` were already attached to Railway in the separately authorized DNS preparation. Do not add them again. DNS cutover and certificates were pending at that preparation; this sprint changes neither. Revalidate live DNS and Railway ownership/certificate status immediately before any authorized cutover.

Prepared routing: apex ALIAS to `jnyu7qgw.up.railway.app`, www CNAME to `68499xde.up.railway.app`, with the two Railway-issued `_railway-verify` TXT records retained in the DNS preparation evidence. Never substitute an IP resolved from a routing target. Confirm AEServer ALIAS semantics and exact current provider-issued values before saving; stop if another service/configuration change is required. Preserve nameservers, DNSSEC and every email/unrelated record.

After explicit Founder authorization:
1. Reconfirm candidate SHA, green CI, secured main, rollback availability and DNS baseline. Rebase/retest if main changes.
2. Merge only PR #94 and allow its intended Railway production deployment. Main is the production source and may auto-deploy; CI must be verified before merging.
3. Verify new deployment/SHA on the retained Railway hostname: homepage, actual JS/CSS, health, real robots/sitemap, negative API denial and existing authenticated monitoring.
4. Only if DNS cutover is also explicitly authorized, apply the four prepared routing/verification records in the existing AEServer zone; retain all unrelated records.
5. Verify authoritative DNS/public resolvers, ownership, valid HTTPS on apex/www, canonical URL, responsive page, contact links and private-path unavailability before declaring PUBLIC_SITE_LIVE.

Known limitations: www canonicalization is client-side, not HTTP 301; unavailable frontend paths use the unchanged server's HTTP 200 fallback with a noindex view. Dependency advisories and broader per-user authorization remain separate work. The secured internal API intentionally returns 503 when its service key is absent. This release neither activates the private Command Center nor distributes service credentials to the browser.

## Secure rollback

Use the **secured** baseline deployment `4ff4bc86-99a5-4824-bc82-f76d1789d1db`, SHA `3f352911c597672a3231e427f106d4b165d01bae`, snapshot `a2fe7517-e2a8-4b27-8eee-39e73426366b`. Read-only Railway metadata at this acceptance reports SUCCESS, canRollback=true and canRedeploy=true. Recheck retention immediately before cutover; no rollback was executed.

If the future public release fails, obtain/use the corresponding Founder rollback authorization to restore this secured deployment, verify its SHA, health, API denial and authenticated monitoring, and coordinate a reviewed revert of only the public-release merge to keep main consistent. **Do not restore the pre-security deployment e60316eb-bae5-4560-a2d8-d8055ca71f7f or revert #95.** No database rollback or migration is required.

For a separately authorized DNS rollback, restore the exact zone snapshot captured immediately before the cutover, changing only launch records. Previously observed parking records were A @ 165.22.30.248 TTL 3600 and CNAME www cornertech.ae TTL 3600; revalidate rather than treating these historical values as current. DNS rollback restores parking, not the website; caches can persist for the prior TTL.
