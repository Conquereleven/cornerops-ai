process.env.CORNEROPS_CONTEXT_LAYER_ENABLED = 'true';
process.env.CRAWLERS_ENABLED = 'true';
process.env.GITCRAWL_ENABLED = 'true';
process.env.SLACRAWL_ENABLED = 'true';
process.env.WACRAWL_ENABLED = 'true';
process.env.NOTCRAWL_ENABLED = 'true';
process.env.TELECRAWL_ENABLED = 'true';
process.env.GITHUB_CONTEXT_ENABLED = 'true';
process.env.SLACK_CONTEXT_ENABLED = 'true';
process.env.WHATSAPP_CONTEXT_ENABLED = 'true';
process.env.NOTION_CONTEXT_ENABLED = 'true';
process.env.TELEGRAM_CONTEXT_ENABLED = 'true';

const contextCore = require('../src/core/context');

const run = async () => {
  console.log('CornerOps crawler demo (dry-run)');
  console.log('\nCrawler registry');
  console.log(JSON.stringify(contextCore.crawlerRegistry.list(), null, 2));
  for (const id of ['gitcrawl', 'slacrawl', 'wacrawl', 'notcrawl', 'telecrawl']) {
    console.log(`\n${id} dry-run sync`);
    console.log(JSON.stringify(await contextCore.crawlerAdapters[id].dryRunSync({}, {
      agentId: 'security-audit-agent',
      userId: 'demo-operator',
      channel: 'internal',
    }), null, 2));
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
