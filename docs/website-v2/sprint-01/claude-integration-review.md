I made all three corrections in the two staged files. I didn't commit, touch any Codex file or use any production connector. I couldn't compute file hashes because the hash command needed approval, so check the content against the replacement text below when you import. Neither file was re-rendered after the edits.

## Corrected files (staged at `/tmp/ctv2-s01-staging`)

### 1. `docs/website-v2/EXPERIENCE_SPEC.md`

**§7.9, line 513** now reads:
> - **319 px — current public V1 observation:** CT-WEB-LIVE-02 production acceptance at merge `4894c5b` (`outputs/CT-WEB-LIVE-02/POST_DEPLOYMENT_REPORT.md`) found no overflow at measured CSS widths 341 and 931 px, but the default browser's **319 px viewport reported overflow** on the public Website 1.0; that hotfix changed no layout CSS and records it as an open narrow-viewport follow-up, not a resolved responsive audit. It is not claimed fixed in public V1. (The older private-dashboard note in `design-qa.md` is a separate, earlier observation and is not this evidence.) V2 rule: no fixed `min-width` at or above 320 px; `document.documentElement.scrollWidth ≤ clientWidth` at **319 and 320** as explicit S02 regression checks, recorded in S02/S04 QA alongside 390/430/768/1024/1280/1440.

**§12, D3 corporate email** now reads:
> **Corporate email:** `joel@cornertech.ae` is **VERIFIED per Founder** and is the **proposed public replacement** for the personal Gmail default. Proposal only — no `siteConfig`, deployment or provider change in S01; the switch is a separate Founder-approved change

**§4.3, `home.contact.privacyNote`** now reads:
> This page has no enquiry form or first-party analytics. Email and WhatsApp have their own privacy practices. A message is sent only if you choose to send it.

### 2. `docs/website-v2/sprint-01/experience-preview.html`

**Line 619** now has the same wording as the spec:
```html
<p class="contact-note">This page has no enquiry form or first-party analytics. Email and WhatsApp have their own privacy practices. A message is sent only if you choose to send it.</p>
```
I checked the preview's CTAs and they are still inert. Every link is a local `#home`, `#commerce` or `#solutions` anchor. There is no `mailto:`, no `wa.me` link, no form, no input and no external script.

---

## Independent review of Codex integration (runtime base `4894c5b`)

**Scope:** Codex's architecture, claims, ownership and S02 dependencies only. This is **not** approval of my own experience artifact, and not Founder publication approval.

**Verdict: CHANGES** (minor; none blocks the S01 documentation).

**What checks out:**
- **Provenance:** the base `ccda922`, runtime `4894c5b` and Railway deployment `a1491b7b` all match the CT-WEB-LIVE-02 report. PR96 stays Draft and no PR91/92 history is imported.
- **Ownership:** H-002 gives Claude two files and Codex the rest, with no peer edits.
- **Claims:** the mapping (C01/C02/C17/C07/C10/C20) is correct. The rule that source-only evidence never counts as "available" holds, and missing approval means the item is omitted.
- **Status notices:** D1–D7 are kept as PROPOSED. Every notice states that `joel@cornertech.ae` is verified per Founder but not authorized for deployment.
- **S02 order:** V2-200 (entry-graph gate) comes first, then V2-201 (Claude sole writer), then integration. The backlog's S02 table, row 6, already includes the 319 px regression.

**Changes needed:**
1. **`approvalId` is missing from the public payload — S02 contract dependency.** `SPRINT01_ENGINEERING_REVIEW.md:15` says the public payload contains only "approved text, publicStatus, claimId and synthetic labels". `content@1` (spec §6.1/§9.1) also ships an opaque `approvalId`, which the build gate needs. Either add `approvalId` (opaque, carries no evidence) to that list, or ask me for a `content@1` change. This must be settled before the V2-200 sanitization and approval tests are written, or they will either fail or strip the field.
2. **The 319 px observation isn't in the risk gates.** `RISKS_AND_RELEASE_GATES.md:50` and its resumption notice cover 320 px reflow but not the open 319 px overflow on public V1 from CT-WEB-LIVE-02. Add it as an open V1 observation (not fixed) with a 319 + 320 regression gate, matching backlog row 6.
3. **The S01 evidence list leaves out widths the spec requests.** `SPRINT01_ENGINEERING_REVIEW.md:13` lists screenshots without `commerce-768`, `solutions-768` or any 319/320 capture, while spec §14 asks for 390/768/1440 plus 319/320. Either add them or record in VALIDATION.md that they weren't captured.
4. **D3 row wording.** In `SPRINT01_ENGINEERING_REVIEW.md:25`, the D3 row should name `joel@cornertech.ae` as verified per Founder and the proposed replacement, to match the notices. This is wording only.

**S02 note, not a defect:** V1 production sends "Discuss a project" straight to WhatsApp. The proposed V2 sends it to `/#contact`, with the booking-then-WhatsApp fallback kept inside each contact intent. Backlog row 5 should record that change of target explicitly, so nobody reads it as a regression.
