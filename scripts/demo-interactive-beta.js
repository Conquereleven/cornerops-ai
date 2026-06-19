process.env.CORNEROPS_OPERATOR_INTERFACE_ENABLED = 'true';
process.env.CORNEROPS_INTERACTIVE_BETA_ENABLED = 'true';
process.env.CORNEROPS_CLI_MODE = 'true';
process.env.CORNEROPS_OPERATOR_DRY_RUN = 'true';
process.env.CORNEROPS_OPERATOR_READ_ONLY = 'true';
process.env.CORNEROPS_OPERATOR_REQUIRE_APPROVAL = 'true';
process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.CORNEROPS_DB_ALLOW_WRITES = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';
process.env.OPENCLAW_OPERATOR_CHANNEL_ENABLED = 'false';
process.env.CRAWLERS_ENABLED = 'false';
process.env.CLAWHUB_ENABLED = 'false';

const { operatorCommandRouter } = require('../src/core/operator');

const steps = [
  ['1. Help', 'help'],
  ['2. Control Tower', 'Show system health and Control Tower status'],
  ['3. Daily briefing', "Give me today's briefing"],
  ['4. B2B leads', 'Which B2B leads need follow-up?'],
  ['5. Follow-up draft', 'Prepare a follow-up draft for restaurants interested in Tajin and Pulparindo'],
  ['6. Quotes review', 'Which quotes need follow-up?'],
  ['7. Orders review', 'Which orders require action?'],
  ['8. GitHub engineering', 'Review open GitHub issues and tell me what Codex should work on next'],
  ['9. Pending approvals', 'Show pending approvals'],
  ['10. Audit summary', 'Show audit summary and last 20 audit events'],
  ['11. Security risks', 'Show me audit and security risks'],
];

const run = async () => {
  console.log('CornerOps Interactive Operator Beta v0.5 (mock/read-only/dry-run)');
  let sessionId;
  for (const [label, text] of steps) {
    const output = await operatorCommandRouter.handle({
      requestId: `interactive-demo-${label.split('.')[0]}`,
      operatorId: 'demo-founder',
      channel: 'cli',
      sessionId,
      text,
      metadata: label.startsWith('5.') ? { leadId: 'lead-restaurante-tajin-001' } : {},
    });
    sessionId = output.sessionId;
    console.log(`\n=== ${label} ===`);
    console.log(output.responseText);
  }
  console.log(`\nSession: ${sessionId}`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
