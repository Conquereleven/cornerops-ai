const express = require('express');
const identityRuntime = require('../core/identity/runtime');
const { authenticate } = require('../middleware/appAuth');

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Identity + server-verified memberships. An authenticated user without a
// membership gets an empty list, never an inferred role.
router.get('/session', authenticate, async (req, res) => {
  try {
    const workspaces = await identityRuntime.workspaceStore.listActiveMemberships(req.appIdentity.userId);
    return res.json({
      authenticated: true,
      user: { id: req.appIdentity.userId },
      workspaces: workspaces.map(({ id, slug, name, role }) => ({ id, slug, name, role })),
    });
  } catch (_error) {
    return res.status(503).json({ error: true, code: 'WORKSPACE_LOOKUP_UNAVAILABLE', message: 'Workspace authorization is unavailable.' });
  }
});

router.use('/sales', require('./sales'));

module.exports = router;
