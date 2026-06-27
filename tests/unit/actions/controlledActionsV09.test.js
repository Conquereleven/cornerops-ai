const { ApprovalService } = require('../../../src/core/domain/approvals/ApprovalService');
const { InternalNoteRepository } = require('../../../src/core/domain/internal-notes/InternalNoteRepository');
const { InternalNoteService } = require('../../../src/core/domain/internal-notes/InternalNoteService');
const { InternalTaskRepository } = require('../../../src/core/domain/internal-tasks/InternalTaskRepository');
const { InternalTaskService } = require('../../../src/core/domain/internal-tasks/InternalTaskService');
const { InMemoryStore } = require('../../../src/core/persistence/InMemoryStore');
const { DataAccessPolicy } = require('../../../src/core/data/DataAccessPolicy');
const { ActionIdempotencyService } = require('../../../src/core/actions/ActionIdempotencyService');
const { ControlledActionExecutor } = require('../../../src/core/actions/ControlledActionExecutor');
const { ControlledActionPolicy } = require('../../../src/core/actions/ControlledActionPolicy');
const { ControlledActionRegistry } = require('../../../src/core/actions/ControlledActionRegistry');
const { CONTROLLED_ACTION_IDS } = require('../../../src/core/actions/actionTypes');
const { CreateGitHubIssueActionHandler } = require('../../../src/core/actions/handlers/CreateGitHubIssueActionHandler');
const { CreateInternalNoteActionHandler } = require('../../../src/core/actions/handlers/CreateInternalNoteActionHandler');
const { CreateInternalTaskActionHandler } = require('../../../src/core/actions/handlers/CreateInternalTaskActionHandler');
const { GitHubIssueActionService } = require('../../../src/integrations/github/GitHubIssueActionService');
const { AuditLogService } = require('../../../src/integrations/openclaw/AuditLogService');
const { HumanApprovalService } = require('../../../src/integrations/openclaw/HumanApprovalService');

const configFor = (overrides = {}) => ({
  corneropsAuditEnabled: true,
  corneropsControlledActionsEnabled: true,
  corneropsControlledActionsDryRun: true,
  corneropsControlledActionsRequireApproval: true,
  corneropsControlledActionsFailClosed: true,
  corneropsActionGithubIssueCreateEnabled: true,
  corneropsActionGithubIssueCreateDryRun: true,
  corneropsActionGithubIssueCreateRequireApproval: true,
  corneropsActionInternalNoteCreateEnabled: true,
  corneropsActionInternalNoteCreateDryRun: true,
  corneropsActionInternalTaskCreateEnabled: true,
  corneropsActionInternalTaskCreateDryRun: true,
  corneropsAllowLocalInternalWrites: false,
  githubEnabled: false,
  githubReadOnly: true,
  githubDryRun: true,
  githubAllowIssueCreation: false,
  githubAllowedIssueLabels: [],
  ...overrides,
});

const createHarness = (overrides = {}) => {
  const config = configFor(overrides);
  const auditLogService = new AuditLogService({
    enabled: true,
    store: new InMemoryStore({ initialData: { version: 1, records: [] } }),
  });
  const humanApprovalService = new HumanApprovalService({
    auditLogService,
    store: new InMemoryStore({ initialData: { version: 1, records: [] } }),
  });
  const approvalService = new ApprovalService({ humanApprovalService });
  const registry = new ControlledActionRegistry({ config });
  const policy = new ControlledActionPolicy({
    config,
    dataAccessPolicy: new DataAccessPolicy({ auditEnabled: true, dryRun: true, requireAudit: true }),
  });
  const idempotencyService = new ActionIdempotencyService({
    store: new InMemoryStore({ initialData: { version: 1, records: [] } }),
  });
  const noteRepository = new InternalNoteRepository();
  const taskRepository = new InternalTaskRepository();
  const githubService = new GitHubIssueActionService({ config, fetchImpl: overrides.fetchImpl });
  const handlers = new Map([
    [CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, new CreateGitHubIssueActionHandler({ service: githubService })],
    [CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE, new CreateInternalNoteActionHandler({ service: new InternalNoteService({ repository: noteRepository }) })],
    [CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE, new CreateInternalTaskActionHandler({ service: new InternalTaskService({ repository: taskRepository }) })],
  ]);
  return {
    approvalService,
    auditLogService,
    config,
    executor: new ControlledActionExecutor({
      approvalService,
      auditLogService,
      config,
      handlers,
      idempotencyService,
      policy,
      registry,
    }),
    idempotencyService,
    noteRepository,
    registry,
    taskRepository,
  };
};

const context = (agentId = 'dev-codex-github-agent') => ({
  agentId,
  channel: 'internal',
  operatorId: 'founder',
  requestId: 'request-v09-1',
});

describe('Controlled Actions v0.9', () => {
  test('registry exposes exactly the three allowlisted actions and rejects unknown actions', () => {
    const { registry } = createHarness();
    expect(registry.list().map((action) => action.id)).toEqual(Object.values(CONTROLLED_ACTION_IDS));
    expect(() => registry.require('orders.mark_paid')).toThrow(expect.objectContaining({ code: 'CONTROLLED_ACTION_UNKNOWN' }));
  });

  test('disabled actions and production-impact definitions fail closed', () => {
    const disabled = new ControlledActionRegistry({ config: configFor({ corneropsControlledActionsEnabled: false }) });
    expect(disabled.get(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE).enabled).toBe(false);
    const { config } = createHarness();
    const policy = new ControlledActionPolicy({ config, dataAccessPolicy: new DataAccessPolicy() });
    expect(policy.evaluate({
      action: { ...disabled.get(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE), enabled: true, productionDataImpact: true },
      agentId: 'dev-codex-github-agent', channel: 'internal', operatorId: 'founder', auditAvailable: true,
    })).toMatchObject({ allowed: false, code: 'CONTROLLED_ACTION_PRODUCTION_DATA_DENIED' });
  });

  test('GitHub draft and approval execute only in dry-run by default', async () => {
    const harness = createHarness();
    const payload = { title: 'Manual payment audit id', body: 'Show the audit id in the internal order view.' };
    const draft = await harness.executor.createDraft(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context());
    expect(draft).toMatchObject({ status: 'draft', dryRun: true });
    const requested = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context());
    await harness.approvalService.approveApproval(requested.approvalId, 'founder');
    const result = await harness.executor.executeApproval(requested.approvalId, { dryRun: true, operatorId: 'founder' });
    expect(result).toMatchObject({ status: 'dry_run_executed', dryRun: true });
    const duplicate = await harness.executor.executeApproval(requested.approvalId, { dryRun: true, operatorId: 'founder' });
    expect(duplicate).toMatchObject({ status: 'dry_run_executed', duplicate: true });
    expect(harness.auditLogService.list().some((event) => event.actionType === 'controlled_action_execution_completed')).toBe(true);
  });

  test('checksum mismatch is denied before execution', async () => {
    const harness = createHarness();
    const approval = await harness.approvalService.requestApproval({
      actionType: CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE,
      actionPayload: { title: 'A', body: 'B' },
      payloadChecksum: 'incorrect',
      requestedDryRun: true,
      createdBy: 'dev-codex-github-agent',
      channel: 'internal',
    });
    await harness.approvalService.approveApproval(approval.id, 'founder');
    await expect(harness.executor.executeApproval(approval.id, { dryRun: true, operatorId: 'founder' }))
      .rejects.toMatchObject({ code: 'CONTROLLED_ACTION_CHECKSUM_MISMATCH' });
  });

  test('idempotency key is stable and duplicate reservations are rejected', () => {
    const { idempotencyService } = createHarness();
    const input = { actionId: 'github.issue.create', payload: { title: ' Same ', body: 'Body' }, approvalId: 'a', operatorId: 'o', sourceRequestId: 'r' };
    expect(idempotencyService.generateKey(input)).toBe(idempotencyService.generateKey({ ...input, payload: { title: 'same', body: ' body ' } }));
    expect(idempotencyService.begin(input).duplicate).toBe(false);
    expect(idempotencyService.begin(input).duplicate).toBe(true);
  });

  test('real external execution fails closed when idempotency storage is unavailable', () => {
    const service = new ActionIdempotencyService({
      store: { transact: () => { throw new Error('store down'); } },
    });
    expect(() => service.begin({ actionId: 'github.issue.create' }, { failClosed: true }))
      .toThrow(expect.objectContaining({ code: 'CONTROLLED_ACTION_IDEMPOTENCY_UNAVAILABLE' }));
  });

  test('local notes and tasks write only to their local repositories when explicitly enabled', async () => {
    const harness = createHarness({
      corneropsControlledActionsDryRun: false,
      corneropsActionInternalNoteCreateDryRun: false,
      corneropsActionInternalTaskCreateDryRun: false,
      corneropsAllowLocalInternalWrites: true,
    });
    const note = await harness.executor.requestApproval(
      CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE,
      { title: 'Quote follow-up', body: 'Review the local quote follow-up.', relatedEntityType: 'quote' },
      { ...context('b2b-sales-agent'), requestedDryRun: false },
    );
    await harness.approvalService.approveApproval(note.approvalId, 'founder');
    const noteResult = await harness.executor.executeApproval(note.approvalId, { dryRun: false, operatorId: 'founder' });
    expect(noteResult.resource).toMatchObject({ sourceMode: 'local_internal', createdBy: 'founder' });
    expect(harness.noteRepository.list()).toHaveLength(1);

    const task = await harness.executor.requestApproval(
      CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE,
      { title: 'Review stale leads', description: 'Use read-only lead data.', priority: 'high' },
      { ...context('daily-briefing-agent'), requestId: 'request-v09-2', requestedDryRun: false },
    );
    await harness.approvalService.approveApproval(task.approvalId, 'founder');
    const taskResult = await harness.executor.executeApproval(task.approvalId, { dryRun: false, operatorId: 'founder' });
    expect(taskResult.resource).toMatchObject({ sourceMode: 'local_internal', status: 'open' });
    expect(harness.taskRepository.list()).toHaveLength(1);
  });

  test('secret-bearing GitHub payloads are rejected and missing credentials degrade safely', async () => {
    const harness = createHarness();
    await expect(harness.executor.createDraft(
      CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE,
      { title: 'Bad payload', body: `Authorization: Bearer ${['gh', 'p_'].join('')}abcdefghijklmnopqrstuvwxyz123456` },
      context(),
    )).rejects.toMatchObject({ code: 'CONTROLLED_ACTION_SECRET_DETECTED' });
    const service = new GitHubIssueActionService({ config: configFor({
      githubEnabled: true,
      corneropsControlledActionsDryRun: false,
      githubReadOnly: false,
      githubDryRun: false,
      githubAllowIssueCreation: true,
      corneropsActionGithubIssueCreateDryRun: false,
    }) });
    await expect(service.execute({ title: 'Safe', body: 'Safe body' }))
      .rejects.toMatchObject({ code: 'GITHUB_ISSUE_CONFIGURATION_MISSING' });
  });

  test('GitHub issue service performs the sole allowlisted external POST only with every flag', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 42, number: 7, html_url: 'https://github.test/issues/7' }),
    }));
    const config = configFor({
      githubEnabled: true,
      corneropsControlledActionsDryRun: false,
      githubReadOnly: false,
      githubDryRun: false,
      githubAllowIssueCreation: true,
      githubToken: 'test-token-not-real',
      githubOwner: 'Conquereleven',
      githubRepo: 'cornerops-ai',
      githubApiVersion: '2022-11-28',
      corneropsActionGithubIssueCreateDryRun: false,
    });
    const result = await new GitHubIssueActionService({ config, fetchImpl }).execute({
      title: 'Safe issue', body: 'Validated body.',
    });
    expect(result).toMatchObject({ status: 'executed', externalResourceId: '42' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    await expect(new GitHubIssueActionService({ config: { ...config, githubReadOnly: true }, fetchImpl }).execute({
      title: 'Blocked', body: 'Read-only mode.',
    })).rejects.toMatchObject({ code: 'GITHUB_ISSUE_REAL_EXECUTION_BLOCKED' });
  });
});
