const { AgentAuditService } = require('../../../src/core/audit/AgentAuditService');
const { AgentMemoryService } = require('../../../src/core/memory/AgentMemoryService');
const { AgentPermissionPolicy } = require('../../../src/core/policies/AgentPermissionPolicy');
const { AgentOrchestrator } = require('../../../src/core/agents/AgentOrchestrator');
const { AgentRegistry } = require('../../../src/core/agents/AgentRegistry');
const { coreAgentDefinitions } = require('../../../src/core/agents/definitions');
const { HumanApprovalService } = require('../../../src/integrations/openclaw/HumanApprovalService');

const createHarness = ({
  allowedUsers = [],
  agentsEnabled = true,
  dryRun = true,
  openclawEnabled = false,
  openclawDryRun = true,
  requireApproval = true,
} = {}) => {
  const auditService = new AgentAuditService({ enabled: true });
  const memoryService = new AgentMemoryService();
  const humanApprovalService = new HumanApprovalService();
  humanApprovalService.clearForTests();
  const openclawAdapter = {
    handleMessage: jest.fn(async () => ({
      reply: 'OpenClaw mock response.',
      status: 'success',
    })),
  };
  const orchestrator = new AgentOrchestrator({
    auditService,
    config: {
      enabled: agentsEnabled,
      dryRun,
      defaultAgent: 'cornerops-router-agent',
      packVersion: 'v0.1',
    },
    humanApprovalService,
    memoryService,
    openclawAdapter,
    openclawConfig: {
      enabled: openclawEnabled,
      dryRun: openclawDryRun,
    },
    permissionPolicy: new AgentPermissionPolicy({
      agentsEnabled,
      allowedUsers,
      dryRun,
      requireApproval,
    }),
    registry: new AgentRegistry({
      agents: coreAgentDefinitions,
      agentsEnabled,
    }),
  });
  return {
    auditService,
    humanApprovalService,
    memoryService,
    openclawAdapter,
    orchestrator,
  };
};

module.exports = {
  createHarness,
};
