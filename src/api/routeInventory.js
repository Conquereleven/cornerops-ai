// Single source of truth for API route classification. The security tests and
// docs/security/api-route-inventory-v1.md are both derived from this file, so
// an unclassified route fails the build instead of shipping open.

const CLASSES = Object.freeze({
  PUBLIC: 'PUBLIC',
  WORKSPACE: 'AUTHENTICATED WORKSPACE',
  FOUNDER: 'FOUNDER / CONTROLLED',
  INTERNAL: 'INTERNAL SERVICE',
  WEBHOOK: 'WEBHOOK / PROVIDER CALLBACK',
});

const LEGACY_SERVICE_REPORTS = new Set([
  'status', 'beta', 'data-contracts', 'schema-discovery', 'security', 'approvals', 'audit-summary',
].map((name) => `/api/control-tower/${name}`));

const mountPath = (layer) => {
  if (layer.regexp.fast_slash) return '';
  return layer.regexp.source
    .replace(/^\^/, '')
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
    .replace(/\\([/.])/g, '$1');
};

const policyOf = (handlers) => handlers.map((handler) => handler.executionPolicy).filter(Boolean).pop() || null;

// Lists every route mounted on an Express 4 app with the execution policy
// declared on the route itself.
const listRoutes = (app) => {
  const routes = [];
  const walk = (stack, prefix, inheritsReadPolicy) => {
    let policyRouter = inheritsReadPolicy;
    for (const layer of stack) {
      if (layer.route) {
        const handlers = layer.route.stack.map((item) => item.handle);
        for (const method of Object.keys(layer.route.methods)) {
          const verb = method.toUpperCase();
          const declared = policyOf(handlers);
          routes.push({
            method: verb,
            path: `${prefix}${layer.route.path === '/' ? '' : layer.route.path}` || '/',
            policy: declared || (policyRouter && verb === 'GET' ? 'read' : null),
          });
        }
      } else if (layer.name === 'router' && layer.handle.stack) {
        walk(layer.handle.stack, `${prefix}${mountPath(layer)}`, false);
      } else if (layer.handle.isAppBoundary) {
        policyRouter = true;
      }
    }
  };
  walk(app._router.stack, '', false);
  return routes.filter((route) => route.path.startsWith('/api') || route.path === '/health');
};

const classify = ({ method, path, policy }) => {
  if (method === 'GET' && (path === '/health' || path === '/api/health')) return CLASSES.PUBLIC;
  if (path.startsWith('/api/webhooks/') || path === '/api/github/webhook' || path.startsWith('/api/operator-channel/')) return CLASSES.WEBHOOK;
  if (path.startsWith('/api/internal/') || path.startsWith('/api/openclaw/') || path === '/api/ivr') return CLASSES.INTERNAL;
  if (path.startsWith('/api/operator/') && path !== '/api/operator/v0.8/ask') return CLASSES.INTERNAL;
  if (LEGACY_SERVICE_REPORTS.has(path)) return CLASSES.INTERNAL;
  if (path.startsWith('/api/intelligence') || path.startsWith('/api/control-tower/frontend/v1')) {
    return method === 'GET' ? CLASSES.WORKSPACE : CLASSES.FOUNDER;
  }
  if (method === 'GET' && path === '/api/app/session') return CLASSES.WORKSPACE;
  if (policy === 'sensitive_config' || policy === 'external_action') return CLASSES.FOUNDER;
  if (policy === 'read' || policy === 'internal_write') return CLASSES.WORKSPACE;
  if (path.startsWith('/api/control-tower/v') && method === 'GET') return CLASSES.WORKSPACE;
  return null; // Unclassified: the inventory test fails.
};

const authentication = (route, routeClass) => {
  if (routeClass === CLASSES.PUBLIC) return 'none';
  if (routeClass === CLASSES.INTERNAL) return 'x-internal-api-key';
  if (routeClass === CLASSES.WEBHOOK) return 'provider signature / secret';
  if (route.path.startsWith('/api/intelligence') || route.path.startsWith('/api/control-tower/frontend/v1')) {
    return route.method === 'GET'
      ? 'workspace session (viewer+) or operator token'
      : 'founder-action token; founder role when session';
  }
  if (route.path === '/api/app/session') return 'session identity; memberships are reported, not required';
  const console = route.path.startsWith('/api/control-tower/v') || route.path.startsWith('/api/actions') || route.path === '/api/operator/v0.8/ask';
  return `workspace session, policy ${route.policy || 'read'}${console ? ' + local console guard' : ''}`;
};

const buildInventory = (app) => listRoutes(app)
  .map((route) => {
    const routeClass = classify(route);
    return { ...route, class: routeClass, authentication: routeClass ? authentication(route, routeClass) : 'UNCLASSIFIED' };
  })
  .sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method));

const renderInventoryTable = (inventory) => Object.values(CLASSES).map((routeClass) => {
  const rows = inventory.filter((route) => route.class === routeClass);
  return [`### ${routeClass} (${rows.length})`, '', '| Method | Path | Authentication |', '|---|---|---|',
    ...rows.map((route) => `| ${route.method} | \`${route.path}\` | ${route.authentication} |`), ''].join('\n');
}).join('\n');

module.exports = { CLASSES, buildInventory, classify, listRoutes, renderInventoryTable };
