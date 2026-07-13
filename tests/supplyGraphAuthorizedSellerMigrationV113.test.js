const fs=require('fs');const path=require('path');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260713160000_supplygraph_authorized_seller_network_v113.sql'),'utf8');
describe('v1.13 migration boundary',()=>{
  test.each(['supplier_onboarding_packages','supplier_onboarding_catalog_items','supplier_onboarding_applications','seller_product_media','seller_inventory_ledger','seller_inventory_balances','sourcing_supplier_coverage_results'])('creates private %s table',(name)=>expect(migration).toContain(`cornerops_internal.${name}`));
  test('revokes public roles and blocks append-only mutation',()=>{expect(migration).toContain('from public,anon,authenticated,service_role');expect(migration).toContain('append-only');expect(migration).toContain("market_completeness_claim boolean not null default false check(market_completeness_claim=false)");expect(migration).toContain("if tg_op='DELETE' then raise exception 'inventory balances cannot be deleted'");});
  test('ties every inventory balance change to an exact ledger delta',()=>{expect(migration).toContain('new.on_hand_quantity<>ledger.quantity_delta');expect(migration).toContain('new.on_hand_quantity<>old.on_hand_quantity+ledger.quantity_delta');});
  test('contains no public schema, destructive reset, or service-role grant',()=>{expect(migration).not.toMatch(/create table\s+public\./i);expect(migration).not.toMatch(/drop table|drop schema/i);expect(migration).not.toMatch(/grant .* to service_role/i);});
});
