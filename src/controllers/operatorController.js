const { randomUUID } = require('crypto');
const data = require('../core/data');
const {
  operatorCommandRouter,
  operatorSessionService,
} = require('../core/operator');
const env = require('../config/env');
const { OPERATOR_INTENTS } = require('../core/operator/operatorTypes');
const { sanitizeValue } = require('../core/security/SecuritySanitizer');

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
const askV08 = async (req, res, next) => {
  const id = requestId(req);
  const text = String(req.body?.text || '').trim();
  const auditDenied = async (message, code, statusCode = 403) => {
    const audit = await data.auditLogService.record({
      requestId: id,
      eventType: 'operator_web_request_denied',
      operation: 'ask',
      userId: operatorId(req),
      channel: 'web',
      policyDecision: 'denied',
      status: 'denied',
      input: { textLength: text.length },
      errorCode: code,
    });
    return res.status(statusCode).json({
      status: 'denied',
      responseText: message,
      sourceMode: 'disabled',
      approvals: { required: false },
      auditId: audit?.id,
      warnings: [code],
    });
  };
  try {
    if (!env.corneropsOperatorWebAskEnabled) {
      return auditDenied('Operator web ask is disabled.', 'WEB_ASK_DISABLED', 404);
    }
    if (!env.corneropsOperatorWebAskDryRun || !env.corneropsWebConsoleReadOnly) {
      return auditDenied('Operator web ask safety configuration is invalid.', 'WEB_ASK_UNSAFE', 503);
    }
    if (!text) return auditDenied('Enter a supported operator request.', 'WEB_ASK_EMPTY', 400);
    if (text.length > env.corneropsOperatorWebAskMaxChars) {
      return auditDenied('Operator request exceeds the configured limit.', 'WEB_ASK_TOO_LARGE', 413);
    }
    if (operatorCommandRouter.classify(text).intent === OPERATOR_INTENTS.APPROVAL_ACTION) {
      return auditDenied(
        'Approval decisions must use the Approval Center dry-run controls.',
        'WEB_ASK_APPROVAL_ACTION_BLOCKED',
      );
    }
    const output = await operatorCommandRouter.handle({
      requestId: id,
      operatorId: operatorId(req),
      channel: 'web',
      text,
      sessionId: req.body?.sessionId,
      metadata: { surface: 'control-tower-v0.8', dryRun: true },
    });
    return res.status(output.status === 'denied' ? 403 : 200).json(sanitizeValue(output));
  } catch (error) {
    return next(error);
  }
};
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

module.exports = { approvals, ask, askV08, auditSummary, help, session, status };
