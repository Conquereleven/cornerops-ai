process.env.CORNEROPS_CONTEXT_LAYER_ENABLED = 'true';
process.env.CORNEROPS_CONTEXT_MODE = 'mock';
process.env.GITHUB_CONTEXT_ENABLED = 'true';
process.env.SLACK_CONTEXT_ENABLED = 'true';
process.env.WHATSAPP_CONTEXT_ENABLED = 'true';
process.env.TELEGRAM_CONTEXT_ENABLED = 'true';
process.env.NOTION_CONTEXT_ENABLED = 'true';
process.env.GOPLACES_ENABLED = 'true';
process.env.CLAWPDF_ENABLED = 'true';

const contextCore = require('../src/core/context');

const run = async () => {
  const queries = [
    'Tajin Pulparindo restaurant follow-up',
    'manual payment Bank Transfer bug',
    'UAE dried chiles supplier',
  ];
  console.log('CornerOps context demo (mock/dry-run)');
  for (const query of queries) {
    const results = await contextCore.contextSearchService.search({ query, limit: 5 }, {
      agentId: 'daily-briefing-agent',
      userId: 'demo-operator',
      channel: 'internal',
      requestId: `demo-context-${query}`,
    });
    console.log('\n---');
    console.log(query);
    console.log(JSON.stringify(results, null, 2));
  }
  console.log('\nWhatsApp thread summary');
  console.log(JSON.stringify(await contextCore.contextSearchService.search({
    query: 'quote follow-up Tajin Pulparindo',
    sourceIds: ['whatsapp_archive'],
    limit: 1,
  }, { agentId: 'b2b-sales-agent', channel: 'internal', userId: 'demo-operator' }), null, 2));
  console.log('\nNotion supplier note');
  console.log(JSON.stringify(await contextCore.contextSearchService.search({
    query: 'UAE supplier onboarding dried chiles',
    sourceIds: ['notion_archive'],
    limit: 1,
  }, { agentId: 'b2b-sales-agent', channel: 'internal', userId: 'demo-operator' }), null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
