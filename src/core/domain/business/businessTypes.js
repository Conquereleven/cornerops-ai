const makeMeta = ({ source = 'mock', rowCount = 0, truncated = false, warnings = [] } = {}) => ({
  source: source === 'real_read_only' ? 'real_read_only' : 'mock',
  readOnly: true,
  rowCount,
  truncated: Boolean(truncated),
  warnings: [...warnings],
});

const applyDataContract = (row, mapping) => {
  if (!mapping || mapping.confidence === 'low') return { ...row };
  return Object.fromEntries(mapping.fields
    .filter((field) => field.sourceField)
    .map((field) => [field.canonicalField, row[field.sourceField]]));
};

module.exports = {
  applyDataContract,
  makeMeta,
};
