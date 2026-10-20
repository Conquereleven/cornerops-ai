const { createHash, createHmac, timingSafeEqual } = require('crypto');
const env = require('../config/env');
const internalAuth = require('./internalAuth');
const { createWebConsoleGuard } = require('./webConsoleGuard');
const { createControlTowerFrontendAuth } = require('../api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../api/middleware/controlTowerFrontendCors');

const equalSecret = (a, b) => timingSafeEqual(
  createHash('sha256').update(String(a || '')).digest(),
  createHash('sha256').update(String(b || '')).digest(),
);
const deny = (res, status) => res.status(status).json({ error: true, message: 'API access denied or unavailable.' });
const verifySignature = (req, res, next, secret) => {
  if (!secret) return deny(res, 503);
  const signature = req.get('x-hub-signature-256') || '';
  if (!Buffer.isBuffer(req.rawBody) || !/^sha256=[a-f0-9]{64}$/.test(signature)) return deny(res, 401);
  const expected = createHmac('sha256', secret).update(req.rawBody).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return deny(res, 401);
  return next();
};

// Mounted at /api BEFORE CORS and all routers. Unknown/future APIs inherit denial.
const apiContainment = (req, res, next) => {
  const p = req.path.toLowerCase().replace(/\/$/, '') || '/';
  if (p === '/health' && ['GET', 'HEAD'].includes(req.method)) return next();
  if (p === '/webhooks/whatsapp') {
    if (req.method === 'GET') {
      if (!env.whatsappVerifyToken) return deny(res, 503);
      if (req.query['hub.mode'] !== 'subscribe' || typeof req.query['hub.challenge'] !== 'string'
        || typeof req.query['hub.verify_token'] !== 'string'
        || !equalSecret(req.query['hub.verify_token'], env.whatsappVerifyToken)) return deny(res, 403);
      return next();
    }
    if (req.method !== 'POST') return deny(res, 405);
    return verifySignature(req, res, next, env.whatsappWebhookSecret);
  }
  if (p === '/github/webhook') {
    if (req.method !== 'POST') return deny(res, 405);
    return verifySignature(req, res, next, env.githubWebhookSecret);
  }
  if (p === '/operator-channel/telegram/webhook') {
    if (req.method !== 'POST') return deny(res, 405);
    if (!env.corneropsRealOperatorChannelEnabled || !env.corneropsTelegramActivationEnabled || !env.telegramOperatorEnabled) return next();
    if (!env.telegramOperatorWebhookSecret) return deny(res, 503);
    if (!equalSecret(req.get('x-telegram-bot-api-secret-token'), env.telegramOperatorWebhookSecret)) return deny(res, 401);
    return next();
  }
  if (/^\/(intelligence(?:\/|$)|control-tower\/frontend\/v1(?:\/|$))/.test(p)) {
    // Browser preflight carries no credential. It validates Origin only and ends here.
    return createControlTowerFrontendCors()(req, res, () => createControlTowerFrontendAuth()(req, res, next));
  }
  if (/^\/(actions(?:\/|$)|operator\/v0\.8(?:\/|$)|control-tower\/v(?:0\.8|0\.9|1\.0|1\.1)(?:\/|$))/.test(p)) {
    return createWebConsoleGuard()(req, res, next);
  }
  return internalAuth(req, res, next);
};
module.exports = { apiContainment, verifySignature };
