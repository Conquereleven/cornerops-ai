const { sha256 } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');

class SupplierEvidencePreviewBuilder {
  constructor({ resolver } = {}) { this.resolver = resolver; }

  build({ packageRecord, facts, catalogById, legacyOffersByCatalogId, appliedObservationsByCatalogId }) {
    const items = [];
    const allConflicts = [];
    const grouped = new Map();
    facts.forEach((fact) => { const list = grouped.get(fact.supplierCatalogItemId) || []; list.push({ ...fact, proposed: true }); grouped.set(fact.supplierCatalogItemId, list); });
    for (const [catalogItemId, proposed] of grouped.entries()) {
      const input = { catalogItem: catalogById.get(catalogItemId), legacyOffer: legacyOffersByCatalogId.get(catalogItemId), observations: appliedObservationsByCatalogId.get(catalogItemId) || [] };
      const current = this.resolver.resolve(input);
      const projected = packageRecord.evidenceScope === 'production'
        ? this.resolver.resolve({ ...input, includeProposed: proposed }) : current;
      const changes = proposed.map((fact) => {
        const before = current.fields[fact.factType]; const after = projected.fields[fact.factType];
        const changed = stable({ known: before.known, value: before.value, unit: before.unit, currency: before.currency })
          !== stable({ known: after.known, value: after.value, unit: after.unit, currency: after.currency });
        return { factType: fact.factType, before, proposed: fact, after, changed,
          transition: !before.known && after.known ? 'unknown_to_known' : before.known && !after.known ? 'known_to_unknown' : changed ? 'changed' : 'unchanged' };
      });
      allConflicts.push(...projected.conflicts.map((conflict) => ({ catalogItemId, ...conflict })));
      items.push({ catalogItemId, current, projected, changes });
    }
    const productionResolutionWouldChange = packageRecord.evidenceScope === 'production' && items.some((item) => item.changes.some((change) => change.changed));
    const projectedEvidenceWatermark = sha256(stable(items.map((item) => ({ id: item.catalogItemId, watermark: item.projected.watermark })).sort((a, b) => a.id.localeCompare(b.id))));
    const previewFingerprint = sha256(stable({ packageId: packageRecord.id, packageVersion: packageRecord.version,
      evidenceScope: packageRecord.evidenceScope, projectedEvidenceWatermark,
      conflicts: allConflicts, changes: items.flatMap((item) => item.changes.map((change) => ({ catalogItemId: item.catalogItemId, factType: change.factType, transition: change.transition, after: change.after }))),
    }));
    return { packageId: packageRecord.id, packageVersion: packageRecord.version, evidenceScope: packageRecord.evidenceScope,
      approvalState: packageRecord.approvalStatus || 'pending', previewFingerprint, projectedEvidenceWatermark,
      productionResolutionWouldChange, conflicts: allConflicts, items, readOnly: true, externalActionsBlocked: true };
  }
}

module.exports = { SupplierEvidencePreviewBuilder };
