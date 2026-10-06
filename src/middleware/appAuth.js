const express = require('express');
const env = require('../config/env');
const identityRuntime = require('../core/identity/runtime');
const { POLICIES, isSlug, roleSatisfies } = require('../core/identity/policy');

const bearerToken = (req) => req.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] || '';

const deny = (res, status, code, message) => res.status(status).json({ error: true, code, message });

const correlationId = (req) => req.get('x-correlation-id') || req.get('x-request-id') || null;

const auditDenied = async (runtime, req, code) => {
  try {
    await runtime.auditStore?.recordAuditEvent?.({
      eventType: 'app_authorization_denied',
      entityType: 'app_boundary',
      actorType: 'user',
      actorId: req.appIdentity?.userId || null,
      correlationId: correlationId(req),
      metadata: { code, method: req.method, route: `${req.baseUrl}${req.route?.path || ''}`, workspaceId: req.workspace?.id || null },
    });
  } catch (_error) { /* Denial never depends on audit persistence. */ }
};

// Step 1: who is calling. Sets req.appIdentity = { userId }.
const createAuthenticate = (runtime = identityRuntime) => async (req, res, next) => {
  if (req.appIdentity) return next();
  const token = bearerToken(req);
  if (!token) return deny(res, 401, 'APP_AUTH_REQUIRED', 'Sign in is required.');
  try {
    const identity = await runtime.verifier.verify(token);
    req.appIdentity = { userId: identity.userId };
    return next();
  } catch (error) {
    const status = error.statusCode === 401 ? 401 : 503;
    return deny(res, status, error.code || 'APP_AUTH_PROVIDER_UNAVAILABLE', status === 401 ? 'Session is invalid or expired.' : 'Authentication is unavailable.');
  }
};

// Step 2: which workspace, from server-side membership only. Sets req.workspace.
const createResolveWorkspace = (runtime = identityRuntime) => async (req, res, next) => {
  if (req.workspace) return next();
  let memberships;
  try {
    memberships = await runtime.workspaceStore.listActiveMemberships(req.appIdentity.userId);
  } catch (_error) {
    return deny(res, 503, 'WORKSPACE_LOOKUP_UNAVAILABLE', 'Workspace authorization is unavailable.');
  }
  req.appMemberships = memberships;
  if (!memberships.length) {
    await auditDenied(runtime, req, 'WORKSPACE_ACCESS_DENIED');
    return deny(res, 403, 'WORKSPACE_ACCESS_DENIED', 'No active workspace membership.');
  }
  const requested = req.get('x-cornerops-workspace');
  const selected = requested
    ? (isSlug(requested) ? memberships.find((item) => item.slug === requested) : null)
    : (memberships.find((item) => item.slug === env.corneropsCompanyWorkspaceSlug) || memberships[0]);
  if (!selected) {
    await auditDenied(runtime, req, 'WORKSPACE_ACCESS_DENIED');
    return deny(res, 403, 'WORKSPACE_ACCESS_DENIED', 'No active membership for the requested workspace.');
  }
  req.workspace = { id: selected.id, slug: selected.slug, name: selected.name, role: selected.role };
  return next();
};

// Step 3: is the role sufficient for this route's policy.
const createRequirePolicy = (runtime = identityRuntime) => (policy) => {
  if (!POLICIES[policy]) throw new Error(`Unknown execution policy: ${policy}`);
  const handler = async (req, res, next) => {
    if (!req.workspace || !roleSatisfies(req.workspace.role, policy)) {
      await auditDenied(runtime, req, 'WORKSPACE_ROLE_INSUFFICIENT');
      return deny(res, 403, 'WORKSPACE_ROLE_INSUFFICIENT', 'Your role does not allow this action.');
    }
    return next();
  };
  handler.executionPolicy = policy;
  return handler;
};

// Step 2b: routes that are not workspace-scoped in storage (legacy operations
// data, configuration, Control Tower) belong to the company workspace only.
// Membership of any other workspace never opens them.
const createRequireScope = (runtime = identityRuntime) => (scope) => {
  if (!['company', 'workspace'].includes(scope)) throw new Error(`Unknown workspace scope: ${scope}`);
  return async (req, res, next) => {
    if (scope === 'company' && req.workspace?.slug !== env.corneropsCompanyWorkspaceSlug) {
      await auditDenied(runtime, req, 'WORKSPACE_SCOPE_DENIED');
      return deny(res, 403, 'WORKSPACE_SCOPE_DENIED', 'This area is not available in your workspace.');
    }
    return next();
  };
};

const createAppAuth = (runtime = identityRuntime) => {
  const authenticate = createAuthenticate(runtime);
  authenticate.isAppBoundary = true; // lets the route inventory recognise guarded routers
  const resolveWorkspace = createResolveWorkspace(runtime);
  const requirePolicy = createRequirePolicy(runtime);
  const requireScope = createRequireScope(runtime);
  return {
    authenticate,
    resolveWorkspace,
    requirePolicy,
    // Full boundary for one policy. scope 'company' unless the route stores its
    // data per workspace.
    guard: (policy, { scope = 'company' } = {}) => [authenticate, resolveWorkspace, requireScope(scope), requirePolicy(policy)],
    // Router whose every route sits behind the boundary. Reads need any active
    // membership; a mutation without an explicit policy cannot be registered.
    policyRouter: ({ scope = 'company' } = {}) => {
      const router = express.Router();
      router.use(authenticate, resolveWorkspace, requireScope(scope), (req, res, next) => (
        ['GET', 'HEAD'].includes(req.method) ? requirePolicy('read')(req, res, next) : next()
      ));
      const MUTATIONS = ['post', 'put', 'patch', 'delete'];
      const assertPolicy = (method, path, handlers) => {
        if (!handlers[0]?.executionPolicy) {
          throw new Error(`Route ${method.toUpperCase()} ${path} has no execution policy.`);
        }
      };
      // Express registers every verb through router.route(), so the check lives
      // there and covers router.post(...) and router.route(...).post(...) alike.
      const createRoute = router.route.bind(router);
      router.route = (path) => {
        const route = createRoute(path);
        for (const method of MUTATIONS) {
          const register = route[method].bind(route);
          route[method] = (...handlers) => { assertPolicy(method, path, handlers); return register(...handlers); };
        }
        route.all = () => { throw new Error(`Route ALL ${path} is not allowed on a policy router.`); };
        return route;
      };
      router.all = (path) => { throw new Error(`Route ALL ${path} is not allowed on a policy router.`); };
      return router;
    },
  };
};

const appAuth = createAppAuth();

module.exports = { ...appAuth, bearerToken, createAppAuth };
