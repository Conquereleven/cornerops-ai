const data = require('../src/core/data');
const { auditViewerService } = require('../src/core/control-tower');

const run = async () => {
  await data.auditLogService.record({
    eventType: 'operator_web_request',
    operation: 'security_review',
    userId: 'demo-operator',
    channel: 'web',
    policyDecision: 'allowed',
    status: 'success',
    input: { message: 'Private request from founder@example.com' },
  });
  await data.auditLogService.record({
    eventType: 'security_denied',
    operation: 'production_write',
    userId: 'unknown',
    channel: 'web',
    policyDecision: 'denied',
    status: 'denied',
    input: { token: 'never-show-this', text: 'delete order +971 50 123 4567' },
  });
  const viewer = await auditViewerService.getEvents({ limit: 10 });
  console.log(JSON.stringify({
    summary: viewer.summary,
    latest: viewer.events.map(({ auditId, eventType, preview, status }) => ({ auditId, eventType, preview, status })),
    piiMasked: !JSON.stringify(viewer).includes('founder@example.com'),
    secretsExposed: JSON.stringify(viewer).includes('never-show-this'),
  }, null, 2));
  return viewer;
};

if (require.main === module) run().catch((error) => {
  console.error(`Audit Viewer demo failed safely: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { run };
