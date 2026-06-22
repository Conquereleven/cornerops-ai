const serviceDefinitions = (config = {}) => [
  {
    id: 'crabox',
    name: 'Crabox',
    enabled: Boolean(config.craboxEnabled),
    mode: config.craboxDryRun === false ? 'approval_required' : 'dry_run',
    priority: 'integrate_now',
    description: 'Sandbox runner for diffs/tests. In v0.1 it only returns dry-run plans.',
    allowedAgents: ['dev-codex-github-agent', 'security-audit-agent'],
    allowedOperations: ['prepareSandbox', 'syncDiff', 'runSuite', 'destroySandbox'],
    requiresApprovalFor: ['runSuite'],
    riskLevel: 'high',
  },
  {
    id: 'octopool',
    name: 'Octopool',
    enabled: Boolean(config.octopoolEnabled),
    mode: 'read_only',
    priority: 'integrate_now',
    description: 'GitHub relay/cache for read-only repository metadata.',
    allowedAgents: ['daily-briefing-agent', 'dev-codex-github-agent', 'security-audit-agent'],
    allowedOperations: ['listIssues', 'listPullRequests', 'listWorkflowRuns', 'getRepositorySummary'],
    requiresApprovalFor: [],
    riskLevel: 'medium',
  },
  {
    id: 'clawhub',
    name: 'ClawHub',
    enabled: Boolean(config.clawhubEnabled),
    mode: 'read_only',
    priority: 'integrate_now',
    description: 'Curated skill registry in allowlist/read-only mode.',
    allowedAgents: ['dev-codex-github-agent', 'security-audit-agent'],
    allowedOperations: ['listApprovedSkills', 'proposeSkillForReview', 'approveSkill', 'disableSkill'],
    requiresApprovalFor: ['approveSkill', 'disableSkill'],
    riskLevel: 'high',
  },
  {
    id: 'lobster',
    name: 'Lobster',
    enabled: Boolean(config.lobsterEnabled),
    mode: 'dry_run',
    priority: 'integrate_now',
    description: 'Workflow shell for dry-run operational flows.',
    allowedAgents: ['daily-briefing-agent', 'b2b-sales-agent', 'quotes-orders-agent', 'dev-codex-github-agent', 'security-audit-agent'],
    allowedOperations: ['listWorkflows', 'dryRunWorkflow', 'proposeWorkflow'],
    requiresApprovalFor: ['runWorkflow'],
    riskLevel: 'medium',
  },
  {
    id: 'clawsweeper',
    name: 'ClawSweeper',
    enabled: Boolean(config.clawsweeperEnabled),
    mode: 'document_only',
    priority: 'later',
    description: 'Future issue/PR triage adapter. Document-only in v0.1.',
    allowedAgents: ['dev-codex-github-agent', 'security-audit-agent'],
    allowedOperations: ['triage'],
    requiresApprovalFor: ['triage'],
    riskLevel: 'medium',
  },
  {
    id: 'crabfleet',
    name: 'Crabfleet',
    enabled: Boolean(config.crabfleetEnabled),
    mode: 'document_only',
    priority: 'later',
    description: 'Future mission-control/fleet operations. Disabled by default.',
    allowedAgents: ['security-audit-agent'],
    allowedOperations: ['listMissions'],
    requiresApprovalFor: ['createMission', 'runMission'],
    riskLevel: 'critical',
  },
  {
    id: 'clickclack',
    name: 'ClickClack',
    enabled: Boolean(config.clickclackEnabled),
    mode: 'document_only',
    priority: 'later',
    description: 'Future internal chat console. Disabled by default.',
    allowedAgents: ['daily-briefing-agent', 'security-audit-agent'],
    allowedOperations: ['listRooms'],
    requiresApprovalFor: ['sendMessage'],
    riskLevel: 'medium',
  },
];

class OpenClawEcosystemRegistry {
  constructor({ config = {}, services } = {}) {
    this.services = new Map();
    (services || serviceDefinitions(config)).forEach((service) => this.register(service));
  }

  register(service) {
    if (!service?.id) throw new Error('OpenClaw ecosystem service id is required.');
    if (this.services.has(service.id)) throw new Error(`Duplicate ecosystem service id: ${service.id}`);
    this.services.set(service.id, { ...service });
    return this.get(service.id);
  }

  list() {
    return Array.from(this.services.values()).map((service) => ({ ...service }));
  }

  get(id) {
    const service = this.services.get(id);
    return service ? { ...service } : null;
  }
}

module.exports = {
  OpenClawEcosystemRegistry,
  serviceDefinitions,
};
