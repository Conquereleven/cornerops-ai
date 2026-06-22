const ECOSYSTEM_SERVICE_IDS = Object.freeze([
  'clawsweeper',
  'crabox',
  'octopool',
  'crabfleet',
  'clawhub',
  'clickclack',
  'lobster',
]);

const ECOSYSTEM_MODES = Object.freeze([
  'document_only',
  'dry_run',
  'read_only',
  'approval_required',
]);

module.exports = {
  ECOSYSTEM_MODES,
  ECOSYSTEM_SERVICE_IDS,
};
