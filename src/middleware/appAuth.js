const express = require('express');
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
    : memberships[0];
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

const createAppAuth = (runtime = identityRuntime) => {
  const authenticate = createAuthenticate(runtime);
  authenticate.isAppBoundary = true; // lets the route inventory recognise guarded routers
  const resolveWorkspace = createResolveWorkspace(runtime);
  const requirePolicy = createRequirePolicy(runtime);
  return {
    authenticate,
    resolveWorkspace,
    requirePolicy,
    // Full boundary for one policy.
    guard: (policy) => [authenticate, resolveWorkspace, requirePolicy(policy)],
    // Router whose every route sits behind the boundary. Reads need any active
    // membership; a mutation without an explicit policy cannot be registered.
    policyRouter: () => {
      const router = express.Router();
      router.use(authenticate, resolveWorkspace, (req, res, next) => (
        ['GET', 'HEAD'].includes(req.method) ? requirePolicy('read')(req, res, next) : next()
      ));
      for (const method of ['post', 'put', 'patch', 'delete']) {
        const register = router[method].bind(router);
        router[method] = (path, ...handlers) => {
          if (!handlers[0]?.executionPolicy) {
            throw new Error(`Route ${method.toUpperCase()} ${path} has no execution policy.`);
          }
          return register(path, ...handlers);
        };
      }
      return router;
    },
  };
};

const appAuth = createAppAuth();

module.exports = { ...appAuth, bearerToken, createAppAuth };
