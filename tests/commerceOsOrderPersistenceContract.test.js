const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260828230707_commerce_os_order_persistence.sql'), 'utf8');

describe('Commerce OS order persistence migration contract', () => {
  test('uses private tenant-scoped RLS tables with indexed access paths', () => {
    expect(migration).toContain('cornerops_internal.commerce_order_intakes');
    expect(migration).toContain('force row level security');
    expect(migration).toContain("current_setting('app.current_tenant_id', true)");
    expect(migration).toContain('commerce_order_intakes_tenant_status_received_idx');
    expect(migration).toContain('commerce_order_intakes_tenant_source_updated_idx');
  });
  test('store serializes concurrent source identities with a transaction-scoped lock', () => {
    const store = fs.readFileSync(path.join(__dirname, '../src/core/commerce-os/PostgresCommerceOrderIntakeStore.js'), 'utf8');
    expect(store).toContain('pg_advisory_xact_lock(hashtextextended($1,0))');
  });
  test('keeps event history append-only and external effects false', () => {
    expect(migration).toContain('commerce order intake events are append-only');
    expect(migration).toContain('external_writes_performed boolean not null default false check (external_writes_performed=false)');
    expect(migration).toContain('payment_capture_performed boolean not null default false check (payment_capture_performed=false)');
    expect(migration).toContain('customer_messages_sent boolean not null default false check (customer_messages_sent=false)');
  });
  test.each(['public', 'anon', 'authenticated', 'service_role'])('revokes exposed access from %s', (role) => {
    expect(migration).toContain(`from public, anon, authenticated, service_role`);
    expect(role).toBeTruthy();
  });
});
