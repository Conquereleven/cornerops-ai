const agents = require('../../../src/core/agents');
const data = require('../../../src/core/data');
const openclaw = require('../../../src/integrations/openclaw');
const { operatorCommandRouter, operatorSessionService } = require('../../../src/core/operator');
const { OPERATOR_INTENTS } = require('../../../src/core/operator/operatorTypes');

const run = (text, metadata = {}) => operatorCommandRouter.handle({
  requestId: `operator-test-${Math.random()}`,
  operatorId: 'founder-test',
  channel: 'cli',
  text,
  metadata,
});

describe('OperatorCommandRouter v0.5', () => {
  beforeEach(() => {
    data.auditLogService.repository.clearForTests();
    agents.agentAuditService.clearForTests();
    openclaw.auditLogService.clearForTests();
    openclaw.humanApprovalService.clearForTests();
    operatorSessionService.clearForTests();
  });

  test.each([
    ["Give me today's briefing", OPERATOR_INTENTS.BRIEFING],
    ['Which B2B leads need follow-up?', OPERATOR_INTENTS.B2B_LEADS_FOLLOWUP],
    ['Prepare a follow-up draft for Tajin', OPERATOR_INTENTS.B2B_MESSAGE_DRAFT],
    ['Which quotes need follow-up?', OPERATOR_INTENTS.QUOTES_REVIEW],
    ['Which orders require action?', OPERATOR_INTENTS.ORDERS_REVIEW],
    ['Review GitHub issues for Codex', OPERATOR_INTENTS.GITHUB_ENGINEERING_SUMMARY],
    ['Show security risks', OPERATOR_INTENTS.SECURITY_AUDIT_SUMMARY],
  ])('routes %s', (text, intent) => {
    expect(operatorCommandRouter.classify(text).intent).toBe(intent);
  });

  test('runs a source-labeled audited briefing', async () => {
    const output = await run("Give me today's briefing");
    expect(output).toMatchObject({
      intent: 'briefing',
      agentId: 'daily-briefing-agent',
      status: 'dry_run',
      sourceMode: 'mock',
    });
    expect(output.auditId).toMatch(/^audit-/);
    expect(output.responseText).toContain('## Executive Briefing');
    expect(output.responseText).toContain('## Requires Approval\nNo');
    const logs = await data.auditLogService.list({ limit: 500 });
    expect(logs.some((log) => log.eventType === 'operator_request_received')).toBe(true);
    expect(logs.some((log) => log.eventType === 'operator_request_completed')).toBe(true);
  });

  test('unknown request returns clarification/help without invoking an agent', async () => {
    const spy = jest.spyOn(agents.agentOrchestrator, 'handleMessage');
    const output = await run('quantum bananas without context');
    expect(output.intent).toBe('unknown');
    expect(output.responseText).toContain('I could not classify that request');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('blocks external sends and write requests before agent execution', async () => {
    const spy = jest.spyOn(agents.agentOrchestrator, 'handleMessage');
    const send = await run('Send a real WhatsApp message now');
    const write = await run('Mark paid this order');
    const writeWithIdentifier = await run('Mark order 123 as paid');
    expect(send).toMatchObject({ status: 'denied', sourceMode: 'disabled' });
    expect(write).toMatchObject({ status: 'denied', sourceMode: 'disabled' });
    expect(writeWithIdentifier).toMatchObject({ status: 'denied', sourceMode: 'disabled' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('masks full email and phone in a generated draft', async () => {
    const output = await run('Prepare a follow-up message for maria@example.com at +971500001234');
    expect(output.responseText).not.toContain('maria@example.com');
    expect(output.responseText).not.toContain('+971500001234');
    expect(output.responseText).toContain('ma***@example.com');
  });

  test('denies disallowed OpenClaw operator channel', async () => {
    const output = await operatorCommandRouter.handle({
      operatorId: 'founder-test',
      channel: 'openclaw',
      text: 'help',
    });
    expect(output).toMatchObject({ status: 'denied', sourceMode: 'disabled' });
    expect(output.warnings).toContain('OPERATOR_CHANNEL_DENIED');
  });
});
