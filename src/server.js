const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(
    `CornerOps AI Workers listening on http://localhost:${env.port}`,
  );
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
