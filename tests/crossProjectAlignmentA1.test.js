const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { projectRefFromUrl, CornerMexSupabaseReadOnlyConfig } = require('../src/integrations/cornermex/CornerMexSupabaseReadOnlyConfig');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');

const CONTRACT_SHA256 = 'b87acfbdeac1427e141677616a0d8fbda5ecabc10a4c84012a9bd5d8bc98249a';
const contractPath = path.join(__dirname, '..', 'contracts', 'cornermex-cornerops-boundary-v1.json');

describe('CornerMex x CornerOps alignment A1', () => {
  test('pins the shared commerce boundary contract', () => {
    const raw = fs.readFileSync(contractPath);
    const contract = JSON.parse(raw);
    expect(crypto.createHash('sha256').update(raw).digest('hex')).toBe(CONTRACT_SHA256);
    expect(contract.commerceModel).toBe('single_merchant_with_internal_supplier_network');
    expect(contract.systems.cornermex).toBe('commerce_system_of_record');
    expect(contract.systems.cornerops).toBe('operations_intelligence_system_of_record');
    expect(contract.writePolicies.corneropsDirectDatabaseWrite).toBe('blocked');
  });

  test('labels the configured Supabase source as an external read replica', () => {
    const config = new CornerMexSupabaseReadOnlyConfig({
      config: {
        cornermexSupabaseEnabled: true,
        cornermexSupabaseUrl: 'https://exampleproject.supabase.co',
        cornermexSupabaseAnonKey: 'publishable-test-value',
        cornermexSupabaseReadOnly: true,
        cornermexSupabaseAllowWrites: false,
      },
    }).validate();
    expect(projectRefFromUrl('https://exampleproject.supabase.co')).toBe('exampleproject');
    expect(config.sourceSystem).toBe('cornermex_read_replica');
    expect(config.sourceRole).toBe('external_read_replica');
    expect(config.sourceProjectRef).toBe('exampleproject');
    expect(config.readOnlyFlags.allowWrites).toBe(false);
  });

  test('uses canonical Command Center roles and no active Lovable role labels', async () => {
    const service = new ControlTowerFrontendContract();
    const response = await service.status({ generatedAt: '2026-07-13T00:00:00.000Z' });
    expect(response.data.frontendRole).toBe('repository_frontend');
    expect(response.data.commerceSystemRole).toBe('cornermex_commerce_system');
    expect(response.data.deploymentRole).toBe('railway_production');
    expect(response.data.lovableFrontendRole).toBeUndefined();
    expect(response.data.cornerMexLovableRole).toBeUndefined();
  });

  test('does not advertise unavailable data as a mock fallback', () => {
    const files = [
      '../src/integrations/cornermex/CornerMexSupabaseReadOnlyRepository.js',
      '../src/integrations/cornermex/CornerMexCatalogReadModelReportService.js',
    ];
    for (const file of files) {
      expect(fs.readFileSync(path.join(__dirname, file), 'utf8')).not.toContain('mock_fallback');
    }
  });
});
