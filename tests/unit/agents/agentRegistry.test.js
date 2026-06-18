process.env.NODE_ENV = 'test';

const { AgentRegistry } = require('../../../src/core/agents/AgentRegistry');
const { AGENT_IDS } = require('../../../src/core/agents/agentTypes');
const { coreAgentDefinitions } = require('../../../src/core/agents/definitions');

describe('AgentRegistry', () => {
  test('registers all Core Agent Pack v0.1 agents', () => {
    const registry = new AgentRegistry({ agents: coreAgentDefinitions });

    expect(registry.listActive()).toHaveLength(6);
    expect(registry.has(AGENT_IDS.ROUTER)).toBe(true);
    expect(registry.has(AGENT_IDS.DAILY_BRIEFING)).toBe(true);
    expect(registry.has(AGENT_IDS.B2B_SALES)).toBe(true);
    expect(registry.has(AGENT_IDS.QUOTES_ORDERS)).toBe(true);
    expect(registry.has(AGENT_IDS.DEV_CODEX_GITHUB)).toBe(true);
    expect(registry.has(AGENT_IDS.SECURITY_AUDIT)).toBe(true);
  });

  test('returns null for missing agents and exposes permission metadata', () => {
    const registry = new AgentRegistry({ agents: coreAgentDefinitions });

    expect(registry.get('missing-agent')).toBeNull();
    expect(registry.getPermissionMetadata(AGENT_IDS.B2B_SALES)).toMatchObject({
      id: AGENT_IDS.B2B_SALES,
      permissionLevel: 'draft_only',
    });
    expect(registry.getBasePrompt(AGENT_IDS.DAILY_BRIEFING))
      .toContain('daily-briefing-agent');
    expect(registry.getAllowedTools(AGENT_IDS.SECURITY_AUDIT))
      .toContain('read_audit_logs');
  });

  test('can disable agents by config', () => {
    const registry = new AgentRegistry({
      agents: coreAgentDefinitions,
      disabledAgentIds: [AGENT_IDS.SECURITY_AUDIT],
    });

    expect(registry.get(AGENT_IDS.SECURITY_AUDIT).enabled).toBe(false);
    expect(registry.listActive().map((agent) => agent.id))
      .not.toContain(AGENT_IDS.SECURITY_AUDIT);
  });
});
