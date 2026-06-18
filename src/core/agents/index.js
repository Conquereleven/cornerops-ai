const env = require('../../config/env');
const { AgentAuditService } = require('../audit/AgentAuditService');
const { AgentMemoryService } = require('../memory/AgentMemoryService');
const { AgentPermissionPolicy } = require('../policies/AgentPermissionPolicy');
const { WorkflowRegistry } = require('../workflows/WorkflowRegistry');
const { AgentOrchestrator } = require('./AgentOrchestrator');
const { AgentRegistry } = require('./AgentRegistry');
const { coreAgentDefinitions } = require('./definitions');
const dataCore = require('../data');
const { createAgentTools } = require('./tools');
const openclaw = require('../../integrations/openclaw');

const agentRegistry = new AgentRegistry({
  agents: coreAgentDefinitions,
  agentsEnabled: env.corneropsAgentsEnabled,
  enabledAgentIds: env.corneropsAgentEnabledIds,
  disabledAgentIds: env.corneropsAgentDisabledIds,
});

const agentAuditService = new AgentAuditService({
  enabled: env.corneropsAuditEnabled,
});

const agentMemoryService = new AgentMemoryService();

const agentPermissionPolicy = new AgentPermissionPolicy({
  agentsEnabled: env.corneropsAgentsEnabled,
  allowedUsers: env.corneropsAgentAllowedUsers,
  dryRun: env.corneropsDryRun,
  requireApproval: env.corneropsRequireApproval,
});

const workflowRegistry = new WorkflowRegistry();
const agentTools = createAgentTools(dataCore);

const agentOrchestrator = new AgentOrchestrator({
  auditService: agentAuditService,
  config: {
    enabled: env.corneropsAgentsEnabled,
    dryRun: env.corneropsDryRun,
    defaultAgent: env.corneropsDefaultAgent,
    packVersion: env.corneropsAgentPackVersion,
  },
  humanApprovalService: openclaw.humanApprovalService,
  memoryService: agentMemoryService,
  openclawAdapter: openclaw.adapter,
  openclawConfig: openclaw.config,
  permissionPolicy: agentPermissionPolicy,
  registry: agentRegistry,
  tools: agentTools,
});

module.exports = {
  AgentAuditService,
  AgentMemoryService,
  AgentOrchestrator,
  AgentPermissionPolicy,
  AgentRegistry,
  agentAuditService,
  agentMemoryService,
  agentOrchestrator,
  agentPermissionPolicy,
  agentRegistry,
  agentTools,
  coreAgentDefinitions,
  dataCore,
  workflowRegistry,
};
