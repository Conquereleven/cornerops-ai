const { execFileSync } = require('child_process');
const path = require('path');
const {
  CornerMexSupabaseReadOnlyClient,
  CornerMexSupabaseReadOnlyConfig,
  CornerMexSupabaseReadOnlyRepository,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
} = require('../src/integrations/cornermex');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const { assertNoSecretKeys } = require('../src/api/contracts/controlTowerFrontendSchemas');

const root = path.resolve(__dirname, '..');
const safeConfig = {
  cornermexSupabaseEnabled: true,
  cornermexSupabaseUrl: 'https://example.supabase.co',
  cornermexSupabaseAnonKey: 'publishable-anon-test-key',
  cornermexSupabaseReadOnly: true,
  cornermexSupabaseAllowWrites: false,
  cornermexSupabaseServiceRoleKeyBlocked: true,
  cornermexSupabaseAuditReads: true,
  cornermexSupabasePiiMasking: true,
  cornermexSupabaseMaskPii: true,
  cornermexSupabaseFailClosed: true,
  cornermexSupabaseMaxRows: 2,
  cornermexSupabaseRequestTimeoutMs: 8000,
};

const repo = (config, client) => new CornerMexSupabaseReadOnlyRepository({
  auditLogService: { record: jest.fn(async () => ({ id: 'audit-v14' })) },
  client,
  configSummary: new CornerMexSupabaseReadOnlyConfig({ config }),
});

describe('CornerMex Supabase read-only v1.4', () => {
  test('missing config degrades safely without claiming real_read_only', () => {
    const validation = new CornerMexSupabaseReadOnlyConfig({ config: {} }).validate();
    expect(validation.activationCandidate).toBe(false);
    expect(validation.sourceMode).toBe(SOURCE_MODES.REPO_DISCOVERED);
    expect(validation.missing).toEqual(expect.arrayContaining([
      'CORNERMEX_SUPABASE_ENABLED=true',
      'CORNERMEX_SUPABASE_URL',
      'CORNERMEX_SUPABASE_ANON_KEY',
    ]));
  });

  test('unsafe write flags and service-role-like keys block readiness', async () => {
    const config = {
      ...safeConfig,
      cornermexSupabaseAllowWrites: true,
      cornermexSupabaseAnonKey: 'service_role_fake_test_value_for_blocking',
    };
    const status = await repo(config, null).checkReadiness();
    expect(status.sourceMode).toBe(SOURCE_MODES.BLOCKED_UNSAFE_CONFIG);
    expect(status.supabaseStatus).toBe(SUPABASE_STATUS.BLOCKED);
    expect(status.unsafe.join(' ')).toMatch(/ALLOW_WRITES|service-role-like/i);
  });

  test('repository reaches real_read_only only after safe select succeeds', async () => {
    const client = {
      selectRows: jest.fn(async ({ limit }) => ({
        data: [
          { id: 'row-1', name: 'Jaime Founder', email: 'jaime@example.test', phone: '+971501234567' },
          { id: 'row-2', name: 'Second Row', email: 'second@example.test', phone: '+971509999999' },
        ].slice(0, limit),
      })),
    };
    const status = await repo(safeConfig, client).checkReadiness({ requestId: 'test-v14' });
    expect(status.sourceMode).toBe(SOURCE_MODES.REAL_READ_ONLY);
    expect(status.supabaseStatus).toBe(SUPABASE_STATUS.CONNECTED);
    expect(Object.values(status.tableAvailability)).toEqual(expect.arrayContaining([TABLE_AVAILABILITY.AVAILABLE_MASKED]));
    expect(client.selectRows).toHaveBeenCalledWith(expect.objectContaining({ table: 'products', limit: 1 }));

    const products = await repo(safeConfig, client).listEntity('products', { limit: 2 });
    expect(products.data).toHaveLength(2);
    expect(products.data[0].email).toBe('masked@example.test');
    expect(products.data[0].phone).toMatch(/\*+/);
    expect(products.meta.writesBlocked).toBe(true);
  });

  test('partial table failures produce real_read_only_partial and sanitized availability', async () => {
    const client = {
      selectRows: jest.fn(async ({ table }) => {
        if (table === 'orders') return { error: { code: '42P01', message: 'relation "orders" does not exist' } };
        return { data: [] };
      }),
    };
    const status = await repo(safeConfig, client).checkReadiness();
    expect(status.sourceMode).toBe(SOURCE_MODES.REAL_READ_ONLY_PARTIAL);
    expect(status.supabaseStatus).toBe(SUPABASE_STATUS.PARTIAL);
    expect(status.tableAvailability.orders).toBe(TABLE_AVAILABILITY.MISSING_TABLE);
    expect(status.tableAvailability.products).toBe(TABLE_AVAILABILITY.AVAILABLE_EMPTY);
  });

  test('client exposes select-only surface with no mutation methods', () => {
    const client = new CornerMexSupabaseReadOnlyClient({ supabaseClient: null });
    expect(typeof client.selectRows).toBe('function');
    ['insert', 'update', 'delete', 'upsert', 'rpc'].forEach((method) => {
      expect(client[method]).toBeUndefined();
    });
  });

  test('frontend contract propagates Supabase source labels safely', async () => {
    const contract = new ControlTowerFrontendContract({
      controlTowerReportService: {
        getReport: async () => ({
          generatedAt: '2026-07-05T00:00:00.000Z',
          safety: { externalSendsBlocked: true, warnings: [] },
          realSourceExpansion: { sourceModeSummary: 'real_read_only_partial' },
          cornerMexLovableConnector: {
            sourceMode: 'real_read_only_partial',
            dataSource: 'cornermex_supabase',
            supabaseStatus: 'partial',
            tableAvailability: { products: 'available_empty', orders: 'missing_table' },
            maskingApplied: true,
            lastReadAt: '2026-07-05T00:00:00.000Z',
            auditId: 'audit-supabase-v14',
            writesBlocked: true,
            warnings: [],
          },
          cornerMexFlowEngine: { sourceMode: 'real_read_only_partial', availableFlows: [] },
          telegramOperator: { operatorMode: 'polling', founderPollingStatus: 'missing_config' },
        }),
      },
    });
    const cornerMex = await contract.getSection('cornermex');
    expect(cornerMex.data.dataSource).toBe('cornermex_supabase');
    expect(cornerMex.data.supabaseStatus).toBe('partial');
    expect(cornerMex.data.tableAvailability.orders).toBe('missing_table');
    expect(assertNoSecretKeys(cornerMex)).toBe(true);
  });

  test('v1.4 scripts run without credentials and do not expose secrets', () => {
    const env = {
      ...process.env,
      CORNERMEX_SUPABASE_ENABLED: 'false',
      CORNERMEX_SUPABASE_URL: '',
      CORNERMEX_SUPABASE_ANON_KEY: '',
    };
    const check = execFileSync(process.execPath, ['scripts/cornermex-supabase-readonly-check.js'], {
      cwd: root,
      encoding: 'utf8',
      env,
      maxBuffer: 8 * 1024 * 1024,
    });
    const parsed = JSON.parse(check);
    expect(parsed.mode).toBe('blocked_by_missing_supabase_readonly_config');
    expect(parsed.credentials.anonKeyPrinted).toBe(false);
    expect(assertNoSecretKeys(parsed)).toBe(true);

    const demo = execFileSync(process.execPath, ['scripts/demo-v1.4.js'], {
      cwd: root,
      encoding: 'utf8',
      env,
      maxBuffer: 8 * 1024 * 1024,
    });
    expect(assertNoSecretKeys(JSON.parse(demo))).toBe(true);
  });
});
