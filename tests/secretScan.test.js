const { scan } = require('../scripts/secret-scan');

const run = (content) => scan(['file.txt'], () => content).map((finding) => finding.label);

describe('secret scan', () => {
  test('flags credential-shaped strings', () => {
    const jwt = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ', 'abcdefghijklmnopqrstuvwxyz0123456789'].join('.');
    expect(run(`KEY=${jwt}`)).toContain('JWT (possible service-role or anon key)');
    expect(run(`sb_secret_${'a1B2'.repeat(6)}`)).toContain('Supabase secret key');
    expect(run(`ghp_${'a'.repeat(36)}`)).toContain('GitHub token');
    expect(run(['-----BEGIN', 'PRIVATE KEY-----'].join(' '))).toContain('private key block');
    expect(run(`postgresql://app:${'s3cr3tpw'}@db.internal.example.net:5432/app`)).toContain('database URL with password');
  });

  test('ignores placeholders, local URLs, configuration names and allow-listed lines', () => {
    expect(run('SUPABASE_SERVICE_ROLE_KEY=')).toEqual([]);
    expect(run('VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...')).toEqual([]);
    expect(run('postgres://postgres@127.0.0.1:54329/cornerops_test')).toEqual([]);
    expect(run('postgres://user:password@localhost:5432/db')).toEqual([]);
    expect(run('DATABASE_URL=postgresql://USER:<password>@HOST/db')).toEqual([]);
    expect(run(`sb_secret_${'a1B2'.repeat(6)} // secret-scan:allow fixture`)).toEqual([]);
  });

  test('skips dependencies, build output and binaries', () => {
    const jwtLike = `ghp_${'a'.repeat(36)}`;
    expect(scan(['node_modules/x/index.js', 'frontend/dist/assets/a.js', 'a.png', 'package-lock.json'], () => jwtLike)).toEqual([]);
  });
});
