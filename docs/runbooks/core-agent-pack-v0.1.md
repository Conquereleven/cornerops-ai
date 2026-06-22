# Core Agent Pack v0.1 Runbook

## Safe Defaults

```env
CORNEROPS_AGENTS_ENABLED=true
CORNEROPS_AGENT_PACK_VERSION=v0.1
CORNEROPS_DEFAULT_AGENT=cornerops-router-agent
CORNEROPS_DRY_RUN=true
CORNEROPS_REQUIRE_APPROVAL=true
CORNEROPS_AUDIT_ENABLED=true

OPENCLAW_ENABLED=false
OPENCLAW_DRY_RUN=true
OPENCLAW_REQUIRE_APPROVAL=true
OPENCLAW_SANDBOX_MODE=non-main
```

No real channel sends, emails, GitHub writes, order changes or payment changes
are enabled by default.

## Activate Agents

Set:

```env
CORNEROPS_AGENTS_ENABLED=true
```

Optionally limit active agents:

```env
CORNEROPS_AGENT_ENABLED_IDS=daily-briefing-agent,b2b-sales-agent
```

## Disable Agents

Disable the pack:

```env
CORNEROPS_AGENTS_ENABLED=false
```

Disable specific agents:

```env
CORNEROPS_AGENT_DISABLED_IDS=dev-codex-github-agent
```

## Test Dry Run

Run:

```sh
npm run demo:agents
npm test
```

Expected behavior:

- Briefing returns `daily-briefing-agent`.
- B2B follow-up returns draft-only output.
- Quote/payment changes return `needs_approval`.
- GitHub issue creation returns `needs_approval`.
- Security audit stays read-only.

## Review Logs

Agent audit events are emitted as `agent_audit`. OpenClaw events are emitted as
`openclaw_audit`.

Use internal APIs:

```sh
curl -H "x-internal-api-key: $INTERNAL_API_KEY" \
  http://localhost:3000/api/openclaw/audit-logs
```

Agent-specific audit persistence is in memory for v0.1 and should be moved to
Supabase before production.

## Diagnose Incorrect Routing

1. Check message text and channel.
2. Review `AgentOrchestrator.routeMessage`.
3. Confirm agent is enabled in `AgentRegistry`.
4. Confirm channel is allowed for that agent.
5. Check audit event intent, confidence and risk.

## Add A New Agent

1. Add a definition in `src/core/agents/definitions`.
2. Add a prompt in `src/core/agents/prompts`.
3. Export the definition from `definitions/index.js`.
4. Add routing keywords in `AgentOrchestrator`.
5. Add policy tests and fixture coverage.
6. Document permissions and allowed channels.

## Change Permissions

Update the agent definition first. Then update:

- `AgentPermissionPolicy` tests
- docs/architecture/agents.md
- this runbook

Never expand mutating permissions without human approval and audit coverage.

## Operate Without OpenClaw

Keep:

```env
OPENCLAW_ENABLED=false
OPENCLAW_DRY_RUN=true
```

The orchestrator will return local dry-run responses and will not call external
OpenClaw services.

## Operate With OpenClaw

Only after approval:

1. Keep `CORNEROPS_DRY_RUN=true` for first validation.
2. Configure private `OPENCLAW_BASE_URL`.
3. Configure gateway token/password.
4. Set allowlisted channels/users/tools.
5. Validate `/api/openclaw/health`.
6. Review audit logs.
7. Lower dry-run flags only after controlled approval.
