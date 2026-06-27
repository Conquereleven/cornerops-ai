const express = require('express');
const chatRoutes = require('./routes/chat');
const ivrRoutes = require('./routes/ivr');
const dataRoutes = require('./routes/data');
const internalRoutes = require('./routes/internal');
const whatsappRoutes = require('./routes/whatsapp');
const openclawRoutes = require('./routes/openclaw');
const contextRoutes = require('./routes/context');
const controlTowerRoutes = require('./routes/controlTower');
const operatorRoutes = require('./routes/operator');
const operatorChannelRoutes = require('./routes/operatorChannel');
const actionRoutes = require('./routes/actions');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');
const fs = require('fs');
const path = require('path');
const { getDataSourceStatus } = require('./data/supabase/supabaseClient');

const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.frontendOrigin);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-cornerops-console-token, x-internal-api-key, x-request-id, x-correlation-id, x-operator-id',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});
app.use(express.json({ limit: '32kb' }));
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

app.use('/api/chat', chatRoutes);
app.use('/api/ivr', ivrRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/openclaw', openclawRoutes);
app.use('/api/control-tower', controlTowerRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/operator-channel', operatorChannelRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/webhooks/whatsapp', whatsappRoutes);
app.use('/api', contextRoutes);
app.use('/api', dataRoutes);

const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: true, message: 'Ruta no encontrada.' });
    }
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
