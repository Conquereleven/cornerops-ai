const { ApprovalService } = require('../src/core/domain/approvals/ApprovalService');
const { InternalNoteRepository } = require('../src/core/domain/internal-notes/InternalNoteRepository');
const { InternalNoteService } = require('../src/core/domain/internal-notes/InternalNoteService');
const { InternalTaskRepository } = require('../src/core/domain/internal-tasks/InternalTaskRepository');
const { InternalTaskService } = require('../src/core/domain/internal-tasks/InternalTaskService');
const { InMemoryStore } = require('../src/core/persistence/InMemoryStore');
const { DataAccessPolicy } = require('../src/core/data/DataAccessPolicy');
const { ActionIdempotencyService } = require('../src/core/actions/ActionIdempotencyService');
const { ControlledActionExecutor } = require('../src/core/actions/ControlledActionExecutor');
const { ControlledActionPolicy } = require('../src/core/actions/ControlledActionPolicy');
const { ControlledActionRegistry } = require('../src/core/actions/ControlledActionRegistry');
const { CreateGitHubIssueActionHandler } = require('../src/core/actions/handlers/CreateGitHubIssueActionHandler');
const { CreateInternalNoteActionHandler } = require('../src/core/actions/handlers/CreateInternalNoteActionHandler');
const { CreateInternalTaskActionHandler } = require('../src/core/actions/handlers/CreateInternalTaskActionHandler');
const { CONTROLLED_ACTION_IDS } = require('../src/core/actions/actionTypes');
const { GitHubIssueActionService } = require('../src/integrations/github/GitHubIssueActionService');
const { AuditLogService } = require('../src/integrations/openclaw/AuditLogService');
const { HumanApprovalService } = require('../src/integrations/openclaw/HumanApprovalService');

const demoConfig = (overrides = {}) => ({
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

const createDemoHarness = (overrides = {}) => {
  const config = demoConfig(overrides);
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
  const idempotencyService = new ActionIdempotencyService();
  const noteRepository = new InternalNoteRepository();
  const taskRepository = new InternalTaskRepository();
  const handlers = new Map([
    [CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, new CreateGitHubIssueActionHandler({ service: new GitHubIssueActionService({ config }) })],
    [CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE, new CreateInternalNoteActionHandler({ service: new InternalNoteService({ repository: noteRepository }) })],
    [CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE, new CreateInternalTaskActionHandler({ service: new InternalTaskService({ repository: taskRepository }) })],
  ]);
  const executor = new ControlledActionExecutor({
    approvalService,
    auditLogService,
    config,
    handlers,
    idempotencyService,
    policy: new ControlledActionPolicy({
      config,
      dataAccessPolicy: new DataAccessPolicy({ auditEnabled: true, dryRun: true, requireAudit: true }),
    }),
    registry,
  });
  return { approvalService, auditLogService, config, executor, noteRepository, registry, taskRepository };
};

const context = (agentId, requestId) => ({
  agentId,
  channel: 'internal',
  operatorId: 'founder-demo',
  requestId,
});

module.exports = { CONTROLLED_ACTION_IDS, context, createDemoHarness, demoConfig };
