const { AcpxSessionAdapter } = require('../../../src/core/sdk-bridges/AcpxSessionAdapter');
const { AgentSkillsCatalog } = require('../../../src/core/sdk-bridges/AgentSkillsCatalog');
const { ClawbenchBenchmarkService } = require('../../../src/core/sdk-bridges/ClawbenchBenchmarkService');
const { McporterMcpAdapter } = require('../../../src/core/sdk-bridges/McporterMcpAdapter');
const { PluginInspectorService } = require('../../../src/core/sdk-bridges/PluginInspectorService');

describe('SDK bridges', () => {
  test('PluginInspectorService returns risk report', () => {
    const report = new PluginInspectorService().inspect({
      permissions: ['command_execution'],
    });
    expect(report.riskLevel).toBe('high');
    expect(report.allowed).toBe(false);
  });

  test('ClawbenchBenchmarkService produces mock benchmark', async () => {
    const report = await new ClawbenchBenchmarkService().runMockSuite();
    expect(report.status).toBe('dry_run');
    expect(report.scores.toolSafety).toBeGreaterThan(0.9);
  });

  test('AgentSkillsCatalog enforces allowlist', async () => {
    const catalog = new AgentSkillsCatalog();
    await expect(catalog.isAllowed('context.search')).resolves.toBe(true);
    await expect(catalog.isAllowed('unknown.skill')).resolves.toBe(false);
  });

  test('McporterMcpAdapter does not call real MCP when disabled', async () => {
    const result = await new McporterMcpAdapter({ enabled: false }).callTool({ toolName: 'test' });
    expect(result.status).toBe('dry_run');
  });

  test('AcpxSessionAdapter does not create real session when disabled', async () => {
    const result = await new AcpxSessionAdapter({ enabled: false }).createSession({ agentId: 'agent' });
    expect(result.status).toBe('dry_run');
  });
});
