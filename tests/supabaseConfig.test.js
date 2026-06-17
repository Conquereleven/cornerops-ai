process.env.NODE_ENV = 'test';

const {
  getDataSourceStatus,
  getSupabaseAdminClient,
  getSupabaseClient,
} = require('../src/data/supabase/supabaseClient');

describe('Supabase fallback configuration', () => {
  test('forces mock mode in tests without external services', () => {
    expect(getDataSourceStatus().mode).toBe('mock');
    expect(getSupabaseClient()).toBeNull();
    expect(getSupabaseAdminClient()).toBeNull();
  });

  test('loads safely when Supabase environment variables are absent', () => {
    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.USE_SUPABASE;
    const isolated = require('../src/config/supabase');

    expect(isolated.isSupabaseConfigured()).toBe(false);
    expect(isolated.getSupabaseClient()).toBeNull();
    jest.dontMock('dotenv');
  });
});
