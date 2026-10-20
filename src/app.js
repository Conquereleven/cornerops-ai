const express = require('express');
const chatRoutes = require('./routes/chat');
const ivrRoutes = require('./routes/ivr');
const dataRoutes = require('./routes/data');
const internalRoutes = require('./routes/internal');
const whatsappRoutes = require('./routes/whatsapp');
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

const app = express();

app.disable('x-powered-by');
app.use(requestLogger);
app.use(express.json({ limit: '32kb', inflate: false, verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
app.use('/api', require('./middleware/apiContainment').apiContainment);
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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cornerops-ai',
  });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cornerops-ai',
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/ivr', ivrRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/openclaw', openclawRoutes);
app.use('/api/control-tower', controlTowerRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/operator-channel', operatorChannelRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/webhooks/whatsapp', whatsappRoutes);
app.use('/api', contextRoutes);
app.use('/api', dataRoutes);

// API-looking paths (including encoded spellings) must never fall through to static HTML.
app.use((req, res, next) => {
  let decodedPath;
  try { decodedPath = decodeURIComponent(req.path); } catch (_error) { return res.sendStatus(400); }
  if (/^\/api(?:\/|$)/i.test(decodedPath)) return res.status(404).json({ error: true, message: 'Ruta no encontrada.' });
  return next();
});

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
