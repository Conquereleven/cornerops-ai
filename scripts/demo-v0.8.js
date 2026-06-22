const { run: runApprovalCenter } = require('./demo-approval-center');
const { run: runAuditViewer } = require('./demo-audit-viewer');
const { run: runWebReport } = require('./control-tower-web-report');
const { operatorCommandRouter } = require('../src/core/operator');
const { controlTowerV08ReportService } = require('../src/core/control-tower');

const run = async () => {
  await runApprovalCenter();
  await runAuditViewer();
  const ask = await operatorCommandRouter.handle({
    requestId: 'demo-v08-ask',
    operatorId: 'demo-founder',
    channel: 'web',
    text: 'Show security risks.',
    metadata: { surface: 'control-tower-v0.8', dryRun: true },
  });
  const { outputPath } = await runWebReport();
  const report = await controlTowerV08ReportService.getReport();
  console.log(JSON.stringify({
    controlTower: { status: report.status, mode: report.mode },
    security: report.safety,
    telegram: report.operatorChannel,
    firstRealSource: report.firstRealSource,
    approvals: report.approvals,
    audit: { ...report.audit, latest: `${report.audit.latest.length} sanitized events` },
    operatorAsk: { status: ask.status, sourceMode: ask.sourceMode, auditId: ask.auditId },
    reportPath: outputPath,
    finalSafety: { writes: 'blocked', externalSends: 'blocked', execution: 'dry_run' },
  }, null, 2));
  return { ask, outputPath, report };
};

if (require.main === module) run().catch((error) => {
  console.error(`v0.8 demo failed safely: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { run };
