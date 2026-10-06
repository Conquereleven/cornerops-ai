const controller = require('../controllers/actionsController');
const { createWebConsoleGuard } = require('../middleware/webConsoleGuard');
const { policyRouter, requirePolicy } = require('../middleware/appAuth');

const router = policyRouter();
const internalWrite = requirePolicy('internal_write');
const sensitiveConfig = requirePolicy('sensitive_config');
const externalAction = requirePolicy('external_action');
const consoleGuard = createWebConsoleGuard();
router.use(consoleGuard);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/github/issues/draft', internalWrite, controller.githubIssueDraft);
router.post('/github/issues/request-approval', internalWrite, controller.githubIssueRequestApproval);
router.post('/internal-notes/request-approval', internalWrite, controller.internalNoteRequestApproval);
router.post('/internal-tasks/request-approval', internalWrite, controller.internalTaskRequestApproval);
router.post('/approvals/:id/execute-dry-run', sensitiveConfig, controller.executeDryRun);
router.post('/approvals/:id/execute', externalAction, controller.executeReal);

module.exports = router;
