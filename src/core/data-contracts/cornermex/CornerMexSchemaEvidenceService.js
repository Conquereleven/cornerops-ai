const {
  CORNERMEX_CONTRACT_TABLE_MAP,
  CORNERMEX_SCHEMA_EVIDENCE_SOURCES,
  PII_COLUMN_HINTS,
} = require('./cornerMexSchemaEvidenceTypes');

const classifyPii = (columnName = '') => {
  const normalized = String(columnName).toLowerCase();
  if (['name_en', 'name_es', 'name_ar', 'product_name', 'store_name'].includes(normalized)) {
    return 'not_pii';
  }
  return PII_COLUMN_HINTS.some((hint) => normalized.includes(hint)) ? 'pii_candidate' : 'not_pii';
};

const makeEvidence = ({
  sourceFilePath,
  tableName,
  columns = [],
  foreignKeys = [],
  enums = [],
  rls = [],
  relatedContract = 'unknown',
  confidenceScore = 0.5,
  warnings = [],
  source = CORNERMEX_SCHEMA_EVIDENCE_SOURCES.MIGRATION,
}) => ({
  source,
  sourceFilePath,
  tableName,
  columns: columns.map((column) => ({
    name: column.name,
    type: column.type || 'unknown',
    nullable: column.nullable === undefined ? 'unknown' : Boolean(column.nullable),
    requiredEvidence: column.nullable === false ? 'not_null_or_required_type' : 'unknown',
    piiClassification: classifyPii(column.name),
  })),
  primaryKeyEvidence: columns.some((column) => column.name === 'id') ? ['id'] : [],
  foreignKeyEvidence: foreignKeys,
  enumEvidence: enums,
  rlsEvidence: rls,
  piiClassificationCandidate: columns.some((column) => classifyPii(column.name) === 'pii_candidate')
    ? 'contains_pii_candidates'
    : 'no_obvious_pii_candidates',
  relatedCornerMexContract: relatedContract,
  confidenceScore,
  warnings,
});

class CornerMexSchemaEvidenceService {
  constructor({ migrationDiscoveryService } = {}) {
    this.migrationDiscoveryService = migrationDiscoveryService;
  }

  async getEvidence() {
    const discovery = this.migrationDiscoveryService?.discover
      ? await this.migrationDiscoveryService.discover()
      : { schemaEvidence: [], mode: 'missing_config' };
    return {
      mode: discovery.mode,
      sourceMode: discovery.sourceMode,
      migrationFiles: discovery.migrationFiles || [],
      tables: discovery.tables || [],
      schemaEvidence: discovery.schemaEvidence || [],
      mappedContracts: this.mapContracts(discovery.schemaEvidence || []),
      warnings: discovery.warnings || [],
    };
  }

  mapContracts(schemaEvidence = []) {
    return Object.entries(CORNERMEX_CONTRACT_TABLE_MAP).map(([contract, tables]) => {
      const evidence = schemaEvidence.filter((item) => tables.includes(item.tableName));
      return {
        contract,
        sourceTables: [...new Set(evidence.map((item) => item.tableName))],
        mappedColumns: [...new Set(evidence.flatMap((item) => item.columns.map((column) => column.name)))],
        piiFields: [...new Set(evidence.flatMap((item) => item.columns)
          .filter((column) => column.piiClassification === 'pii_candidate')
          .map((column) => column.name))],
        rlsNotes: [...new Set(evidence.flatMap((item) => item.rlsEvidence || []))],
        confidence: evidence.length ? 'medium' : 'low',
        warnings: evidence.length ? [] : ['No migration/generated type evidence mapped for this contract.'],
      };
    });
  }
}

module.exports = { CornerMexSchemaEvidenceService, classifyPii, makeEvidence };
