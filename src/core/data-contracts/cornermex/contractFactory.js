const makeContract = ({
  entity,
  sourceReference = 'mock/template',
  canonicalFields,
  requiredFields,
  optionalFields,
  piiClassification = 'low',
  sourceMode = 'missing_config',
  confidence,
  schemaEvidence,
  warnings = [],
}) => {
  const missingFields = sourceMode === 'missing_config' ? [...requiredFields] : [];
  const inferredConfidence = sourceMode === 'blocked_unsafe_config'
    ? 'blocked'
    : sourceMode === 'real_read_only'
    ? 'high'
    : ['repo_discovered', 'schema_discovered'].includes(sourceMode) ? 'medium' : 'low';
  const entityEvidence = schemaEvidence
    ? schemaEvidence.filter((item) => item.relatedCornerMexContract === entity)
    : [];
  return {
    entity,
    source: 'cornermex_lovable',
    sourceReference,
    canonicalFields,
    requiredFields,
    optionalFields,
    mappedSourceTables: [...new Set(entityEvidence.map((item) => item.tableName))],
    mappedColumns: [...new Set(entityEvidence.flatMap((item) => item.columns.map((column) => column.name)))],
    piiFields: [...new Set(entityEvidence
      .flatMap((item) => item.columns)
      .filter((column) => column.piiClassification === 'pii_candidate')
      .map((column) => column.name))],
    rlsNotes: [...new Set(entityEvidence.flatMap((item) => item.rlsEvidence || []))],
    piiClassification,
    confidence: confidence || inferredConfidence,
    missingFields,
    warnings: [...new Set([
      ...warnings,
      ...(sourceMode === 'missing_config' ? ['Lovable/Supabase schema is not configured; contract is a template.'] : []),
      ...(sourceMode === 'schema_discovered' && !entityEvidence.length ? ['No migration evidence mapped for this contract.'] : []),
      ...(sourceMode === 'blocked_unsafe_config' ? ['Unsafe Supabase config blocks contract readiness.'] : []),
    ])],
    sourceMode,
  };
};

module.exports = { makeContract };
