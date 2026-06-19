# Founder Workflow v0.5

1. Run `npm run cornerops -- control`. Confirm writes and external sends are blocked.
2. Run `npm run cornerops -- briefing`. Review the top three source-backed priorities.
3. Ask which B2B leads need follow-up. Treat mock accounts as examples, not live pipeline.
4. Ask for follow-up drafts. Review assumptions; do not send from CornerOps.
5. Ask which quotes and orders require action, then review manual payments separately.
6. Ask for the GitHub/Codex engineering summary. Convert recommendations into drafts only.
7. Run `npm run cornerops -- approvals`. Approve/reject only to test review UX; no underlying action runs.
8. Run `npm run cornerops -- audit denied` and ask for security risks.

Use one `npm run cornerops` interactive session when follow-up questions need short-term intent continuity. Sessions do not retain raw conversation text.
