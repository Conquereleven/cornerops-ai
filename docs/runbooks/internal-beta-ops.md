# Internal Beta Operations

Start with `CORNEROPS_BETA_MODE=true`, strict security enabled and dry run true.
Run `npm run control:tower` before each beta session. Review pending approvals
and denied/error audit counts; stop if status is unhealthy.

GitHub may be enabled only through the read-only runbook. Keep WhatsApp, Slack,
Telegram, Notion, Gmail, Google Workspace, crawlers, local personal archives,
native host tools and OpenClaw ecosystem services disabled.

Review `/api/control-tower/approvals` and `/api/control-tower/audit-summary` with
the internal API key. To shut down, stop the process, set all integration flags
false, remove runtime tokens and confirm Control Tower reports mock/dry-run.

Do not enable GitHub writes, channel sends, crawler sync, host control, automatic
ClawHub installation or production data mutation during v0.3.
