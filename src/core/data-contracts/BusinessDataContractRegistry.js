const { leadDataContract } = require('./LeadDataContract');
const { orderDataContract } = require('./OrderDataContract');
const { quoteDataContract } = require('./QuoteDataContract');
const { auditLogDataContract } = require('./AuditLogDataContract');
const { approvalDataContract } = require('./ApprovalDataContract');

const normalize = (value) => String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

class BusinessDataContractRegistry {
  constructor({ contracts = [
    leadDataContract,
    quoteDataContract,
    orderDataContract,
    auditLogDataContract,
    approvalDataContract,
  ] } = {}) {
    this.contracts = new Map();
    contracts.forEach((contract) => this.register(contract));
    this.mappings = [];
  }

  register(contract) {
    if (!contract?.entity || !contract?.sourceTable) throw new Error('Data contract entity and source table are required.');
    if (this.contracts.has(contract.entity)) throw new Error(`Duplicate data contract: ${contract.entity}`);
    this.contracts.set(contract.entity, contract);
  }

  mapSchema(report = {}) {
    this.mappings = Array.from(this.contracts.values()).map((contract) => {
      const table = (report.tables || []).find((candidate) =>
        normalize(candidate.tableName) === normalize(contract.sourceTable));
      const sourceColumns = table?.columns?.map((column) => column.name) || [];
      const used = new Set();
      const fields = contract.fields.map((field) => {
        const sourceField = sourceColumns.find((column) =>
          field.aliases.some((alias) => normalize(alias) === normalize(column)));
        if (sourceField) used.add(sourceField);
        return {
          canonicalField: field.canonicalField,
          sourceField,
          required: field.required,
          transform: field.transform,
          piiLevel: field.piiLevel || 'none',
        };
      });
      const missingRequiredFields = fields
        .filter((field) => field.required && !field.sourceField)
        .map((field) => field.canonicalField);
      const mappedRequired = fields.filter((field) => field.required && field.sourceField).length;
      const requiredCount = fields.filter((field) => field.required).length;
      const ratio = requiredCount ? mappedRequired / requiredCount : 0;
      const confidence = ratio === 1 ? 'high' : ratio >= 0.6 ? 'medium' : 'low';
      const warnings = [];
      if (!table) warnings.push(`Source table ${contract.sourceTable} was not discovered.`);
      if (missingRequiredFields.length) warnings.push(`Missing required fields: ${missingRequiredFields.join(', ')}.`);
      if (confidence === 'low') warnings.push('Low-confidence mapping must not be used for real reads.');
      return {
        entity: contract.entity,
        sourceName: contract.sourceName,
        sourceTable: contract.sourceTable,
        confidence,
        fields,
        unmappedSourceFields: sourceColumns.filter((column) => !used.has(column)),
        missingRequiredFields,
        warnings,
      };
    });
    return this.listMappings();
  }

  listMappings() {
    return this.mappings.map((mapping) => ({
      ...mapping,
      fields: mapping.fields.map((field) => ({ ...field })),
      warnings: [...mapping.warnings],
      missingRequiredFields: [...mapping.missingRequiredFields],
      unmappedSourceFields: [...mapping.unmappedSourceFields],
    }));
  }

  getMapping(entity) {
    return this.listMappings().find((mapping) => mapping.entity === entity) || null;
  }
}

module.exports = {
  BusinessDataContractRegistry,
  normalize,
};
