const makeContract = ({
  entity,
  sourceReference = 'mock/template',
  canonicalFields,
  requiredFields,
  optionalFields,
  piiClassification = 'low',
  sourceMode = 'missing_config',
  confidence,
  warnings = [],
}) => {
  const missingFields = sourceMode === 'missing_config' ? [...requiredFields] : [];
  return {
    entity,
    source: 'cornermex_lovable',
    sourceReference,
    canonicalFields,
    requiredFields,
    optionalFields,
    piiClassification,
    confidence: confidence || (sourceMode === 'mock' ? 'medium' : 'low'),
    missingFields,
    warnings: [...new Set([
      ...warnings,
      ...(sourceMode === 'missing_config' ? ['Lovable/Supabase schema is not configured; contract is a template.'] : []),
    ])],
    sourceMode,
  };
};

module.exports = { makeContract };
