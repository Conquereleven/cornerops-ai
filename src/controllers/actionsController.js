const {
  controlledActionExecutor,
  controlledActionRegistry,
} = require('../core/actions');
const { CONTROLLED_ACTION_IDS } = require('../core/actions/actionTypes');

const contextFor = (req, agentId) => ({
  agentId: req.body?.sourceAgentId || agentId,
  channel: req.body?.channel || 'web',
  conversationId: req.body?.conversationId,
  operatorId: req.get('x-operator-id') || req.body?.operatorId || 'web-console-operator',
  requestId: req.get('x-request-id') || req.body?.sourceRequestId,
  requestedDryRun: req.body?.dryRun !== false,
});

const list = (_req, res) => res.json(controlledActionExecutor.status());

const get = (req, res) => {
  const action = controlledActionRegistry.get(req.params.id);
  if (!action) return res.status(404).json({ error: true, message: 'Controlled action not found.' });
  return res.json(action);
};

const draft = (actionId, agentId) => async (req, res, next) => {
  try {
    return res.json(await controlledActionExecutor.createDraft(actionId, req.body, contextFor(req, agentId)));
  } catch (error) {
    return next(error);
  }
};

const requestApproval = (actionId, agentId) => async (req, res, next) => {
  try {
    return res.status(202).json(await controlledActionExecutor.requestApproval(
      actionId,
      req.body,
      contextFor(req, agentId),
    ));
  } catch (error) {
    return next(error);
  }
};

const execute = (dryRun) => async (req, res, next) => {
  try {
    return res.json(await controlledActionExecutor.executeApproval(req.params.id, {
      dryRun,
      operatorId: req.get('x-operator-id') || 'web-console-operator',
      requestId: req.get('x-request-id'),
    }));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  executeDryRun: execute(true),
  executeReal: execute(false),
  get,
  githubIssueDraft: draft(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, 'dev-codex-github-agent'),
  githubIssueRequestApproval: requestApproval(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, 'dev-codex-github-agent'),
  internalNoteRequestApproval: requestApproval(CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE, 'b2b-sales-agent'),
  internalTaskRequestApproval: requestApproval(CONTROLLED_ACTION_IDS.INTERNAL_TASK_CREATE, 'daily-briefing-agent'),
  list,
};
