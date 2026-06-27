const SETUP_STATUS = Object.freeze({
  OK: 'ok',
  WARNING: 'warning',
  BLOCKED: 'blocked',
});

const statusRank = (status) => ({
  [SETUP_STATUS.OK]: 0,
  [SETUP_STATUS.WARNING]: 1,
  [SETUP_STATUS.BLOCKED]: 2,
}[status] ?? 2);

const worstStatus = (checks = []) => checks.reduce((current, check) =>
  (statusRank(check.status) > statusRank(current) ? check.status : current), SETUP_STATUS.OK);

const createCheck = ({ id, label, status, message, fix }) => ({
  id,
  label,
  status,
  message,
  fix,
});

module.exports = {
  SETUP_STATUS,
  createCheck,
  statusRank,
  worstStatus,
};
