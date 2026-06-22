const { OpenClawEcosystemPolicy } = require('../../../src/core/openclaw-ecosystem/OpenClawEcosystemPolicy');
const { OpenClawEcosystemRegistry } = require('../../../src/core/openclaw-ecosystem/OpenClawEcosystemRegistry');
const { CraboxRunnerAdapter } = require('../../../src/core/openclaw-ecosystem/adapters/CraboxRunnerAdapter');
const { ClawHubSkillRegistryAdapter } = require('../../../src/core/openclaw-ecosystem/adapters/ClawHubSkillRegistryAdapter');
const { LobsterWorkflowShellAdapter } = require('../../../src/core/openclaw-ecosystem/adapters/LobsterWorkflowShellAdapter');
const dataCore = require('../../../src/core/data');

describe('OpenClaw ecosystem controlled adapters', () => {
  test('registry registers all ecosystem services', () => {
    const registry = new OpenClawEcosystemRegistry({ config: {} });
    expect(registry.list().map((service) => service.id).sort()).toEqual([
      'clawhub',
      'clawsweeper',
      'clickclack',
      'crabfleet',
      'crabox',
      'lobster',
      'octopool',
    ]);
  });

  test('policy blocks disabled services', () => {
    const registry = new OpenClawEcosystemRegistry({ config: {} });
    const policy = new OpenClawEcosystemPolicy({ ecosystemEnabled: false });
    const decision = policy.evaluate({
      agentId: 'dev-codex-github-agent',
      operation: 'runSuite',
      service: registry.get('crabox'),
    });
    expect(decision.allowed).toBe(false);
  });

  test('CraboxRunnerAdapter runs only in dry run', async () => {
    const registry = new OpenClawEcosystemRegistry({ config: { craboxEnabled: true, craboxDryRun: true } });
    const policy = new OpenClawEcosystemPolicy({ ecosystemEnabled: true, dryRun: true, requireApproval: false });
    const adapter = new CraboxRunnerAdapter({ registry, policy, auditLogService: dataCore.auditLogService });
    const result = await adapter.runSuite({ suite: 'unit' }, { agentId: 'dev-codex-github-agent' });
    expect(result.status).toBe('dry_run');
    expect(result.message).toMatch(/simulated/);
  });

  test('ClawHub does not install skills automatically and requires approval for approval actions', async () => {
    const registry = new OpenClawEcosystemRegistry({ config: { clawhubEnabled: true } });
    const policy = new OpenClawEcosystemPolicy({ ecosystemEnabled: true, dryRun: true, requireApproval: true });
    const adapter = new ClawHubSkillRegistryAdapter({
      adapter: dataCore.mockDataAdapter,
      approvalService: dataCore.approvalService,
      registry,
      policy,
    });
    const proposal = await adapter.proposeSkillForReview({
      name: 'Shell skill',
      permissions: ['command_execution'],
    }, { agentId: 'security-audit-agent' });
    expect(proposal.status).toBe('dry_run');
    expect(proposal.skill.riskLevel).toBe('high');
    const approval = await adapter.approveSkill({ id: 'skill-read-github' }, { agentId: 'security-audit-agent' });
    expect(approval.status).toBe('needs_approval');
  });

  test('LobsterWorkflowShellAdapter only executes workflow dry-runs', async () => {
    const registry = new OpenClawEcosystemRegistry({ config: { lobsterEnabled: true } });
    const policy = new OpenClawEcosystemPolicy({ ecosystemEnabled: true, dryRun: true });
    const adapter = new LobsterWorkflowShellAdapter({ registry, policy });
    const result = await adapter.dryRunWorkflow({ workflowId: 'daily-briefing.workflow' }, { agentId: 'daily-briefing-agent' });
    expect(result.status).toBe('dry_run');
    expect(result.dryRunOutput).toMatch(/simulated/);
  });

  test('future services remain document-only or disabled', async () => {
    await expect(dataCore.clawsweeperTriageAdapter.triage()).resolves.toMatchObject({ status: 'document_only' });
    await expect(dataCore.crabfleetMissionControlAdapter.listMissions()).resolves.toMatchObject({ status: 'document_only' });
    await expect(dataCore.clickclackChatAdapter.listRooms()).resolves.toMatchObject({ status: 'document_only' });
  });
});
