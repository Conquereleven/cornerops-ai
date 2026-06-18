# Native Tools Policy

Native tools are dangerous because they can touch host UI, local accounts, files, cookies, messages, media, terminal sessions and credentials.

## Allowed Modes

- `dry_run`
- `read_only`
- `document_only`

## Blocked By Default

- Host UI automation.
- Clicks or accessibility control.
- Sends, deletes or external writes.
- Cookie-based automation.
- Terminal command execution.
- Filesystem access outside `CLAWSAFE_ROOT`.

## Per Tool

- `gogcli`: dry-run Google Workspace search only.
- `wacli`: read-only WhatsApp archive search only.
- `goplaces`: dry-run public lead discovery.
- `clawpdf`: mock/local PDF parsing.
- Peekaboo, AXorcist, imsg, remindctl, spogo, songsee: document-only.

All enablement requires approval.
