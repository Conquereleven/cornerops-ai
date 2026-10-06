const sales = require('../core/sales');
const { policyRouter, requirePolicy } = require('../middleware/appAuth');

// Internal CRM records for the caller's workspace. Reads need any membership,
// writes need the operator role. There is no send, schedule or outreach route.
const router = policyRouter();
const internalWrite = requirePolicy('internal_write');

const context = (req) => ({
  workspaceId: req.workspace.id, // from server-side membership, never from the request
  userId: req.appIdentity.userId,
  correlationId: req.get('x-correlation-id') || req.get('x-request-id') || null,
});

const handle = (status, action) => async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(await action(sales.getSalesService(), context(req), req));
  } catch (error) {
    if (error.code === 'SALES_VALIDATION_FAILED') {
      return res.status(400).json({ error: true, code: error.code, message: error.message, fields: error.fields });
    }
    if (error.statusCode && error.statusCode < 500) return next(error);
    // Database detail can contain submitted values: never forward it.
    const safe = new Error(error.statusCode === 503 ? 'Sales persistence is unavailable.' : 'Sales request failed.');
    safe.statusCode = error.statusCode === 503 ? 503 : 500;
    safe.code = error.statusCode === 503 ? 'SALES_PERSISTENCE_UNAVAILABLE' : 'SALES_REQUEST_FAILED';
    return next(safe);
  }
};

router.get('/summary', handle(200, (service, ctx) => service.summary(ctx)));
router.get('/accounts', handle(200, async (service, ctx) => ({ accounts: await service.listAccounts(ctx) })));
router.post('/accounts', internalWrite, handle(201, (service, ctx, req) => service.createAccount(ctx, req.body)));
router.get('/accounts/:accountId', handle(200, (service, ctx, req) => service.getAccount(ctx, req.params.accountId)));
router.patch('/accounts/:accountId', internalWrite, handle(200, (service, ctx, req) => service.updateAccount(ctx, req.params.accountId, req.body)));
router.post('/accounts/:accountId/contacts', internalWrite, handle(201, (service, ctx, req) => service.createContact(ctx, req.params.accountId, req.body)));
router.patch('/contacts/:contactId', internalWrite, handle(200, (service, ctx, req) => service.updateContact(ctx, req.params.contactId, req.body)));
router.post('/accounts/:accountId/opportunities', internalWrite, handle(201, (service, ctx, req) => service.createOpportunity(ctx, req.params.accountId, req.body)));
router.patch('/opportunities/:opportunityId', internalWrite, handle(200, (service, ctx, req) => service.updateOpportunity(ctx, req.params.opportunityId, req.body)));
router.post('/accounts/:accountId/activities', internalWrite, handle(201, (service, ctx, req) => service.createActivity(ctx, req.params.accountId, req.body)));
// Validation only: reports what a CSV would create. Never writes.
router.post('/import/preview', internalWrite, handle(200, (_service, _ctx, req) => sales.previewCsv(req.body?.csv)));

module.exports = router;
