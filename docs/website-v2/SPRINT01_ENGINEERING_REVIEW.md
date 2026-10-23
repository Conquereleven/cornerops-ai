# CT-WEB-V2 Sprint01 — engineering integration and decision record

Status: Sprint01 authorized; design and copy are proposals. No merge/deployment authorization. This document records Codex review separately from Claude's experience authorship; final exact head/CI appear in the Draft PR and delivery evidence.

## Reconciliation and provenance

Verified origin/main `4894c5b028cdb4ac469e5b7ecf01fd38c20330db`; PR96 OPEN/Draft at `754f4868026d4fa899c90fa201814178bf4339a7`. Import commit `ccda922831de68efb0eb1ea0cf1490bded101964` copies only the 11 accepted Sprint00 documentation artifacts. Existing application, security fixture, dependencies and workflows come directly from secured main. No older component code is imported. Sprint00 original audit/Claude findings/evidence remain historical; dated notices supersede stale authorization, DNS and booking wording. Production acceptance evidence is outputs/CT-WEB-LIVE-02/POST_DEPLOYMENT_REPORT.md in the task workspace. No new production audit was needed for documentation execution.

## Handoff H-002 — exact file ownership

Common base: `ccda922831de68efb0eb1ea0cf1490bded101964` (full SHA recorded in Git). Codex integration worktree `work/cornerops-v2-s01`, branch `feature/ct-web-v2-s01`; Claude contributor worktree `work/cornerops-v2-s01-claude`, branch `feature/ct-web-v2-s01-experience`.

Claude sole writer: `docs/website-v2/EXPERIENCE_SPEC.md`, `docs/website-v2/sprint-01/experience-preview.html`. V2-101 through V2-106 assigned together because copy/tokens/schema are dependent. V2-104 final approval remains Founder responsibility. Codex sole writer: the eight existing planning documents with resumption notices, this engineering review, Sprint02 readiness backlog appended to the existing backlog, and evidence files `docs/website-v2/sprint-01/{VALIDATION.md,claude-integration-review.md,visual-qa.json,contrast-check.json,{home,commerce,solutions}-{319,320,390,768,1440}.png,home-hero-390.png}`. No agent edits a peer file. Review findings on Claude files go back as proposals or a serialized ownership transfer; no silent rewrite.

Provider interfaces content@1 / tokens@1 are design contracts only. Runtime consumers planned for S02: Claude public sections/content/styles, Codex routing/manifest/metadata wiring. No frontend source is authored in S01. All copy/metadata text remains Claude-owned; Codex's manifest will select route IDs and consume it. Evidence approvals remain internal and are stripped before public output. Public payload exposes only approved text, publicStatus, claimId, opaque approvalId (no evidence) and synthetic labels, never provenance/customer identifiers. A private runtime module is never an approval-data source for a public build.

Review timebox: one working session, 0.5 day per complete handoff; silence never approves. Breaking schema/token changes require major version, migration and both consumer/provider review. Additive changes need documented omission semantics. UI proposal screenshots are local documentation; no hosted preview. HTML must have no network code, executable external dependencies, data collection or active contact action.

## Founder decisions — all PROPOSED

| ID | Recommended default | Consequence / required decision |
| --- | --- | --- |
| D1 | Project enquiry primary; Commerce visually prominent; design-partner enquiry secondary | Converts available engineering work without implying Commerce access. Founder accepts CTA hierarchy before copy signoff. |
| D2 | Cyan #00D7FF accent, cobalt #2563EB action fill; Geist/mark/navy retained | White-on-cobalt actions; cyan is not white-background text. Approve semantic pairs after contrast review, not unrestricted palette substitution. |
| D3 | Two vetted project/design-partner intents via email/WhatsApp with generic prefill | No form or visitor collection. Founder approves exact prefill and the proposed public replacement `joel@cornertech.ae`, already VERIFIED per Founder. Existing V1 destinations persist until separate approved implementation/release. |
| D4 | Exclude Tres Leches standalone case; use fictional process/principles composition | No customer permission dependency. Do not imply synthetic diagrams are testimonials or shipped screens. |
| D5 | Exclude unsupported enterprise-grade/ready, certification, scale and outcome claims; use “Software built for real operations.” | Positioning expresses intent, not a measured outcome or guarantee. Founder approves final narrative. |
| D6 | Narrow static-serving/404/cache review before S03 | Plan only. No server, package/build or protected-test exception inferred; technical SEO release remains gated. |
| D7 | Claude solely refactors CornerTechSite.tsx in S02; Codex owns routing/integration | Prevents overlapping authorship. S02 still needs explicit start authorization and transitive isolation entry gate. |

## Codex architecture and claims review criteria

React/Vite retained. Designs must fit public deterministic prop-driven components without private modules, auth, client fetches or provider calls. Build-time metadata/prerender stays a planning dependency, not tested implementation. Only three initial routes; Company/Contact are home hashes. Cross-route links come from manifest, route changes reset scroll/focus to main/h1, hash arrival respects sticky header, history restores position without stealing focus; verify keyboard and back/forward in S02/S03.

Claims review maps company/flagship to C01, service trio to C02, process to C17, product direction to C07/C10 and design-partner interest to C20. No new evidence that any Commerce capability is available exists in this sprint. Detailed product modules default omitted pending exact text/status approval; diagrams show fictional concepts, not implementation proof. C08/C09 source contracts cannot establish product availability. No case C14/C15, internal system C13, research C19, unsupported C23, provider logos or outcome numbers in approved publication candidates.

Each future rendered capability must have claimId, internal evidence reference/evidenceLevel, text/status version, approver/date and permissions. Evidence must support the selected publicStatus; source-only evidence never available. Missing/stale approval omits content, unknown IDs/incompatible statuses fail build validation. General Founder strategy confirmation does not approve exact proposed copy. Docs can display pending proposals visibly; production cannot render pending approval fields. No evidence/approval runtime client is introduced.

No phone/email visitor data in synthetic illustrations; every illustration has a visible fictional-data caption and alternative. Audience/jobs/objections are planning hypotheses, not interviews. Design-partner enquiry offers discussion only, not provisioned access/date. Corporate email replacement is proposed solely under this sprint's explicit permission.

## Review and evidence completion

Claude source contribution, Codex findings, actual independent Claude review of Codex integration, screenshots, protected-tree comparison and exact-head CI are recorded in sprint-01/VALIDATION.md and the Draft PR after generation. No independent approval is presumed here. Sprint02 recommendation is conditional until those results and pending Founder decisions are explicit.


## Completed Codex cross-review and reciprocal dispositions

Claude contribution source `7c6adddb8c077010cddfd3a1d1593b2e123517cb`; correction `00ab57d4a581019e210d813d0df498c78f9b649d`. Actual Claude Code authored the staged files; Codex imported them unchanged and created attributed commits because Claude's write guard rejected the local destination path. This is explicit contributor provenance, not a claim Claude personally executed git commit. Cherry-picks preserve those records and source references.

Codex reviewed the complete 772-line experience specification and static composition: accept after three material corrections (public V1 319px provenance; verified corporate email proposal; bounded first-party privacy wording). Corrections reviewed in the exact source diff. No new product capability evidence was added; every detailed Commerce candidate remains pending and omitted from future production until specifically approved. The HTML visibly displays proposed capabilities for review, not the production omission implementation.

Claude independently reviewed Codex integration documents: CHANGES REQUESTED (original preserved in sprint-01/claude-integration-review.md), not unconditional GO. Dispositions: R1 ACCEPT, opaque approvalId added to public payload contract; R2 ACCEPT, public V1 319px risk and 319/320 gates explicitly recorded in risks; R3 ACCEPT, captures expanded to all three pages at 319/320/390/768/1440; R4 ACCEPT, D3 explicitly names verified joel@cornertech.ae as proposed replacement. Non-defect note ACCEPT: V2 project CTA intentionally moves from direct WhatsApp to /#contact, channel fallback remains within intent. These are Codex dispositions of concrete corrections, not a claim Claude re-reviewed this final head. No material disagreement remains; no further routine review cycle requested.

Spec requests to Codex accepted: C03 lede replacement is a proposed C01/C02 service proposition; D5 wording is C01 positioning, C17 process/status principle; neither is new evidence or publication approval. Add scoped unsupported-claim checks plus evidence-string bundle checks to V2-200; negative/negated policy prose must not be blindly rejected by a keyword lint. Metadata/content draft source is EXPERIENCE_SPEC.md; one copy source, no manifest-authored alternatives. All 33 proposed contrast pairs independently recalculated and matched. 319/320 regression added. Component contracts are feasible with existing React/Vite, without runtime private imports, provider calls or new packages. Real HTTP SEO/404 remains a separate S03 prerequisite, not certified by these hash-switch compositions.

**Sprint02 recommendation: GO WITH CONDITIONS for Founder authorization.** Required before component integration: D1–D5 exact narrative/token/claims approval, D7 writer confirmation, S02 start authorization and reviewed V2-200 transitive-isolation/approval gates. Missing capability approvals mean omission, not an exception. D6 narrow review before S03; no protected implementation permission implied.
