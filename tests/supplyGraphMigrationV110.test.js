const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/20260712220000_supplygraph_data_foundation_v110.sql',
);
const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
const remediation = fs.readFileSync(path.join(
  __dirname,
  '../supabase/migrations/20260713010500_supplygraph_remove_duplicate_index_v110.sql',
), 'utf8').toLowerCase();

describe('SupplyGraph migration v1.10', () => {
  test('creates only the five expected private-schema tables', () => {
    const tables = [...sql.matchAll(/create table if not exists\s+cornerops_internal\.([a-z_]+)/g)]
      .map((match) => match[1]);
    expect(tables).toEqual([
      'supplier_profiles', 'supplier_catalog_items', 'supplier_offer_snapshots',
      'demand_requests', 'demand_items',
    ]);
    expect(sql).not.toMatch(/(?:from|into|update|table)\s+public\./);
    expect(sql).not.toContain('truncate ');
    expect(sql).not.toMatch(/drop\s+(?:table|schema|function|trigger)/);
  });

  test('enforces append-only observations and required integrity constraints', () => {
    expect(sql).toContain('supplier_offer_snapshots_append_only');
    expect(sql).toContain('before update or delete on cornerops_internal.supplier_offer_snapshots');
    expect(sql).toContain('idempotency_key text not null unique');
    expect(sql).toContain('demand_items_one_active_key_idx');
    expect(sql).toContain('unique (supplier_id, identity_key)');
  });

  test('grants exact least privilege and no Data API runtime access', () => {
    expect(sql).toContain('grant select, insert, update on cornerops_internal.supplier_profiles to cornerops_internal_runtime');
    expect(sql).toContain('grant select, insert on cornerops_internal.supplier_offer_snapshots to cornerops_internal_runtime');
    expect(sql).toContain('revoke update, delete on cornerops_internal.supplier_offer_snapshots from cornerops_internal_runtime');
    expect(sql).toContain('revoke all on all tables in schema cornerops_internal from public, anon, authenticated, service_role');
    expect(sql).not.toMatch(/grant\s+.+\s+to\s+(?:public|anon|authenticated|service_role)/);
  });

  test('includes the required relationship and query indexes', () => {
    for (const index of [
      'supplier_profiles_status_idx', 'supplier_catalog_items_supplier_idx',
      'supplier_catalog_items_normalized_name_idx', 'supplier_offer_snapshots_freshness_idx',
      'demand_requests_status_idx', 'demand_requests_priority_idx',
      'demand_requests_emirate_idx', 'demand_requests_segment_idx', 'demand_items_request_idx',
    ]) expect(sql).toContain(index);
  });

  test('removes only the redundant canonical lookup index reported by the advisor', () => {
    expect(remediation).toContain('drop index if exists cornerops_internal.supplier_profiles_canonical_lookup_idx');
    expect(remediation).not.toMatch(/drop\s+(?:table|schema|function|trigger)/);
    expect(remediation).not.toMatch(/(?:from|into|update|table)\s+public\./);
  });
});
