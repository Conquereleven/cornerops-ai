# Permissions

Default policy:

- read-only actions are allowed
- draft actions never send externally
- sensitive actions require confirmation
- admin actions require admin role and confirmation
- destructive actions are forbidden

OpenClaw tools can also be restricted with `OPENCLAW_ALLOWED_TOOLS`.
