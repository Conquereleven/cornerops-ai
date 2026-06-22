const { randomUUID } = require('crypto');
const data = require('../core/data');
const {
  operatorCommandRouter,
  operatorSessionService,
} = require('../core/operator');

const requestId = (req) => req.body?.requestId
  || req.get('x-request-id')
  || `operator-api-${randomUUID().slice(0, 12)}`;

const operatorId = (req) => req.body?.operatorId || req.get('x-operator-id') || 'local-api-operator';

const run = (textFactory) => async (req, res, next) => {
  try {
    const output = await operatorCommandRouter.handle({
      requestId: requestId(req),
      operatorId: operatorId(req),
      channel: 'api',
      text: textFactory(req),
      sessionId: req.body?.sessionId || req.query.sessionId,
      metadata: req.body?.metadata,
    });
    return res.status(output.status === 'denied' ? 403 : 200).json(output);
  } catch (error) {
    return next(error);
  }
};

const ask = run((req) => req.body?.text || '');
const help = run(() => 'help');
const status = run(() => 'Show system health');
const approvals = run(() => 'Show pending approvals');
const auditSummary = run((req) => req.query.filter === 'denied'
  ? 'Show denied audit actions'
  : req.query.filter === 'errors' ? 'Show audit errors' : 'Show audit summary');

const session = async (req, res, next) => {
  try {
    const item = operatorSessionService.get(req.params.id);
    const audit = await data.auditLogService.record({
      requestId: requestId(req),
      correlationId: req.params.id,
      eventType: 'operator_session_read',
      dataSource: 'operator_interface',
      operation: 'get_session',
      userId: operatorId(req),
      channel: 'api',
      policyDecision: item ? 'allowed' : 'denied',
      status: item ? 'success' : 'denied',
      input: { sessionId: req.params.id },
    });
    if (!item) return res.status(404).json({ error: true, message: 'Operator session not found.', auditId: audit?.id });
    return res.json({ session: item, auditId: audit?.id });
  } catch (error) {
    return next(error);
  }
};

module.exports = { approvals, ask, auditSummary, help, session, status };
