const { validate } = require('./salesSchema');

// Spreadsheet header -> schema field. See docs/product/sales-crm-import-mapping-v1.md.
const COLUMN_MAP = Object.freeze({
  company: ['account', 'name'], 'company name': ['account', 'name'], account: ['account', 'name'],
  website: ['account', 'website'], segment: ['account', 'segment'], industry: ['account', 'segment'],
  source: ['account', 'source'], priority: ['account', 'priority'], 'fit score': ['account', 'fitScore'],
  status: ['account', 'status'], 'problem hypothesis': ['account', 'problemHypothesis'], pain: ['account', 'problemHypothesis'],
  'contact name': ['contact', 'name'], contact: ['contact', 'name'], title: ['contact', 'title'], role: ['contact', 'title'],
  email: ['contact', 'email'], phone: ['contact', 'phone'], linkedin: ['contact', 'linkedinUrl'], 'linkedin url': ['contact', 'linkedinUrl'],
  'contact confidence': ['contact', 'contactConfidence'],
  stage: ['opportunity', 'stage'], 'next step': ['opportunity', 'nextStep'], 'next step date': ['opportunity', 'nextStepAt'],
  'estimated value': ['opportunity', 'estimatedValue'], currency: ['opportunity', 'currency'],
  'qualification score': ['opportunity', 'qualificationScore'], 'solution hypothesis': ['opportunity', 'solutionHypothesis'],
});
const NUMERIC = new Set(['fitScore', 'qualificationScore', 'estimatedValue']);
const MAX_ROWS = 500;

const parseCsv = (text) => {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
};

// Validation only. Reports what an import would create and why rows would be
// rejected. It writes nothing and echoes no cell values back.
const previewCsv = (text) => {
  const [header = [], ...lines] = parseCsv(String(text || ''));
  const mapping = header.map((name) => COLUMN_MAP[name.trim().toLowerCase()] || null);
  const unmappedColumns = header.filter((_name, index) => !mapping[index]).map((name) => name.trim()).filter(Boolean);
  const result = {
    writesPerformed: false,
    rows: lines.length,
    truncated: lines.length > MAX_ROWS,
    mappedColumns: header.filter((_name, index) => mapping[index]).map((name, index) => ({ column: name.trim(), field: mapping.filter(Boolean)[index].join('.') })),
    unmappedColumns,
    wouldCreate: { accounts: 0, contacts: 0, opportunities: 0 },
    rejected: [],
  };
  if (!mapping.some((target) => target && target.join('.') === 'account.name')) {
    result.rejected.push({ row: 1, errors: { company: 'a company column is required' } });
    return result;
  }
  const accounts = new Set();
  lines.slice(0, MAX_ROWS).forEach((line, lineIndex) => {
    const inputs = { account: {}, contact: {}, opportunity: {} };
    mapping.forEach((target, index) => {
      const raw = (line[index] || '').trim();
      if (!target || !raw) return;
      const [entity, field] = target;
      inputs[entity][field] = NUMERIC.has(field) ? Number(raw.replace(/,/g, '')) : (field === 'priority' || field === 'stage' || field === 'status' || field === 'contactConfidence' ? raw.toLowerCase() : raw);
    });
    const errors = {};
    for (const entity of ['account', 'contact', 'opportunity']) {
      if (entity !== 'account' && !Object.keys(inputs[entity]).length) continue;
      try { validate(entity, inputs[entity]); } catch (error) {
        for (const [field, message] of Object.entries(error.fields || {})) errors[`${entity}.${field}`] = message;
      }
    }
    if (Object.keys(errors).length) { result.rejected.push({ row: lineIndex + 2, errors }); return; }
    const key = inputs.account.name.toLowerCase();
    if (!accounts.has(key)) { accounts.add(key); result.wouldCreate.accounts += 1; }
    if (Object.keys(inputs.contact).length) result.wouldCreate.contacts += 1;
    if (Object.keys(inputs.opportunity).length) result.wouldCreate.opportunities += 1;
  });
  return result;
};

module.exports = { COLUMN_MAP, parseCsv, previewCsv };
