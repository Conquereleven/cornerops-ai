const { AgentAuditService } = require('../src/core/audit/AgentAuditService');
const { AgentMemoryService } = require('../src/core/memory/AgentMemoryService');
const { AgentPermissionPolicy } = require('../src/core/policies/AgentPermissionPolicy');
const { AgentOrchestrator } = require('../src/core/agents/AgentOrchestrator');
const { AgentRegistry } = require('../src/core/agents/AgentRegistry');
const { coreAgentDefinitions } = require('../src/core/agents/definitions');
const { HumanApprovalService } = require('../src/integrations/openclaw/HumanApprovalService');

const messages = [
  'Dame mi briefing de hoy',
  'Prepara follow-up para un restaurante interesado en Tajín y Pulparindo',
  'Revisa quotes sin seguimiento',
  'Crea un issue para corregir pagos manuales',
  'Revisa eventos de seguridad recientes',
];

const orchestrator = new AgentOrchestrator({
  auditService: new AgentAuditService({ enabled: true }),
  config: {
    enabled: true,
    dryRun: true,
    defaultAgent: 'cornerops-router-agent',
    packVersion: 'v0.1',
  },
  humanApprovalService: new HumanApprovalService(),
  memoryService: new AgentMemoryService(),
  openclawAdapter: {
    handleMessage: async () => {
      throw new Error('OpenClaw should not be called in demo dry run.');
    },
  },
  openclawConfig: {
    enabled: false,
    dryRun: true,
  },
  permissionPolicy: new AgentPermissionPolicy({
    agentsEnabled: true,
    dryRun: true,
    requireApproval: true,
  }),
  registry: new AgentRegistry({ agents: coreAgentDefinitions }),
});

const run = async () => {
  console.log('CornerOps Core Agent Pack v0.1 demo (dry run)');
  console.log('No real messages, tools, issues or order changes will execute.');
  for (const [index, text] of messages.entries()) {
    const result = await orchestrator.handleMessage({
      messageId: `demo-msg-${index + 1}`,
      conversationId: 'demo-core-agent-pack',
      userId: 'demo-operator',
      channel: index === 1 ? 'telegram' : 'slack',
      text,
    });
    console.log('\n---');
    console.log(`Input: ${text}`);
    console.log(`Agent: ${result.agentId}`);
    console.log(`Status: ${result.status}`);
    if (result.approvalId) console.log(`Approval: ${result.approvalId}`);
    console.log(result.responseText);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
