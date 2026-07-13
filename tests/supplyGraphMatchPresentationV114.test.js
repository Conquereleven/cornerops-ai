const { SupplyGraphMatchStore } = require('../src/core/supplygraph');

describe('SupplyGraph match presentation evidence v1.14', () => {
  test('enriches persisted candidates for display without changing scoring evidence', async () => {
    const queries = [];
    const client = { query: jest.fn(async (sql) => {
      queries.push(sql);
      if (sql.includes('sourcing_match_runs')) return { rows: [{ id: 'run-1', comparison_scope: 'authorized_verified_seller_set' }] };
      if (sql.includes('sourcing_match_item_results')) return { rows: [{ id: 'item-1', match_run_id: 'run-1' }] };
      if (sql.includes('sourcing_match_candidates')) return { rows: [{
        id: 'candidate-1', item_result_id: 'item-1', evidence_snapshot: { catalogDisplayName: 'Agave Syrup', supplierName: 'Seller' },
        display_name: 'Agave Syrup', supplier_name: 'Seller', observed_currency: 'AED', observed_unit_price: '21.50',
        observed_price_metadata: { priceType: 'public_web_price' }, source_image_url: 'https://seller.example/agave.webp',
        managed_media_present: true, media_asset_checksum: 'a'.repeat(64), media_mime_type: 'image/webp', media_status: 'imported',
        available_quantity: '100', inventory_unit: 'seller_listing_unit', physical_count_verified: false,
        initialization_source: 'founder_authorized_initialization', match_score: '78', confidence_score: '47.5',
      }] };
      if (sql.includes('sourcing_recommendations')) return { rows: [{ id: 'recommendation-1' }] };
      if (sql.includes('sourcing_supplier_coverage_results')) return { rows: [] };
      return { rows: [] };
    }) };
    const store = new SupplyGraphMatchStore({ supplyGraphStore: { table: (name) => `cornerops_internal.${name}` } });
    const result = await store.getWithClient(client, 'run-1');
    expect(result.items[0].candidates[0].presentationEvidence).toMatchObject({
      presentationOnly: true, notScoringInput: true, displayName: 'Agave Syrup', sourceImageUrl: 'https://seller.example/agave.webp',
      media: { managed: true, mimeType: 'image/webp', status: 'imported' },
      inventory: { availableQuantity: '100', physicalCountVerified: false, initializationSource: 'founder_authorized_initialization' },
    });
    expect(queries.join(' ')).toContain('seller_product_media');
    expect(queries.join(' ')).toContain('seller_inventory_balances');
    expect(queries.join(' ')).not.toMatch(/update|delete|insert|truncate/i);
  });
});
