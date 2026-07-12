const path = require('path');
const { readDatabaseCa } = require('../src/core/work-queue/PostgresInternalOperationsStore');

describe('internal persistence TLS v1.9.1', () => {
  test('loads the pinned public Supabase root CA', () => {
    const certificate = readDatabaseCa(path.join(
      __dirname,
      '..',
      'config',
      'certs',
      'supabase-root-2021-ca.pem',
    ));
    expect(certificate).toContain('BEGIN CERTIFICATE');
    expect(certificate).not.toMatch(/password|token|secret/i);
  });

  test('keeps system trust when no custom CA path is configured', () => {
    expect(readDatabaseCa('')).toBeUndefined();
  });
});
