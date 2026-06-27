const env = require('../../config/env');
const openclaw = require('../../integrations/openclaw');
const data = require('../data');
const { persistenceProviderRegistry } = require('../persistence');
const { GitHubIssueActionService } = require('../../integrations/github/GitHubIssueActionService');
const { InternalNoteRepository } = require('../domain/internal-notes/InternalNoteRepository');
const { InternalNoteService } = require('../domain/internal-notes/InternalNoteService');
const { InternalTaskRepository } = require('../domain/internal-tasks/InternalTaskRepository');
const { InternalTaskService } = require('../domain/internal-tasks/InternalTaskService');
const { ActionIdempotencyService } = require('./ActionIdempotencyService');
const { ControlledActionExecutor } = require('./ControlledActionExecutor');
const { ControlledActionPolicy } = require('./ControlledActionPolicy');
const { ControlledActionRegistry } = require('./ControlledActionRegistry');
const { CreateGitHubIssueActionHandler } = require('./handlers/CreateGitHubIssueActionHandler');
const { CreateInternalNoteActionHandler } = require('./handlers/CreateInternalNoteActionHandler');
const { CreateInternalTaskActionHandler } = require('./handlers/CreateInternalTaskActionHandler');
const { CONTROLLED_ACTION_IDS } = require('./actionTypes');

const controlledActionRegistry = new ControlledActionRegistry({ config: env });
const controlledActionPolicy = new ControlledActionPolicy({
  config: env,
  dataAccessPolicy: data.dataAccessPolicy,
});
const actionIdempotencyService = new ActionIdempotencyService({
  store: persistenceProviderRegistry.createStore('controlled-action-idempotency', {
    critical: true,
    initialData: { version: 1, records: [] },
  }),
});
const internalNoteRepository = new InternalNoteRepository({
  store: persistenceProviderRegistry.createStore('internal-notes', {
    critical: true,
    initialData: { version: 1, records: [] },
  }),
});
const internalTaskRepository = new InternalTaskRepository({
  store: persistenceProviderRegistry.createStore('internal-tasks', {
    critical: true,
    initialData: { version: 1, records: [] },
  }),
});
const internalNoteService = new InternalNoteService({ repository: internalNoteRepository });
const internalTaskService = new InternalTaskService({ repository: internalTaskRepository });
const githubIssueActionService = new GitHubIssueActionService({ config: env });
const handlers = new Map([
  [CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, new CreateGitHubIssueActionHandler({ service: githubIssueActionService })],
  [CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE, new CreateInternalNoteActionHandler({ service: internalNoteService })],
  [CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE, new CreateInternalTaskActionHandler({ service: internalTaskService })],
]);
const controlledActionExecutor = new ControlledActionExecutor({
  approvalService: data.approvalService,
  auditLogService: openclaw.auditLogService,
  config: env,
  handlers,
  idempotencyService: actionIdempotencyService,
  policy: controlledActionPolicy,
  registry: controlledActionRegistry,
});

module.exports = {
  ActionIdempotencyService,
  ControlledActionExecutor,
  ControlledActionPolicy,
  ControlledActionRegistry,
  actionIdempotencyService,
  controlledActionExecutor,
  controlledActionPolicy,
  controlledActionRegistry,
  githubIssueActionService,
  handlers,
  internalNoteRepository,
  internalNoteService,
  internalTaskRepository,
  internalTaskService,
};
