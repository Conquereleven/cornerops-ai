const { execFileSync } = require('child_process');
const path = require('path');
const {
  CornerMexSupabaseReadOnlyClient,
  CornerMexSupabaseReadOnlyConfig,
  CornerMexSupabaseReadOnlyRepository,
  DEFAULT_READ_VIEW_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  tableMappingCandidatesFromConfig,
} = require('../src/integrations/cornermex');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const { assertNoSecretKeys } = require('../src/api/contracts/controlTowerFrontendSchemas');
const { classifyReadFailure } = require('../scripts/cornermex-supabase-readonly-check');
const {
  buildSupabaseKeyCompatibilityReport,
  classifySupabaseClientKey,
} = require('../scripts/supabase-key-compatibility-check');

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
    expect(client.selectRows).toHaveBeenCalledWith(expect.objectContaining({ table: DEFAULT_READ_VIEW_TABLES.products, limit: 1 }));

    const products = await repo(safeConfig, client).listEntity('products', { limit: 2 });
    expect(products.data).toHaveLength(2);
    expect(products.data[0].email).toBe('masked@example.test');
    expect(products.data[0].phone).toMatch(/\*+/);
    expect(products.meta.writesBlocked).toBe(true);
  });

  test('readiness probes run concurrently and cache the safe result', async () => {
    const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 25));
    const client = {
      selectRows: jest.fn(() => delay({ data: [] })),
      countRows: jest.fn(() => delay({ count: 0 })),
    };
    const repository = repo(safeConfig, client);
    const startedAt = Date.now();
    const first = await repository.checkReadiness({ requestId: 'concurrent-readiness' });
    const elapsedMs = Date.now() - startedAt;
    const selectCalls = client.selectRows.mock.calls.length;
    const countCalls = client.countRows.mock.calls.length;
    const second = await repository.checkReadiness({ requestId: 'cached-readiness' });
    expect(elapsedMs).toBeLessThan(250);
    expect(first.sourceMode).toBe(SOURCE_MODES.REAL_READ_ONLY);
    expect(second).toBe(first);
    expect(client.selectRows).toHaveBeenCalledTimes(selectCalls);
    expect(client.countRows).toHaveBeenCalledTimes(countCalls);
  });

  test('partial table failures produce real_read_only_partial and sanitized availability', async () => {
    const client = {
      selectRows: jest.fn(async ({ table }) => {
        if (table === DEFAULT_READ_VIEW_TABLES.orders || table === 'orders') {
          return { error: { code: '42P01', message: 'relation "orders" does not exist' } };
        }
        return { data: [] };
      }),
    };
    const status = await repo(safeConfig, client).checkReadiness();
    expect(status.sourceMode).toBe(SOURCE_MODES.REAL_READ_ONLY_PARTIAL);
    expect(status.supabaseStatus).toBe(SUPABASE_STATUS.PARTIAL);
    expect(status.tableAvailability.orders).toBe(TABLE_AVAILABILITY.MISSING_TABLE);
    expect(status.tableAvailability.products).toBe(TABLE_AVAILABILITY.AVAILABLE_EMPTY);
  });

  test('missing public read model has distinct status and actionRequired', async () => {
    const client = {
      selectRows: jest.fn(async () => ({
        error: { code: 'PGRST205', message: 'Could not find the table in the schema cache' },
      })),
    };
    const status = await repo(safeConfig, client).checkReadiness();
    expect(status.sourceMode).toBe(SOURCE_MODES.REPO_DISCOVERED);
    expect(status.supabaseStatus).toBe(SUPABASE_STATUS.CONNECTED_NO_PUBLIC_READ_MODEL);
    expect(status.readModelStatus).toBe('missing_public_read_model');
    expect(status.actionRequired).toBe('create_cornerops_readonly_views');
    expect(Object.values(status.tableAvailability)).toEqual(expect.arrayContaining([TABLE_AVAILABILITY.MISSING_TABLE]));
    expect(status.readOnlyFlags.allowWrites).toBe(false);
  });

  test('table map JSON, default read views, and legacy table fallback are ordered safely', () => {
    const candidates = tableMappingCandidatesFromConfig({
      cornermexSupabaseTableMapJson: JSON.stringify({
        products: 'custom_products_v',
        b2bLeads: 'custom_leads_v',
      }),
    });
    expect(candidates.products).toEqual(['custom_products_v', 'cornerops_products_v', 'products']);
    expect(candidates.leads).toEqual(['custom_leads_v', 'cornerops_b2b_leads_v', 'b2b_leads']);
    expect(candidates.orders).toEqual(['cornerops_orders_v', 'orders']);
  });

  test('repository falls back to legacy table if read view is missing', async () => {
    const client = {
      selectRows: jest.fn(async ({ table }) => {
        if (table === DEFAULT_READ_VIEW_TABLES.products) {
          return { error: { code: 'PGRST205', message: 'Could not find the table in the schema cache' } };
        }
        return { data: [] };
      }),
    };
    const products = await repo(safeConfig, client).readTable('products', { limit: 1 });
    expect(products.meta.availability).toBe(TABLE_AVAILABILITY.AVAILABLE_EMPTY);
    expect(client.selectRows).toHaveBeenCalledWith(expect.objectContaining({ table: 'products', limit: 1 }));
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

  test('read failure classifier identifies invalid anon key safely', () => {
    const reason = classifyReadFailure({
      supabaseStatus: 'error_sanitized',
      tableAvailability: { products: 'error_sanitized', orders: 'error_sanitized' },
      warnings: ['Supabase read failed safely for products: Invalid API key'],
    });
    expect(reason).toBe('invalid_anon_key');
  });

  test('read failure classifier reports missing_table for missing mapped tables', () => {
    const reason = classifyReadFailure({
      supabaseStatus: 'error_sanitized',
      tableAvailability: { products: 'missing_table', orders: 'missing_table' },
      warnings: ['Could not find the table in the schema cache'],
    });
    expect(reason).toBe('missing_table');
  });

  test('read failure classifier reports missing_public_read_model for connected projects without read views', () => {
    const reason = classifyReadFailure({
      supabaseStatus: 'connected_no_public_read_model',
      tableAvailability: { products: 'missing_table', orders: 'missing_table' },
      warnings: [],
    });
    expect(reason).toBe('missing_public_read_model');
  });

  test('Supabase key compatibility allows publishable and legacy anon keys only for read-only clients', () => {
    expect(classifySupabaseClientKey('sb_publishable_fake_key_for_test')).toBe('publishable');
    expect(classifySupabaseClientKey('eyJhbGciOiJIUzI1NiJ9.test.signature')).toBe('legacy_anon_jwt');
    expect(classifySupabaseClientKey('sb_secret_fake_key_for_test')).toBe('forbidden_secret');
    expect(classifySupabaseClientKey('service_role_fake_key_for_test')).toBe('forbidden_secret');

    const report = buildSupabaseKeyCompatibilityReport({
      CORNERMEX_SUPABASE_URL: 'https://example.supabase.co',
      CORNERMEX_SUPABASE_ANON_KEY: 'sb_publishable_fake_key_for_test',
    });
    expect(report).toMatchObject({
      keyPresent: true,
      keyType: 'publishable',
      urlPresent: true,
      serviceRoleDetected: false,
      safeForReadOnlyClient: true,
      secretsPrinted: false,
    });
    expect(assertNoSecretKeys(report)).toBe(true);
  });
});
