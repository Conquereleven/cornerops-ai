process.env.NODE_ENV = 'test';

const request = require('supertest');
const { USERS, authHeader, authed, installTestAppAuth } = require('./helpers/appAuth');
const app = require('../src/app');
const { runtime, identityError, roleSatisfies } = require('../src/core/identity');
const { createAppAuth } = require('../src/middleware/appAuth');
const { createControlTowerFounderActionAuth } = require('../src/api/middleware/controlTowerFounderActionAuth');

// These tests assert the boundary decision only. The data behind a legacy
// route may come from a locally configured source, so 'allowed' means 'not
// refused by the boundary' rather than a specific success status.
const allowed = async (pending) => expect([401, 403, 503]).not.toContain((await pending).statusCode);

describe('workspace authorization boundary', () => {
  let state;
  beforeEach(() => { runtime.reset(); state = installTestAppAuth(); });

  describe('GET /api/app/session', () => {
    test('anonymous and invalid sessions are rejected', async () => {
      expect((await request(app).get('/api/app/session')).statusCode).toBe(401);
      expect((await request(app).get('/api/app/session').set('Authorization', 'Bearer not.a.session')).statusCode).toBe(401);
      expect((await request(app).get('/api/app/session').set('Authorization', 'Bearer opaque-token')).statusCode).toBe(401);
    });

    test('returns only id and server-side memberships', async () => {
      const response = await authed(app, 'founder').get('/api/app/session').expect(200);
      expect(response.body).toEqual({
        authenticated: true,
        user: { id: USERS.founder },
        workspaces: [{ id: expect.any(String), slug: 'cornerops-ai', name: 'CornerOps AI', role: 'founder' }],
      });
      expect(response.headers['cache-control']).toBe('no-store');
    });

    test('an authenticated user without membership gets no workspace', async () => {
      expect((await authed(app, 'outsider').get('/api/app/session').expect(200)).body.workspaces).toEqual([]);
      expect((await authed(app, 'disabled').get('/api/app/session').expect(200)).body.workspaces).toEqual([]);
    });

    test('fails closed when membership lookup or the identity provider is unavailable', async () => {
      runtime.configure({ workspaceStore: { listActiveMemberships: async () => { throw new Error('db down'); } } });
      expect((await authed(app).get('/api/app/session')).statusCode).toBe(503);
      expect((await authed(app).get('/api/leads')).statusCode).toBe(503);
      runtime.configure({ verifier: { configured: true, verify: async () => { throw identityError('down', 'APP_AUTH_PROVIDER_UNAVAILABLE', 503); } } });
      expect((await authed(app).get('/api/leads')).statusCode).toBe(503);
    });
  });

  describe('membership', () => {
    test.each(['outsider', 'disabled'])('%s is authenticated but denied with 403', async (name) => {
      const response = await authed(app, name).get('/api/leads');
      expect(response.statusCode).toBe(403);
      expect(response.body.code).toBe('WORKSPACE_ACCESS_DENIED');
      expect(state.auditEvents.at(-1)).toMatchObject({ eventType: 'app_authorization_denied', actorId: USERS[name] });
    });

    test('disabling a membership removes access on the next request', async () => {
      await allowed(authed(app, 'operator').get('/api/leads'));
      state.workspaceStore.grant({ workspaceSlug: 'cornerops-ai', authUserId: USERS.operator, role: 'operator', status: 'disabled' });
      await authed(app, 'operator').get('/api/leads').expect(403);
    });

    test('a client cannot select a workspace it does not belong to', async () => {
      await authed(app, 'founder').get('/api/leads').set('x-cornerops-workspace', 'other-workspace').expect(403);
      await authed(app, 'founder').get('/api/leads').set('x-cornerops-workspace', '../etc').expect(403);
      await allowed(authed(app, 'founder').get('/api/leads').set('x-cornerops-workspace', 'cornerops-ai'));
    });

    test('role claims in the body, query or headers are ignored', async () => {
      const response = await authed(app, 'viewer').put('/api/settings?role=founder')
        .set('x-cornerops-role', 'founder').send({ role: 'founder', workspaceRole: 'founder' });
      expect(response.statusCode).toBe(403);
    });
  });

  describe('role policy', () => {
    test('viewer reads but cannot mutate', async () => {
      await allowed(authed(app, 'viewer').get('/api/leads'));
      await allowed(authed(app, 'viewer').get('/api/orders'));
      expect((await authed(app, 'viewer').patch('/api/leads/lead-1').send({ status: 'won' })).statusCode).toBe(403);
      expect((await authed(app, 'viewer').post('/api/chat').send({ userId: 'u', message: 'hola' })).statusCode).toBe(403);
    });

    test('operator performs low-risk internal writes but not sensitive configuration', async () => {
      await allowed(authed(app, 'operator').patch('/api/leads/does-not-exist').send({ status: 'won' }));
      for (const attempt of [
        authed(app, 'operator').put('/api/settings').send({}),
        authed(app, 'operator').patch('/api/workers/sales').send({ enabled: false }),
        authed(app, 'operator').patch('/api/integrations/whatsapp').send({ enabled: true }),
        authed(app, 'operator').post('/api/approvals/any/approve').send({}),
        authed(app, 'operator').post('/api/github/issues').send({ title: 'x' }),
      ]) {
        const response = await attempt;
        expect(response.statusCode).toBe(403);
        expect(response.body.code).toBe('WORKSPACE_ROLE_INSUFFICIENT');
      }
    });

    test('founder passes the sensitive configuration policy', async () => {
      await allowed(authed(app, 'founder').post('/api/approvals/unknown/approve').send({}));
      await allowed(authed(app, 'founder').get('/api/settings'));
    });

    test('roleSatisfies denies unknown roles and policies', () => {
      expect(roleSatisfies('founder', 'sensitive_config')).toBe(true);
      expect(roleSatisfies('operator', 'sensitive_config')).toBe(false);
      expect(roleSatisfies('admin', 'read')).toBe(false);
      expect(roleSatisfies('founder', 'unknown_policy')).toBe(false);
    });
  });

  describe('legacy paths cannot bypass the boundary', () => {
    test.each([
      ['get', '/api/leads'], ['get', '/api/conversations'], ['get', '/api/audit-logs'], ['get', '/api/settings'],
      ['get', '/api/context/sources'], ['get', '/api/dashboard'], ['patch', '/api/leads/x'], ['put', '/api/settings'],
      ['post', '/api/approvals/x/approve'], ['post', '/api/chat'], ['get', '/api/mock/leads'], ['get', '/api/LEADS'],
      ['get', '/api//leads'], ['get', '/api/leads/'], ['get', '/api/unknown'],
    ])('%s %s requires a session', async (method, path) => {
      expect((await request(app)[method](path)).statusCode).toBe(401);
    });
  });

  describe('router construction', () => {
    test('a mutation without an execution policy cannot be registered', () => {
      const router = createAppAuth(runtime).policyRouter();
      expect(() => router.post('/unsafe', (_req, res) => res.json({}))).toThrow(/no execution policy/);
      expect(() => router.delete('/unsafe', (_req, res) => res.json({}))).toThrow(/no execution policy/);
      expect(() => createAppAuth(runtime).requirePolicy('made_up')).toThrow(/Unknown execution policy/);
    });
  });

  describe('founder actions', () => {
    const run = async (workspace) => {
      const req = { method: 'POST', workspace, path: '/x', get: () => undefined, is: () => true };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createControlTowerFounderActionAuth({ config: { controlTowerFounderActionAuthRequired: true, controlTowerFounderActionTokenHash: '' } })(req, res, next);
      return { res, next };
    };

    test('a non-founder session is refused before the token is considered', async () => {
      const { res, next } = await run({ role: 'operator' });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json.mock.calls[0][0].code).toBe('FOUNDER_ACTION_ROLE_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    test('a founder session still needs the founder-action token', async () => {
      const { res, next } = await run({ role: 'founder' });
      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });
  });

  test('authHeader helper is the only way tests authenticate', () => {
    expect(authHeader('viewer').Authorization).toMatch(/^Bearer test\.viewer\.session$/);
  });
});
