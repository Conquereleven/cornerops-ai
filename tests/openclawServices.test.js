process.env.NODE_ENV = 'test';

const { AuditLogService } = require('../src/integrations/openclaw/AuditLogService');
const { CornerOpsOpenClawAdapter } = require('../src/integrations/openclaw/CornerOpsOpenClawAdapter');
const { HumanApprovalService } = require('../src/integrations/openclaw/HumanApprovalService');
const { MemoryBridge } = require('../src/integrations/openclaw/MemoryBridge');
const { ToolExecutionPolicy } = require('../src/integrations/openclaw/ToolExecutionPolicy');

const message = {
  messageId: 'msg-1',
  requestId: 'request-1',
  conversationId: 'conv-1',
  userId: 'user-1',
  channel: 'whatsapp',
  channelId: 'chat-1',
  text: 'Resume órdenes pendientes',
  actionType: 'read_orders',
  businessContext: { company: 'CornerMex', workspace: 'cornerops' },
  metadata: { token: 'must-redact' },
};

describe('OpenClaw services', () => {
  test('adapter preserves CornerOps context in OpenClaw request', () => {
    const adapter = new CornerOpsOpenClawAdapter({
      auditLogService: new AuditLogService(),
      client: {},
      config: { defaultModel: 'openclaw/default', enabled: false, dryRun: true },
      humanApprovalService: new HumanApprovalService(),
      memoryBridge: new MemoryBridge(),
      toolExecutionPolicy: new ToolExecutionPolicy(),
    });

    const input = adapter.toOpenClawChatInput(message);

    expect(input.user).toBe('conv-1');
    expect(input.metadata.corneropsMessageId).toBe('msg-1');
    expect(input.metadata.channel).toBe('whatsapp');
    expect(input.metadata.session.metadata.memoryOwner).toBe('cornerops-ai');
  });

  test('dry run does not call external OpenClaw', async () => {
    const client = { chatCompletion: jest.fn() };
    const adapter = new CornerOpsOpenClawAdapter({
      auditLogService: new AuditLogService(),
      client,
      config: { defaultModel: 'openclaw/default', enabled: false, dryRun: true },
      humanApprovalService: new HumanApprovalService(),
      memoryBridge: new MemoryBridge(),
      toolExecutionPolicy: new ToolExecutionPolicy(),
    });

    const result = await adapter.handleMessage(message);

    expect(result.status).toBe('disabled');
    expect(client.chatCompletion).not.toHaveBeenCalled();
  });

  test('requires approval before sensitive actions execute', async () => {
    const approvals = new HumanApprovalService();
    approvals.clearForTests();
    const adapter = new CornerOpsOpenClawAdapter({
      auditLogService: new AuditLogService(),
      client: { chatCompletion: jest.fn() },
      config: { defaultModel: 'openclaw/default', enabled: true, dryRun: false },
      humanApprovalService: approvals,
      memoryBridge: new MemoryBridge(),
      toolExecutionPolicy: new ToolExecutionPolicy({ requireApproval: true }),
    });

    const result = await adapter.handleMessage({
      ...message,
      actionType: 'send_email',
      toolName: 'gmail.send',
    });

    expect(result.status).toBe('approval_required');
    expect(approvals.getApproval(result.approvalId).status).toBe('pending');
  });

  test('audit log sanitizes secrets', () => {
    const audit = new AuditLogService();
    audit.clearForTests();
    const record = audit.record({
      userId: 'user-1',
      channel: 'slack',
      actionType: 'read_orders',
      input: {
        nested: {
          OPENCLAW_GATEWAY_TOKEN: 'secret',
          safe: 'value',
        },
      },
    });

    expect(record.sanitizedInput.nested.OPENCLAW_GATEWAY_TOKEN)
      .toBe('[REDACTED]');
    expect(record.sanitizedInput.nested.safe).toBe('value');
  });
});
