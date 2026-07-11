const CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES = Object.freeze([
  '/api/control-tower/frontend/v1',
  '/api/intelligence',
]);

const usesControlTowerFrontendCors = (path) => CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES
  .some((prefix) => String(path || '').startsWith(prefix));

module.exports = {
  CONTROL_TOWER_FRONTEND_ROUTE_PREFIXES,
  usesControlTowerFrontendCors,
};
