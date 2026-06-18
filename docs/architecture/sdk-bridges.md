# SDK Bridges

- `mcporter`: MCP bridge stub. It never calls real MCPs unless enabled and policy allows.
- `acpx`: ACP session stub. No real session by default.
- `plugin-inspector`: offline risk report for plugins/skills.
- `clawbench`: mock benchmark for routing, policy, context retrieval and tool safety.
- `agent-skills`: approved skill catalog, integrated with ClawHub allowlist where available.
- `clawpatch`: patch/PR landing stub. No real patching in v0.2.

All SDK bridges are subordinate to CornerOps policy and audit.
