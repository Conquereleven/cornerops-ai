const {
  CLASSIFICATION,
  CommercialProductionCandidateService,
  VERSION,
} = require('../src/core/commercial/CommercialProductionCandidateService');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const account = (index) => ({
  accountId: `account-${index}`,
  legalName: 'pending_verification',
  displayName: `Public Account ${index}`,
  accountType: 'restaurant',
  emirate: 'Dubai',
  city: 'Dubai',
  channel: 'B2B',
  contactStatus: 'pending_verification',
  commercialStatus: 'pending_verification',
  owner: 'pending_verification',
  priority: 'A',
  paymentTerms: 'pending_verification',
  deliveryTerms: 'pending_verification',
  notes: 'Candidate only; no contact authorized.',
  source: `docs/evidence/account-${index}.json`,
  evidenceSource: `docs/evidence/account-${index}.json`,
  evidenceDate: '2026-07-13T00:00:00.000Z',
  verificationStatus: 'founder_attested',
  updatedAt: '2026-07-13T00:00:00.000Z',
});
const sku = (index) => ({
  skuId: `sku-${index}`,
  name: `Public SKU ${index}`,
  brand: 'unknown',
  category: 'snacks',
  supplier: 'Intermex UAE',
  supplierSku: 'pending_verification',
  unit: 'unknown',
  casePack: 'unknown',
  costCurrency: 'unknown',
  unitCost: 'unknown',
  sellingCurrency: 'unknown',
  suggestedB2BPrice: 'pending_verification',
  minimumOrderQuantity: 'pending_verification',
  inventoryStatus: 'unknown',
  registrationStatus: 'pending_verification',
  commercialStatus: 'pending_verification',
  source: `docs/evidence/sku-${index}.json`,
  evidenceSource: `docs/evidence/sku-${index}.json`,
  evidenceDate: '2026-07-13T00:00:00.000Z',
  verificationStatus: 'source_verified',
  owner: 'pending_verification',
  updatedAt: '2026-07-13T00:00:00.000Z',
});
const validPack = () => ({
  classification: CLASSIFICATION,
  version: VERSION,
  accounts: Array.from({ length: 10 }, (_, index) => account(index)),
  skus: Array.from({ length: 12 }, (_, index) => sku(index)),
});

describe('CommercialProductionCandidateService v1.17B', () => {
  const service = new CommercialProductionCandidateService();

  test('validates an exact production candidate without importing it', () => {
    const result = service.validate(validPack());
    expect(result).toMatchObject({
      valid: true,
      status: 'production_candidate_validated_not_imported',
      counts: { accounts: 10, skus: 12 },
      writesPerformed: false,
      importAuthorized: false,
    });
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  test('checksum is stable across input row order', () => {
    const first = validPack();
    const second = validPack();
    second.accounts.reverse();
    second.skus.reverse();
    expect(service.validate(first).checksum).toBe(service.validate(second).checksum);
  });

  test('rejects demo classification, invalid unknown markers and missing evidence', () => {
    const pack = validPack();
    pack.classification = 'COMMERCIAL_DEMO_DATA_NOT_PRODUCTION';
    pack.accounts[0].legalName = 'TBD';
    delete pack.skus[0].evidenceSource;
    const result = service.validate(pack);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'PRODUCTION_CLASSIFICATION_REQUIRED',
      'UNKNOWN_MARKER_INVALID',
      'EVIDENCE_FIELD_REQUIRED',
    ]));
  });

  test('rejects private contact data in repository candidates', () => {
    const pack = validPack();
    pack.accounts[0].notes = 'Contact private.person@example.test';
    const result = service.validate(pack);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'PRIVATE_CONTACT_DATA_NOT_ALLOWED' }));
  });

  test('validates the repository candidate and pins source-backed counts', () => {
    const candidate = JSON.parse(fs.readFileSync(path.join(
      __dirname,
      '../docs/commercial/input-packs/commercial-production-candidate-v1.17b.json',
    ), 'utf8'));
    expect(service.validate(candidate)).toMatchObject({
      valid: true,
      checksum: '2dfbad6640d44021877a6e7247f97592f2540f2fa94ab605754072921d2b06ea',
      counts: { accounts: 10, skus: 12 },
      unknownFieldCount: 220,
      sourceBackedFieldCount: 234,
    });
  });

  test('rules and canary remain inactive and reference only candidate records', () => {
    const read = (relative) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'));
    const schema = read('docs/commercial/input-packs/commercial-input-v1.17b.schema.json');
    const rules = read('docs/commercial/rules/commercial-rules-v1.17b.json');
    const canary = read('docs/commercial/canary/commercial-canary-v1.17b.json');
    const candidate = read('docs/commercial/input-packs/commercial-production-candidate-v1.17b.json');

    expect(schema.properties.classification.const).toBe(CLASSIFICATION);
    expect(rules).toMatchObject({ active: false, safety: {
      externalMessagesAllowed: false,
      paymentCaptureAllowed: false,
      fulfillmentExecutionAllowed: false,
      cornerMexWritesAllowed: false,
    } });
    expect(canary).toMatchObject({ importAuthorized: false, activationAuthorized: false });
    expect(canary.accounts).toHaveLength(2);
    expect(canary.skus).toHaveLength(3);
    expect(canary.accounts.every((id) => candidate.accounts.some((record) => record.accountId === id))).toBe(true);
    expect(canary.skus.every((id) => candidate.skus.some((record) => record.skuId === id))).toBe(true);
  });

  test('checksum manifest pins every production input-pack artifact', () => {
    const root = path.join(__dirname, '../docs/commercial/input-packs');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'checksums-v1.17b.json'), 'utf8'));
    Object.entries(manifest.files).forEach(([file, expected]) => {
      const actual = createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
      expect(actual).toBe(expected);
    });
  });
});
