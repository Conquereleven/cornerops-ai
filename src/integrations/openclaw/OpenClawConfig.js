const env = require('../../config/env');

const normalizeBaseUrl = (value) => String(value || '').replace(/\/+$/, '');

const getOpenClawConfig = () => Object.freeze({
  enabled: env.openclawEnabled,
  baseUrl: normalizeBaseUrl(env.openclawBaseUrl),
  token: env.openclawGatewayToken,
  password: env.openclawGatewayPassword,
  defaultModel: env.openclawDefaultModel,
  timeoutMs: env.openclawTimeoutMs,
  maxRetries: env.openclawMaxRetries,
  dryRun: env.openclawDryRun,
  requireApproval: env.openclawRequireApproval,
  auditEnabled: env.openclawAuditEnabled,
  sandboxMode: env.openclawSandboxMode,
  allowedChannels: env.openclawAllowedChannels,
  allowedUsers: env.openclawAllowedUsers,
  allowedTools: env.openclawAllowedTools,
  circuitBreakerFailures: 3,
  circuitBreakerCooldownMs: 30000,
});

module.exports = {
  getOpenClawConfig,
};
