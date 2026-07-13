const { SupplierEvidenceValidator } = require('../src/core/supplygraph/SupplierEvidenceValidator');

const checksum = 'a'.repeat(64);
const base = (overrides={}) => ({
  idempotencyKey:'pkg-1',supplierId:'supplier-1',evidenceScope:'production',sourceType:'supplier_price_list',
  sourceReference:'https://supplier.example/catalog',sourceChecksum:checksum,observedAt:'2026-07-12T00:00:00.000Z',
  validUntil:'2026-08-12T00:00:00.000Z',verificationStatus:'source_verified',facts:[{supplierCatalogItemId:'item-1',factType:'price',value:{amount:10.5},unit:'case',currency:'AED'}],...overrides,
});

describe('Supplier evidence validation v1.12',()=>{
  const validator=new SupplierEvidenceValidator({maxFacts:3,now:()=>Date.parse('2026-07-13T00:00:00Z')});
  test('normalizes a valid production field package',()=>{const result=validator.normalize(base(),'founder');expect(result.package).toMatchObject({evidenceModelVersion:'supplygraph-evidence-v1.12.0',status:'pending_review'});expect(result.facts[0]).toMatchObject({factType:'price',factKnown:true,currency:'AED'});});
  test.each([
    [base({sourceType:'arbitrary'}),'SUPPLYGRAPH_EVIDENCE_SOURCE_TYPE_INVALID'],
    [base({sourceReference:'https://user:pass@supplier.example/x'}),'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_SECRET'],
    [base({sourceReference:'https://supplier.example/x?access_token=secret'}),'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_SECRET'],
    [base({observedAt:'2026-07-14T00:00:00Z'}),'SUPPLYGRAPH_EVIDENCE_FUTURE_OBSERVATION'],
    [base({validUntil:'2026-07-11T00:00:00Z'}),'SUPPLYGRAPH_EVIDENCE_EXPIRY_INVALID'],
    [base({facts:[]}),'SUPPLYGRAPH_EVIDENCE_FACTS_EMPTY'],
    [base({facts:[1,2,3,4].map((_,i)=>({supplierCatalogItemId:`item-${i}`,factType:'lead_time_days',value:{value:2}}))}),'SUPPLYGRAPH_EVIDENCE_FACTS_LIMIT'],
    [base({verificationStatus:'unverified'}),'SUPPLYGRAPH_EVIDENCE_PRODUCTION_UNVERIFIED'],
    [base({verificationStatus:'human_verified'}),'SUPPLYGRAPH_EVIDENCE_REVIEWER_REQUIRED'],
  ])('rejects unsafe package %#',(input,code)=>expect(()=>validator.normalize(input)).toThrow(expect.objectContaining({code})));
  test('validates all fact schemas and explicit unknown',()=>{const facts=[
    {supplierCatalogItemId:'i1',factType:'stock_status',value:{value:'in_stock'}},
    {supplierCatalogItemId:'i1',factType:'stock_quantity',value:{quantity:5},unit:'case'},
    {supplierCatalogItemId:'i1',factType:'minimum_order',value:{quantity:2},unit:'case'},
    {supplierCatalogItemId:'i1',factType:'lead_time_days',value:{value:3}},
    {supplierCatalogItemId:'i1',factType:'shelf_life_days',value:{value:300}},
    {supplierCatalogItemId:'i1',factType:'temperature_zone',value:{value:'ambient'}},
  ];const wide=new SupplierEvidenceValidator({maxFacts:10,now:()=>Date.parse('2026-07-13T00:00:00Z')});expect(wide.normalize(base({facts})).facts).toHaveLength(6);expect(wide.normalize(base({facts:[{supplierCatalogItemId:'i1',factType:'stock_status',factKnown:false}]})).facts[0].factValue).toBeNull();});
  test('rejects duplicate and contradictory stock facts',()=>{expect(()=>validator.normalize(base({facts:[{supplierCatalogItemId:'i1',factType:'lead_time_days',value:{value:2}},{supplierCatalogItemId:'i1',factType:'lead_time_days',value:{value:3}}]}))).toThrow(expect.objectContaining({code:'SUPPLYGRAPH_EVIDENCE_DUPLICATE_FACT'}));const wide=new SupplierEvidenceValidator({maxFacts:10,now:()=>Date.parse('2026-07-13T00:00:00Z')});expect(()=>wide.normalize(base({facts:[{supplierCatalogItemId:'i1',factType:'stock_status',value:{value:'out_of_stock'}},{supplierCatalogItemId:'i1',factType:'stock_quantity',value:{quantity:2},unit:'case'}]}))).toThrow(expect.objectContaining({code:'SUPPLYGRAPH_EVIDENCE_STOCK_CONFLICT'}));});
});
