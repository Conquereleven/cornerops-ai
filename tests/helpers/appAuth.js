const request = require('supertest');

// Synthetic identities. Tokens are shaped like session tokens but carry no claims;
// the fake verifier maps them to user ids exactly as the real provider would.
const USERS = Object.freeze({
  founder: '11111111-1111-4111-8111-111111111111',
  operator: '22222222-2222-4222-8222-222222222222',
  viewer: '33333333-3333-4333-8333-333333333333',
  outsider: '44444444-4444-4444-8444-444444444444',
  disabled: '55555555-5555-4555-8555-555555555555',
  other: '66666666-6666-4666-8666-666666666666',
});

const tokenFor = (name) => `test.${name}.session`;
const authHeader = (name = 'founder') => ({ Authorization: `Bearer ${tokenFor(name)}` });

// Resolved at call time so suites that reset the module registry configure the
// runtime instance their freshly loaded app actually uses.
const installTestAppAuth = () => {
  const { MemoryWorkspaceStore, identityError, runtime } = require('../../src/core/identity');
  const workspaceStore = new MemoryWorkspaceStore({
    workspaces: [{ slug: 'cornerops-ai', name: 'CornerOps AI' }, { slug: 'other-workspace', name: 'Other Workspace' }],
  });
  for (const role of ['founder', 'operator', 'viewer']) {
    workspaceStore.grant({ workspaceSlug: 'cornerops-ai', authUserId: USERS[role], role });
  }
  workspaceStore.grant({ workspaceSlug: 'cornerops-ai', authUserId: USERS.disabled, role: 'founder', status: 'disabled' });
  workspaceStore.grant({ workspaceSlug: 'other-workspace', authUserId: USERS.other, role: 'founder' });
  const auditEvents = [];
  const byToken = new Map(Object.entries(USERS).map(([name, userId]) => [tokenFor(name), userId]));
  runtime.configure({
    workspaceStore,
    verifier: {
      configured: true,
      async verify(token) {
        const userId = byToken.get(token);
        if (!userId) throw identityError('Session is invalid or expired.', 'APP_SESSION_INVALID', 401);
        return { userId };
      },
    },
    auditStore: { async recordAuditEvent(event) { auditEvents.push(event); return event; } },
  });
  runtime.testState = { workspaceStore, auditEvents };
  return runtime.testState;
};

// supertest client that sends a workspace session on every request.
const authed = (app, role = 'founder') => {
  if (!require('../../src/core/identity').runtime.testState) installTestAppAuth();
  const base = request(app);
  return new Proxy({}, { get: (_target, method) => (...args) => base[method](...args).set(authHeader(role)) });
};

module.exports = { USERS, authHeader, authed, installTestAppAuth, tokenFor };
