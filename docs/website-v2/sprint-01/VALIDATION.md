# Sprint01 validation and review evidence

Runtime base: `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`.
Accepted S00 source: `754f4868026d4fa899c90fa201814178bf4339a7`, PR96 remains OPEN/Draft and unchanged. S00 import commit `ccda922831de68efb0eb1ea0cf1490bded101964`.

## Scope checks
Independent full-tree comparison against the runtime base checks Git blob IDs and path membership for every path outside `docs/website-v2/`: 1,182 files identical. This is stricter than the existing public-presentation exemption. No protected hash/fixture regenerated. Original independent S00 findings and both S00 evidence JSON files are byte-identical to the accepted PR96 source; their old observations remain dated historical evidence.

`git diff --check` passed. Local security/boundary selection: 4 suites, 19 tests passed (`public-release-boundary`, `apiContainment`, `requestLoggingContainment`, `apiRouteInventory`). The first sandbox run could not bind Supertest's local socket (EPERM); a rerun with local socket permission passed. Local Node was v26.4.0; GitHub's Node22 CI is the release validation environment. No runtime source changed, so full duplicate local suites were not needed; the existing complete CI workflow runs on the final PR head.

## Evidence limits
These are local specification/composition checks, not production route, server SEO, product availability, accessibility certification, field performance or customer-data evidence. S02 must test actual React implementation and transitive imports. No production requests, external contact action, OAuth, database, deployment or infrastructure mutation belongs to this sprint.

## Contribution and reciprocal review

Actual Claude Code staged the two owned artifacts; its tooling rejected writes to the local destination. Codex imported byte-identical staged files and recorded source `7c6adddb8c077010cddfd3a1d1593b2e123517cb` with Claude coauthor attribution, then Claude's corrections as `00ab57d4a581019e210d813d0df498c78f9b649d`. Integration cherry-picks retain original references (`70a3fe9`, `03bea7f`). Claude's own content is reviewed by Codex, not self-approved. Claude's independent review of Codex integration requested four changes; original text is preserved in claude-integration-review.md, with all four dispositions and exact fixes in SPRINT01_ENGINEERING_REVIEW.md. No claim of independent approval of the later evidence-only commit is made.

## Visual and static evidence

- Static HTML validation: no external href/src, network APIs or forms; all relative HTML assets exist; noindex present. CSP also bounds the local artifact; no deployment output changed.
- Independently calculated 33 contrast pairs match the spec to two truncated decimal places and pass each recorded text/non-text threshold; see contrast-check.json. This does not certify all eventual runtime combinations.
- Final local compositions: 24 measured cases, all three pages ×319/320/390/430/768/1024/1280/1440 CSS px; no horizontal document overflow and exactly one visible h1 per route. See visual-qa.json. This is composition evidence, not a fix to V1 production.
- Final screenshots: all three pages at319/320/390/768/1440; home hero390 is a compact preview. Screenshots display draft/proposed claim notes; pending Commerce candidates are deliberately visible for Founder review. Future production must filter them through approvals.
- Actual mobile menu opens, Escape closes it and returns focus to Menu with aria-expanded=false. Browser error log empty. Source includes focus ring, reduced-motion and growing text controls. Full200% text-only resize, WebKit, screen-reader testing and React route/history restoration remain implementation QA in S02/S03; not claimed passed here.
- Local view switches are hash-based documentation controls, not implemented production routes or SEO evidence. Contact channel buttons are inert; no messages or real external actions occurred.

Exact final head, complete GitHub CI run and final scope/secret-scan results are recorded in the Draft PR and delivery report, avoiding a self-referential commit hash in this document. No merge or deployment is permitted by CI success.
