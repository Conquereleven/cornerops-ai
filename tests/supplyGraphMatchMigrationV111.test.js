const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260713020000_supplygraph_match_engine_v111.sql');
const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

describe('SupplyGraph match migration v1.11', () => {
  test('creates exactly four private matching tables', () => {
    const tables = [...sql.matchAll(/create table if not exists\s+cornerops_internal\.([a-z_]+)/g)].map((match) => match[1]);
    expect(tables).toEqual(['sourcing_match_runs', 'sourcing_match_item_results', 'sourcing_match_candidates', 'sourcing_recommendations']);
    expect(sql).not.toMatch(/create table if not exists\s+public\./);
  });

  test('enforces immutable evidence and exact runtime grants', () => {
    expect((sql.match(/reject_sourcing_match_mutation/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(sql).toContain('grant select, insert on cornerops_internal.sourcing_match_runs');
    expect(sql).toContain('revoke update, delete, truncate on cornerops_internal.sourcing_match_runs');
    expect(sql).toContain('from public, anon, authenticated, service_role');
  });

  test('contains no destructive or CornerMex business operations', () => {
    expect(sql).not.toMatch(/\bdrop\s+(table|schema)\b|\btruncate\s+table\b|\bdelete\s+from\b/);
    expect(sql).not.toMatch(/public\.(products|orders|customers|payments|b2b_leads)/);
  });
});
