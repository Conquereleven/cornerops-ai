const fs = require('fs/promises');
const path = require('path');
const { controlTowerV08ReportService } = require('../src/core/control-tower');
const { renderControlTowerHtml } = require('../src/core/control-tower/ControlTowerHtmlRenderer');

const outputPath = path.resolve(process.cwd(), '.cornerops/reports/control-tower-v0.8.html');

const run = async () => {
  const report = await controlTowerV08ReportService.getReport();
  const html = renderControlTowerHtml(report);
  await fs.mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await fs.chmod(path.dirname(outputPath), 0o700);
  await fs.writeFile(outputPath, html, { mode: 0o600 });
  console.log(JSON.stringify({
    report: outputPath,
    status: report.status,
    mode: report.mode,
    localOnly: true,
    readOnly: true,
    dryRun: true,
    secretsIncluded: false,
  }, null, 2));
  return { outputPath, report };
};

if (require.main === module) run().catch((error) => {
  console.error(`Control Tower report failed safely: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { outputPath, run };
