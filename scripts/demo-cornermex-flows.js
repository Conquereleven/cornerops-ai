#!/usr/bin/env node
const data = require('../src/core/data');
const { CornerMexFlowEngine } = require('../src/core/flows/cornermex');

const main = async () => {
  const engine = new CornerMexFlowEngine({
    auditLogService: data.auditLogService,
    connector: data.lovableCornerMexConnector,
  });
  const analysis = await engine.analyzeFlows({ requestId: 'demo-cornermex-flows-v1.2' });
  process.stdout.write(`${JSON.stringify({
    demo: 'cornermex_flows_v1.2',
    sourceMode: analysis.sourceMode,
    summary: analysis.summary,
    flows: analysis.flows.map((flow) => ({
      id: flow.id,
      candidates: flow.records.length,
      sendStatus: flow.sendStatus,
      writesBlocked: flow.writesBlocked,
    })),
    warnings: analysis.warnings,
    auditId: analysis.auditId,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex flows demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
