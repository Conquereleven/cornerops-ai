const { CONTROLLED_ACTION_IDS, createActionError } = require('./actionTypes');

const buildDefaultDefinitions = (config = {}) => [
  {
    id: CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE,
    name: 'Create GitHub issue',
    description: 'Creates one issue in the configured CornerOps GitHub repository.',
    enabled: Boolean(config.corneropsControlledActionsEnabled && config.corneropsActionGithubIssueCreateEnabled),
    defaultMode: config.corneropsActionGithubIssueCreateDryRun === false ? 'approval_required' : 'dry_run',
    riskLevel: 'medium',
    allowedAgents: ['dev-codex-github-agent'],
    allowedChannels: ['slack', 'telegram', 'web', 'internal'],
    requiresApproval: true,
    requiresDryRunByDefault: true,
    externalSideEffect: true,
    productionDataImpact: false,
    rollbackStrategy: 'delete_created_resource',
  },
  {
    id: CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE,
    name: 'Create local internal note',
    description: 'Writes an internal note only to CornerOps local persistence.',
    enabled: Boolean(config.corneropsControlledActionsEnabled && config.corneropsActionInternalNoteCreateEnabled),
    defaultMode: config.corneropsActionInternalNoteCreateDryRun === false ? 'approval_required' : 'dry_run',
    riskLevel: 'low',
    allowedAgents: ['b2b-sales-agent', 'quotes-orders-agent'],
    allowedChannels: ['slack', 'telegram', 'web', 'internal'],
    requiresApproval: true,
    requiresDryRunByDefault: true,
    externalSideEffect: false,
    productionDataImpact: false,
    rollbackStrategy: 'manual',
  },
  {
    id: CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE,
    name: 'Create local internal task',
    description: 'Writes an internal task only to CornerOps local persistence.',
    enabled: Boolean(config.corneropsControlledActionsEnabled && config.corneropsActionInternalTaskCreateEnabled),
    defaultMode: config.corneropsActionInternalTaskCreateDryRun === false ? 'approval_required' : 'dry_run',
    riskLevel: 'low',
    allowedAgents: [
      'daily-briefing-agent',
      'b2b-sales-agent',
      'quotes-orders-agent',
      'security-audit-agent',
    ],
    allowedChannels: ['slack', 'telegram', 'web', 'internal'],
    requiresApproval: true,
    requiresDryRunByDefault: true,
    externalSideEffect: false,
    productionDataImpact: false,
    rollbackStrategy: 'manual',
  },
];

class ControlledActionRegistry {
  constructor({ config = {}, definitions } = {}) {
    this.actions = new Map();
    (definitions || buildDefaultDefinitions(config)).forEach((definition) => this.register(definition));
  }

  register(definition) {
    if (!definition?.id || this.actions.has(definition.id)) {
      throw createActionError('Controlled action id is missing or duplicated.', 'CONTROLLED_ACTION_INVALID');
    }
    this.actions.set(definition.id, Object.freeze({
      ...definition,
      allowedAgents: Object.freeze([...(definition.allowedAgents || [])]),
      allowedChannels: Object.freeze([...(definition.allowedChannels || [])]),
    }));
    return this.get(definition.id);
  }

  get(id) {
    return this.actions.get(id) || null;
  }

  require(id) {
    const action = this.get(id);
    if (!action) throw createActionError(`Unknown controlled action: ${id || 'missing'}.`, 'CONTROLLED_ACTION_UNKNOWN', 404);
    return action;
  }

  list() {
    return [...this.actions.values()].map((action) => ({
      ...action,
      allowedAgents: [...action.allowedAgents],
      allowedChannels: [...action.allowedChannels],
    }));
  }
}

module.exports = { ControlledActionRegistry, buildDefaultDefinitions };
