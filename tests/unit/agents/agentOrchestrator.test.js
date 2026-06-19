process.env.NODE_ENV = 'test';

const { AGENT_IDS } = require('../../../src/core/agents/agentTypes');
const { createHarness } = require('./testAgentHarness');

const briefingFixture = require('../../fixtures/agents/whatsapp-briefing-request.json');
const b2bFixture = require('../../fixtures/agents/telegram-b2b-followup-request.json');
const githubFixture = require('../../fixtures/agents/slack-github-issue-request.json');
const securityFixture = require('../../fixtures/agents/slack-security-audit-request.json');
const quoteFixture = require('../../fixtures/agents/quote-status-change-request.json');
const unauthorizedFixture = require('../../fixtures/agents/unauthorized-user-request.json');

describe('AgentOrchestrator', () => {
  test('routes briefing requests to daily-briefing-agent', async () => {
    const { orchestrator, auditService } = createHarness();
    const result = await orchestrator.handleMessage(briefingFixture);

    expect(result.agentId).toBe(AGENT_IDS.DAILY_BRIEFING);
    expect(result.status).toBe('dry_run');
    expect(result.proposedActions.map((action) => action.toolName))
      .toContain('read_orders');
    expect(result.dataSnapshot.missingSources).toContain('orders');
    expect(result.responseText).toMatch(/Fuentes no disponibles:/);
    expect(auditService.list()).toHaveLength(1);
  });

  test('routes B2B lead follow-up and keeps it draft-only', async () => {
    const { orchestrator, openclawAdapter } = createHarness();
    const result = await orchestrator.handleMessage(b2bFixture);

    expect(result.agentId).toBe(AGENT_IDS.B2B_SALES);
    expect(result.status).toBe('dry_run');
    expect(result.proposedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: 'draft_message',
          mutates: true,
          requiresApproval: false,
        }),
      ]),
    );
    expect(openclawAdapter.handleMessage).not.toHaveBeenCalled();
  });

  test('routes quote/order payment changes to approval', async () => {
    const { orchestrator, humanApprovalService } = createHarness();
    const result = await orchestrator.handleMessage(quoteFixture);

    expect(result.agentId).toBe(AGENT_IDS.QUOTES_ORDERS);
    expect(result.status).toBe('needs_approval');
    expect(result.approvalId).toMatch(/^approval-/);
    expect(humanApprovalService.getApproval(result.approvalId).status)
      .toBe('pending');
  });

  test('routes GitHub issue creation to approval', async () => {
    const { orchestrator } = createHarness();
    const result = await orchestrator.handleMessage(githubFixture);

    expect(result.agentId).toBe(AGENT_IDS.DEV_CODEX_GITHUB);
    expect(result.status).toBe('needs_approval');
    expect(result.proposedActions.map((action) => action.toolName))
      .toContain('create_issue_pending_approval');
  });

  test('routes security audit requests and keeps them read-only', async () => {
    const { orchestrator } = createHarness();
    const result = await orchestrator.handleMessage(securityFixture);

    expect(result.agentId).toBe(AGENT_IDS.SECURITY_AUDIT);
    expect(result.status).toBe('dry_run');
    expect(result.proposedActions.every((action) => !action.mutates)).toBe(true);
  });

  test('denies unauthorized users when allowlist is configured', async () => {
    const { orchestrator } = createHarness({ allowedUsers: ['ALLOWED'] });
    const result = await orchestrator.handleMessage(unauthorizedFixture);

    expect(result.status).toBe('denied');
    expect(result.errorCode).toBe('AGENT_POLICY_DENIED');
  });

  test('falls back locally when OpenClaw is off even if CornerOps dry run is false', async () => {
    const { orchestrator, openclawAdapter } = createHarness({
      dryRun: false,
      openclawEnabled: false,
      openclawDryRun: true,
    });
    const result = await orchestrator.handleMessage(briefingFixture);

    expect(result.status).toBe('dry_run');
    expect(openclawAdapter.handleMessage).not.toHaveBeenCalled();
  });
});
