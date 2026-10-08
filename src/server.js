const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { logSupabaseConfiguration } = require('./config/supabase');

for (const warning of env.getEnvWarnings()) {
  logger.warn('environment_warning', { warning });
}
logSupabaseConfiguration();

// Temporary non-sensitive DB connectivity probe, gated to staging diagnostics.
if (process.env.CORNERTECH_STAGING_DB_DIAGNOSTICS === 'true') {
  const { getSharedInternalStore } = require('./core/work-queue/sharedInternalStore');
  void getSharedInternalStore().health().then((result) => {
    console.log('cornertech_staging_postgres_probe', {
      healthy: result.healthy === true,
      errorCode: result.errorCode || null,
    });
  }).catch((error) => {
    console.error('cornertech_staging_postgres_probe', {
      healthy: false,
      errorCode: typeof error?.code === 'string' ? error.code : 'UNKNOWN',
    });
  });
}
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
