const express = require('express');
const env = require('../config/env');
const data = require('../core/data');
const { telegramOperatorChannelAdapter } = require('../core/operator-channel');

const router = express.Router();

router.post('/telegram/webhook', async (req, res, next) => {
  if (!env.corneropsRealOperatorChannelEnabled || !env.telegramOperatorEnabled) {
    const audit = await data.auditLogService.record({
      requestId: req.get('x-request-id'),
      eventType: 'operator_channel_webhook_denied',
      dataSource: 'operator_channel',
      operation: 'telegram_webhook',
      userId: 'unknown',
      channel: 'telegram',
      policyDecision: 'denied',
      status: 'denied',
      sanitizedInput: { provider: 'telegram', reason: 'disabled' },
    });
    return res.status(404).json({ error: true, message: 'Telegram operator channel is disabled.', auditId: audit?.id });
  }
  try {
    const result = await telegramOperatorChannelAdapter.handleWebhook(
      req.body,
      req.get('x-telegram-bot-api-secret-token'),
    );
    const status = result.status === 'blocked' ? 403 : result.status === 'error' ? 500 : 200;
    return res.status(status).json(result);
  } catch (error) {
    if (error.statusCode) {
      const audit = await data.auditLogService.record({
        requestId: req.get('x-request-id'),
        eventType: 'operator_channel_webhook_denied',
        dataSource: 'operator_channel',
        operation: 'telegram_webhook',
        userId: 'unknown',
        channel: 'telegram',
        policyDecision: 'denied',
        status: 'denied',
        sanitizedInput: { provider: 'telegram', reason: error.code },
        errorCode: error.code,
      });
      return res.status(error.statusCode).json({
        error: true,
        message: error.message,
        code: error.code,
        auditId: audit?.id,
      });
    }
    return next(error);
  }
});

module.exports = router;
