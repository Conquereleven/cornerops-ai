const { createHash } = require('crypto');
const { COMMERCE_OS_CAPABILITIES, CONNECTOR_MODES, commerceOsError } = require('./commerceOsTypes');

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const slug = (value) => String(value || '').trim().toLowerCase();
const connectorId = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_');

class CommerceOSProfileService {
  constructor({ availableConnectors = [] } = {}) {
    this.availableConnectors = new Set(availableConnectors.map(connectorId));
  }

  validate(input = {}) {
    const errors = [];
    const tenantId = slug(input.tenantId);
    const countryCode = String(input.countryCode || '').trim().toUpperCase();
    const currency = String(input.currency || '').trim().toUpperCase();
    if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(tenantId)) errors.push({ code: 'TENANT_ID_INVALID', field: 'tenantId' });
    if (!/^[A-Z]{2}$/.test(countryCode)) errors.push({ code: 'COUNTRY_CODE_INVALID', field: 'countryCode' });
    if (!/^[A-Z]{3}$/.test(currency)) errors.push({ code: 'CURRENCY_INVALID', field: 'currency' });

    const requestedCapabilities = [...new Set(input.capabilities || [])];
    requestedCapabilities.forEach((capability) => {
      if (!COMMERCE_OS_CAPABILITIES.includes(capability)) errors.push({ code: 'CAPABILITY_UNKNOWN', capability });
    });

    const connectors = Object.entries(input.connectors || {}).map(([capability, config]) => {
      const adapter = connectorId(config?.adapter);
      const mode = config?.mode || 'disabled';
      if (!COMMERCE_OS_CAPABILITIES.includes(capability)) errors.push({ code: 'CONNECTOR_CAPABILITY_UNKNOWN', capability });
      if (!CONNECTOR_MODES.includes(mode)) errors.push({ code: 'CONNECTOR_MODE_INVALID', capability, mode });
      if (mode !== 'disabled' && !adapter) errors.push({ code: 'CONNECTOR_ADAPTER_REQUIRED', capability });
      if (adapter && this.availableConnectors.size && !this.availableConnectors.has(adapter)) {
        errors.push({ code: 'CONNECTOR_NOT_AVAILABLE', capability, adapter });
      }
      if (config && Object.keys(config).some((key) => /secret|password|token|api.?key/i.test(key))) {
        errors.push({ code: 'CONNECTOR_SECRET_NOT_ALLOWED', capability });
      }
      return { capability, adapter: adapter || null, mode };
    });

    const profile = {
      schemaVersion: 'commerce-os-profile/v1', tenantId, displayName: String(input.displayName || '').trim(),
      countryCode, currency, timezone: String(input.timezone || '').trim() || 'UTC',
      capabilities: requestedCapabilities.sort(), connectors: connectors.sort((a, b) => a.capability.localeCompare(b.capability)),
      policies: {
        externalWritesRequireApproval: input.policies?.externalWritesRequireApproval !== false,
        customerMessagesRequireApproval: input.policies?.customerMessagesRequireApproval !== false,
        paymentCaptureAllowed: input.policies?.paymentCaptureAllowed === true,
      },
    };
    const checksum = createHash('sha256').update(stableJson(profile)).digest('hex');
    return { valid: errors.length === 0, errors, profile, checksum };
  }

  activationPlan(input = {}) {
    const result = this.validate(input);
    if (!result.valid) throw commerceOsError('Commerce OS profile is invalid.', 'COMMERCE_OS_PROFILE_INVALID', result.errors);
    const configured = new Map(result.profile.connectors.map((item) => [item.capability, item]));
    const capabilities = result.profile.capabilities.map((capability) => {
      const connector = configured.get(capability);
      const internal = ['approvals', 'operational_dashboard'].includes(capability);
      if (internal) return { capability, status: 'ready_internal', source: 'cornerops_core' };
      if (!connector || connector.mode === 'disabled') return { capability, status: 'configuration_required', source: null };
      return { capability, status: connector.mode === 'manual' ? 'manual_ready' : 'connector_ready', source: connector.adapter, mode: connector.mode };
    });
    return {
      tenantId: result.profile.tenantId, profileChecksum: result.checksum, capabilities,
      ready: capabilities.every((item) => item.status !== 'configuration_required'),
      safety: {
        externalWritesRequireApproval: result.profile.policies.externalWritesRequireApproval,
        customerMessagesRequireApproval: result.profile.policies.customerMessagesRequireApproval,
        paymentCaptureAllowed: result.profile.policies.paymentCaptureAllowed,
      },
    };
  }
}

module.exports = { CommerceOSProfileService };
