const unknownSender = require('../../fixtures/operator-channel/unknown-sender.json');
const { OperatorChatResponseFormatter } = require('../../../src/core/operator/OperatorChatResponseFormatter');
const { MockOperatorChannelAdapter } = require('../../../src/core/operator-channel/adapters/MockOperatorChannelAdapter');
const { OperatorChannelMessageNormalizer } = require('../../../src/core/operator-channel/OperatorChannelMessageNormalizer');
const { OperatorChannelPolicy } = require('../../../src/core/operator-channel/OperatorChannelPolicy');
const { OperatorChannelRegistry } = require('../../../src/core/operator-channel/OperatorChannelRegistry');
const { OperatorChannelResponseService } = require('../../../src/core/operator-channel/OperatorChannelResponseService');
const { OperatorChannelService } = require('../../../src/core/operator-channel/OperatorChannelService');
const { OperatorChannelStatusStore } = require('../../../src/core/operator-channel/OperatorChannelStatusStore');

const safeConfig = {
  enabled: true,
  provider: 'mock',
  mode: 'read_only',
  dryRun: true,
  requireApproval: true,
  allowedUserIds: ['founder'],
  allowedChannelIds: [],
  allowedChatIds: ['founder-chat'],
  replyEnabled: true,
  replyDryRun: true,
  rejectUnknownSenders: true,
  requireAllowlist: true,
  maxMessageChars: 12000,
  piiMasking: true,
  logSanitization: true,
  failClosed: true,
  requireAudit: true,
  requireApprovalForExternalActions: true,
  requireApprovalForWrites: true,
};

const createHarness = (overrides = {}) => {
  const events = [];
  const auditLogService = {
    record: jest.fn(async (event) => {
      const audit = { id: `audit-${events.length + 1}`, ...event };
      events.push(audit);
      return audit;
    }),
  };
  const adapter = overrides.adapter || new MockOperatorChannelAdapter({ dryRun: true });
  const registry = new OperatorChannelRegistry([adapter]);
  const statusStore = new OperatorChannelStatusStore();
  const router = overrides.router || {
    route: jest.fn(async () => ({
      status: 'success',
      responseText: '## Answer\nBriefing ready for maria@example.com and +971500001234.',
      sourceMode: 'mock',
      approvals: { required: false },
      auditId: 'audit-router',
      warnings: [],
    })),
  };
  const service = new OperatorChannelService({
    auditLogService,
    chatFormatter: new OperatorChatResponseFormatter({ maxMessageChars: 12000 }),
    config: { ...safeConfig, ...(overrides.config || {}) },
    normalizer: new OperatorChannelMessageNormalizer(),
    policy: new OperatorChannelPolicy({ ...safeConfig, ...(overrides.config || {}) }),
    responseService: new OperatorChannelResponseService({ registry, statusStore }),
    router,
    statusStore,
  });
  adapter.connect(service);
  return { adapter, auditLogService, events, router, service, statusStore };
};

describe('OperatorChannelService v0.6', () => {
  test('routes an approved message, masks PII and audits inbound/outbound', async () => {
    const harness = createHarness();
    const result = await harness.adapter.simulateInbound({
      id: 'message-1',
      userId: 'founder',
      chatId: 'founder-chat',
      channelId: 'founder-chat',
      text: 'daily briefing',
    });
    expect(result).toMatchObject({ status: 'dry_run', chatId: 'founder-chat', userId: 'founder' });
    expect(result.text).toContain('Source: mock');
    expect(result.text).toContain('Approval: not required');
    expect(result.text).toContain('Audit: audit-router');
    expect(result.text).not.toContain('maria@example.com');
    expect(result.text).not.toContain('+971500001234');
    expect(harness.events.map((event) => event.eventType)).toEqual([
      'operator_channel_inbound',
      'operator_channel_outbound',
    ]);
    expect(harness.adapter.replies[0]).toMatchObject({ chatId: 'founder-chat', userId: 'founder' });
  });

  test('rejects unknown sender without invoking OperatorCommandRouter', async () => {
    const harness = createHarness();
    const result = await harness.adapter.simulateInbound(unknownSender);
    expect(result.status).toBe('blocked');
    expect(result.warnings).toContain('OPERATOR_CHANNEL_UNKNOWN_SENDER');
    expect(harness.router.route).not.toHaveBeenCalled();
    expect(harness.adapter.replies).toHaveLength(0);
    expect(harness.statusStore.getStatus(safeConfig).rejectedLast24h).toBe(1);
  });

  test('blocks write requests before routing but returns a safe dry-run explanation', async () => {
    const harness = createHarness();
    const result = await harness.adapter.simulateInbound({
      id: 'message-write',
      userId: 'founder',
      chatId: 'founder-chat',
      text: 'Mark this order as paid',
    });
    expect(result.status).toBe('blocked');
    expect(result.text).toContain('Approval: required');
    expect(result.warnings).toContain('OPERATOR_CHANNEL_WRITE_BLOCKED');
    expect(harness.router.route).not.toHaveBeenCalled();
  });

  test('audits invalid provider metadata without routing', async () => {
    const harness = createHarness();
    const result = await harness.service.handleInbound({ provider: 'discord', text: 'help' });
    expect(result).toMatchObject({ status: 'blocked', auditId: 'audit-1' });
    expect(harness.events[0]).toMatchObject({ eventType: 'operator_channel_inbound', status: 'denied' });
  });
});
