const express = require('express');
const controller = require('../controllers/actionsController');
const { createWebConsoleGuard } = require('../middleware/webConsoleGuard');

const router = express.Router();
router.use(createWebConsoleGuard());
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/github/issues/draft', controller.githubIssueDraft);
router.post('/github/issues/request-approval', controller.githubIssueRequestApproval);
router.post('/internal-notes/request-approval', controller.internalNoteRequestApproval);
router.post('/internal-tasks/request-approval', controller.internalTaskRequestApproval);
router.post('/approvals/:id/execute-dry-run', controller.executeDryRun);
router.post('/approvals/:id/execute', controller.executeReal);

module.exports = router;
