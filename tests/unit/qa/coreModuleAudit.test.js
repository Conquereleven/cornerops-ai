const { AgentRegistry } = require('../../../src/core/agents/AgentRegistry');
const { coreAgentDefinitions } = require('../../../src/core/agents/definitions');
const { DataSourceRegistry } = require('../../../src/core/data/DataSourceRegistry');
const { ContextSourceRegistry } = require('../../../src/core/context/ContextSourceRegistry');
const { OpenClawEcosystemRegistry } = require('../../../src/core/openclaw-ecosystem/OpenClawEcosystemRegistry');

describe('core module QA audit', () => {
  test('core entrypoints import without errors', () => {
    expect(() => require('../../../src/core/agents')).not.toThrow();
    expect(() => require('../../../src/core/data')).not.toThrow();
    expect(() => require('../../../src/core/context')).not.toThrow();
    expect(() => require('../../../src/core/control-tower')).not.toThrow();
    expect(() => require('../../../src/integrations/openclaw')).not.toThrow();
  });

  test('registries reject duplicate identifiers', () => {
    const agent = coreAgentDefinitions[0];
    expect(() => new AgentRegistry({ agents: [agent, agent] })).toThrow(/Duplicate agent id/);
    const dataSource = { id: 'orders', enabled: true, mode: 'mock' };
    expect(() => new DataSourceRegistry({ sources: [dataSource, dataSource] })).toThrow(/Duplicate data source id/);
    const contextSource = {
      id: 'github_archive', enabled: true, mode: 'mock', piiLevel: 'low', searchable: true,
    };
    expect(() => new ContextSourceRegistry({ sources: [contextSource, contextSource] }))
      .toThrow(/Duplicate context source id/);
    const ecosystem = { id: 'octopool', enabled: false, mode: 'read_only', riskLevel: 'medium' };
    expect(() => new OpenClawEcosystemRegistry({ services: [ecosystem, ecosystem] }))
      .toThrow(/Duplicate ecosystem service id/);
  });

  test('environment defaults are fail-closed', () => {
    const env = require('../../../src/config/env');
    expect(env.corneropsFailClosed).toBe(true);
    expect(env.corneropsStrictSecurityMode).toBe(true);
    expect(env.corneropsPiiMasking).toBe(true);
    expect(env.corneropsLogSanitization).toBe(true);
    expect(env.githubReadOnly).toBe(true);
    expect(env.githubAllowIssueCreation).toBe(false);
    expect(env.githubAllowPrWrite).toBe(false);
    expect(env.githubAllowWorkflowTrigger).toBe(false);
  });
});
