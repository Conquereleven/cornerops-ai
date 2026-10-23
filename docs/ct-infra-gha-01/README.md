# CT-INFRA-GHA-01 — implemented workflow cost controls

Baseline main4894c5b028cdb4ac469e5b7ecf01fd38c20330db. No merge/deployment, branch-policy, billing, Railway, database or credential change. Full implementation CI evidence and final SHA are in the Draft PR delivery comment.

## Measurement,2026-10-23

Read-only latest60 runs,2026-10-17 01:03 through2026-10-23 11:37 UTC (not whole-month billing):

| Workload | Runs | Job seconds | Median/job | Estimated rounded minutes |
| --- | ---: | ---: | ---: | ---: |
| CI |24|1657|73s|41|
| Prod Watch |36|581|16s|36|
| Duplicate feature push CI with matching PR SHA |7|511|75s|13|

Duplicate push run IDs:39947383488,39947210741,39942623696,39777658187,39617783673,39613834651,39609904185. Each SHA has matching PR validation. Job started/completed timestamps fetched through Actions jobs API; estimate is ceil(seconds/60) per job, not an invoice. A completed monitor timing API returned billable.total_ms=0 and run_duration_ms=27000, so that billing field was not treated as proof of free execution. Founder supplied2700/3000 monthly warning/resetNovember1; this repository sample cannot attribute all2700 minutes.

Removing duplicates saves one full run per feature PR update: approximately50% of CI for affected updates,13/77≈17% of this mixed sample's estimated minutes. Extrapolating the observed6.44-day cadence gives roughly60 minutes per30days;100 future updates at the observed13/7 rounded minutes each save≈186 minutes. Actual savings depend on activity/rounding. PR cancellation savings are additional and unquantified. No intentional overlapping runs were created to manufacture cancellation evidence or consume extra minutes.

## Changes and preserved gates

- CI: push only main/develop; all pull_request validation retained with no path filters. Existing job name `test`, Node22, lint/typecheck/backend/frontend/build/safe demos unchanged. Feature PRs without a PR no longer consume CI until opened. Post-merge main CI remains.
- Concurrency: only feature/* PRs group by PR number and cancel superseded runs. Other heads/events group by unique run_id and cannot evict release/hotfix/security PRs, main/develop pushes or production/release validation. Different PRs cannot cancel each other. No pull_request_target/secrets escalation.
- Monitor: hourly schedule, manual dispatch, existing concurrency cancel=false and operator-secret status check retained. Remove Node setup/npm install and obsolete CornerMex secret mapping/check. Add strict HTTPS anonymous API containment check. No redirects, disabled TLS verification, response bodies or credentials in output. Token absence explicitly reports authenticated check skipped, as before.
- Legacy evidence: run39914733844 returned `mode=blocked_by_missing_supabase_readonly_config`, `supabaseStatus=not_configured`, URL/key-present=false while step passed. Workflow supplied generic SUPABASE_URL/ANON_KEY but script reads CORNERMEX_* plus enable flags. It was not a working database monitor. Existing CornerMex CLI/source and stored secrets remain untouched; no replacement database check is claimed or authorized. Public/authenticated production probes are the retained service monitor.
- Sample monitor39914733844 took22job-seconds; Node setup6s + npm install7s. Eliminating those saves startup/runtime work, but the old job already rounds to1minute, so **no guaranteed billable-minute reduction from monitor setup removal**. Hourly frequency is unchanged because no external replacement exists. At nominal24/day, monitoring still budgets≈720–744rounded minutes/month; actual schedule delivery can be delayed.

## Protection compatibility and integrity exception

GitHub branch protection endpoint reports main not protected; repository rulesets and applicable main rules both empty. This is a pre-existing policy gap, not changed here. CI's name/job context `test` remains compatible with any externally configured requirement; no trigger path exclusions can leave a required PR check pending.

The public-release integrity test freezes workflows as well as runtime. CT-INFRA-GHA-01 explicitly authorizes workflow infrastructure edits, so its fixture is updated for exactly four reviewed paths: ci.yml,prod-watch.yml,.github/scripts/prod-watch.sh,tests/githubActionsCost.test.js. Before update, every other baseline path was independently compared byte-for-byte to4894c5b. No regex, assertion or broad exception changes. Protected membership grows792→794 for the new script/test; previous digest and exact authorization list are retained in fixture metadata. Runtime/backend/private/frontend application files remain unchanged. Website PRs must consume this new baseline after the separately authorized infra merge; never regenerate it for a website diff.

## Verification and rollback

Actionlint1.7.12 official Darwin ARM64 artifact SHA256 aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f; workflow syntax/contexts pass (external ShellCheck unavailable; bash -n plus behavioral mock tests cover the monitor).22new tests exercise triggers/gates, actual concurrency expressions for same/different PRs and protected branches, HTTPS/TLS/health errors, operator presence/absence and401/403/503 containment versus200/redirect/errors; all curl calls mocked. Boundary assertions remain unchanged. Complete repository CI required on exact final head.

Live public replacement validation uses GET only, no token; authenticated behavior is mock-tested and original production run's authenticated step passed. No schedule or post-merge main run is claimed activated before merge. No extra live monitor was dispatched from the branch.

Rollback: revert this PR's commit through reviewed CI, including the exact prior fixture digest/count together with workflows/script/test. That restores duplicate CI/legacy startup overhead, not an application deployment change by itself; merging any commit can still trigger Railway, so Founder merge/release authorization remains necessary. No rollback executed.

Sources: [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [official actionlint release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12).
