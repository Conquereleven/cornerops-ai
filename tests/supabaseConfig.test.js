process.env.NODE_ENV = 'test';

const { getDataSourceStatus } = require('../src/data/supabase/supabaseClient');

describe('Supabase fallback configuration', () => {
  test('forces mock mode in tests without external services', () => {
    expect(getDataSourceStatus().mode).toBe('mock');
  });
});
