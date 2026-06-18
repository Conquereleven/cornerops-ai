const LEAD_STATUSES = Object.freeze([
  'new',
  'contacted',
  'qualified',
  'quoted',
  'negotiating',
  'won',
  'lost',
  'stale',
  'unknown',
]);

const LEAD_SOURCES = Object.freeze([
  'website',
  'whatsapp',
  'instagram',
  'email',
  'manual',
  'b2b_outreach',
  'marketplace',
  'unknown',
]);

module.exports = {
  LEAD_STATUSES,
  LEAD_SOURCES,
};
