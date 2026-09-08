const { CommerceOSProfileService } = require('../src/core/commerce-os');

const base = {
  tenantId: 'la-despensa-uae', displayName: 'La Despensa UAE', countryCode: 'AE', currency: 'AED',
  timezone: 'Asia/Dubai', capabilities: ['order_intake', 'inventory', 'accounting', 'approvals', 'operational_dashboard'],
  connectors: {
    order_intake: { adapter: 'shopify', mode: 'read_only' },
    inventory: { adapter: 'zoho_inventory', mode: 'read_write' },
    accounting: { adapter: 'zoho_books', mode: 'read_write' },
  },
};

describe('CommerceOSProfileService', () => {
  const service = new CommerceOSProfileService({ availableConnectors: ['shopify', 'zoho_inventory', 'zoho_books'] });

  test('builds a deterministic, tenant-neutral activation plan', () => {
    const first = service.activationPlan(base);
    const second = service.activationPlan({ ...base, connectors: { accounting: base.connectors.accounting, inventory: base.connectors.inventory, order_intake: base.connectors.order_intake } });
    expect(first.profileChecksum).toBe(second.profileChecksum);
    expect(first.ready).toBe(true);
    expect(first.capabilities).toEqual(expect.arrayContaining([
      { capability: 'approvals', status: 'ready_internal', source: 'cornerops_core' },
      { capability: 'inventory', status: 'connector_ready', source: 'zoho_inventory', mode: 'read_write' },
    ]));
  });

  test('fails closed when a requested capability has no connector', () => {
    const plan = service.activationPlan({ ...base, capabilities: [...base.capabilities, 'tax_invoicing'] });
    expect(plan.ready).toBe(false);
    expect(plan.capabilities).toContainEqual({ capability: 'tax_invoicing', status: 'configuration_required', source: null });
  });

  test('rejects embedded secrets and unavailable adapters', () => {
    const result = service.validate({
      ...base,
      connectors: { inventory: { adapter: 'mystery_erp', mode: 'read_write', apiKey: 'must-not-live-here' } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(['CONNECTOR_NOT_AVAILABLE', 'CONNECTOR_SECRET_NOT_ALLOWED']));
  });

  test('keeps payment capture disabled unless explicitly enabled', () => {
    expect(service.activationPlan(base).safety).toMatchObject({
      externalWritesRequireApproval: true, customerMessagesRequireApproval: true, paymentCaptureAllowed: false,
    });
  });
});
