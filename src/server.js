const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { logSupabaseConfiguration } = require('./config/supabase');

for (const warning of env.getEnvWarnings()) {
  logger.warn('environment_warning', { warning });
}
logSupabaseConfiguration();
const server = app.listen(env.port, env.bindHost, () => {
  console.log(
    `CornerOps AI Workers listening on http://${env.bindHost}:${env.port}`,
  );
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
