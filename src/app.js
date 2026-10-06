const express = require('express');
const chatRoutes = require('./routes/chat');
const ivrRoutes = require('./routes/ivr');
const dataRoutes = require('./routes/data');
const internalRoutes = require('./routes/internal');
const webhooks = require('./routes/webhooks');
const appRoutes = require('./routes/app');
const openclawRoutes = require('./routes/openclaw');
const contextRoutes = require('./routes/context');
const controlTowerRoutes = require('./routes/controlTower');
const intelligenceRoutes = require('./routes/intelligence');
const operatorRoutes = require('./routes/operator');
const operatorChannelRoutes = require('./routes/operatorChannel');
const actionRoutes = require('./routes/actions');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');
const { usesControlTowerFrontendCors } = require('./api/middleware/controlTowerFrontendRouteScope');
const fs = require('fs');
const path = require('path');
const { getDataSourceStatus } = require('./data/supabase/supabaseClient');

const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  if (usesControlTowerFrontendCors(req.path)) return next();
  res.setHeader('Access-Control-Allow-Origin', env.frontendOrigin);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-cornerops-console-token, x-internal-api-key, x-request-id, x-correlation-id, x-operator-id',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});
app.use(express.json({
  limit: '32kb',
  // Provider signatures are computed over the exact bytes received.
  verify: (req, _res, buffer) => {
    if (req.originalUrl.startsWith('/api/webhooks/') || req.originalUrl.startsWith('/api/github/webhook')) req.rawBody = buffer;
  },
}));
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cornerops-ai',
    dataSource: getDataSourceStatus(),
  });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cornerops-ai',
    dataSource: getDataSourceStatus(),
  });
});

// API responses are never indexable.
app.use('/api', (req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex'); next(); });

// --- Internal service boundary (x-internal-api-key) ---
app.use('/api/internal', internalRoutes);
app.use('/api/openclaw', openclawRoutes);
app.use('/api/ivr', ivrRoutes);

// --- Signed provider callbacks ---
app.use('/api/webhooks', webhooks.router);
app.post('/api/github/webhook', webhooks.receiveGitHubWebhook); // legacy alias, same HMAC check
app.use('/api/operator-channel', operatorChannelRoutes);

// --- Authenticated application boundary: workspace session + role policy ---
// /api/operator and /api/control-tower also carry service-only routes guarded
// by the internal key inside their routers.
app.use('/api/app', appRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/control-tower', controlTowerRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/actions', actionRoutes);
// Mounted last: every remaining /api path requires a workspace session.
app.use('/api', contextRoutes);
app.use('/api', dataRoutes);

const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (env.corneropsFrontendServeEnabled && fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (/[/\\]assets[/\\].*\.[a-f0-9]{8,}\./i.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'public, max-age=300');
    },
  }));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || !req.accepts('html')) {
      return res.status(404).json({ error: true, message: 'Ruta no encontrada.' });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    // Only the public landing is indexable; every other SPA route is private or transient.
    if (req.path !== '/') res.setHeader('X-Robots-Tag', 'noindex');
    return res.sendFile(frontendIndexPath);
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: true, message: 'Ruta no encontrada.' });
  });
}

// Express identifies error middleware by its four-argument signature.
app.use(errorHandler);

module.exports = app;
