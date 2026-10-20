const CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES = Object.freeze([
  '/api/control-tower/frontend/v1',
  '/api/intelligence',
]);

const usesControlTowerFrontendCors = (path) => CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES
  .some((prefix) => new RegExp(`^${prefix}(?:/|$)`, 'i').test(String(path || '')));

module.exports = {
  CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES,
  usesControlTowerFrontendCors,
};
