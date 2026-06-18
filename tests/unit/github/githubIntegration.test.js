const { createHmac } = require('crypto');
const dataCore = require('../../../src/core/data');
const { GitHubClient } = require('../../../src/integrations/github/GitHubClient');

describe('GitHub integration dry-run', () => {
  test('GitHubClient lists issues with mock data', async () => {
    const issues = await dataCore.githubIssueService.listIssues({ state: 'open' }, {
      agentId: 'dev-codex-github-agent',
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  test('GitHubClient does not create issue when dry run is active', async () => {
    const result = await dataCore.githubIssueService.createIssue({
      title: 'Bug de pagos manuales',
      body: 'Repro steps',
      requestId: 'req-test',
    });
    expect(result.status).toBe('dry_run');
    expect(result.message).toMatch(/GITHUB_DRY_RUN=true/);
  });

  test('GitHubClient asks for approval when dry run is disabled', async () => {
    const client = new GitHubClient({
      adapter: dataCore.mockDataAdapter,
      approvalService: dataCore.approvalService,
      config: { dryRun: false },
    });
    const result = await client.createIssue({
      title: 'Needs approval',
      body: 'No real issue should be created',
      requestId: 'req-approval-test',
    });
    expect(result.status).toBe('needs_approval');
    expect(result.approvalId).toBeTruthy();
  });

  test('GitHubClient maps common error statuses', () => {
    const client = new GitHubClient({ adapter: dataCore.mockDataAdapter, config: { dryRun: true } });
    expect(() => client.handleErrorStatus(401)).toThrow(/401/);
    expect(() => client.handleErrorStatus(403)).toThrow(/403/);
    expect(() => client.handleErrorStatus(404)).toThrow(/404/);
    expect(() => client.handleErrorStatus(422)).toThrow(/422/);
    expect(() => client.handleErrorStatus(500)).toThrow(/server error/);
  });

  test('GitHub webhook rejects invalid signature, accepts valid signature, and deduplicates delivery', async () => {
    const body = JSON.stringify({ action: 'opened' });
    const secret = 'test-webhook-secret';
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const client = new GitHubClient({
      adapter: dataCore.mockDataAdapter,
      config: { webhookSecret: secret, dryRun: true },
    });
    const handler = new (require('../../../src/integrations/github/GitHubWebhookHandler').GitHubWebhookHandler)({
      auditLogService: dataCore.auditLogService,
      client,
    });
    await expect(handler.handle({
      body,
      deliveryId: 'delivery-1',
      event: 'issues',
      signature: 'sha256=bad',
    })).resolves.toMatchObject({ status: 'denied' });
    await expect(handler.handle({
      body,
      deliveryId: 'delivery-1',
      event: 'issues',
      signature,
    })).resolves.toMatchObject({ status: 'accepted' });
    await expect(handler.handle({
      body,
      deliveryId: 'delivery-1',
      event: 'issues',
      signature,
    })).resolves.toMatchObject({ status: 'duplicate' });
  });
});
