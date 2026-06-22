const { CrawlerPolicy } = require('../../../src/core/crawlers/CrawlerPolicy');
const { CrawlerRegistry } = require('../../../src/core/crawlers/CrawlerRegistry');
const { GitcrawlAdapter } = require('../../../src/core/crawlers/adapters/GitcrawlAdapter');
const { SlacrawlAdapter } = require('../../../src/core/crawlers/adapters/SlacrawlAdapter');
const { WacrawlAdapter } = require('../../../src/core/crawlers/adapters/WacrawlAdapter');
const { NotcrawlAdapter } = require('../../../src/core/crawlers/adapters/NotcrawlAdapter');
const { TelecrawlAdapter } = require('../../../src/core/crawlers/adapters/TelecrawlAdapter');
const { DiscrawlAdapter } = require('../../../src/core/crawlers/adapters/DiscrawlAdapter');
const { LocalArchiveMockAdapter } = require('../../../src/core/local-archives/LocalArchiveMockAdapter');
const { LocalArchiveRepository } = require('../../../src/core/local-archives/LocalArchiveRepository');
const { LocalArchiveSearchIndex } = require('../../../src/core/local-archives/LocalArchiveSearchIndex');

const build = () => {
  const registry = new CrawlerRegistry({
    config: {
      crawlersEnabled: true,
      gitcrawlEnabled: true,
      slacrawlEnabled: true,
      wacrawlEnabled: true,
      notcrawlEnabled: true,
      telecrawlEnabled: true,
    },
  });
  const policy = new CrawlerPolicy({ crawlersEnabled: true, dryRun: true, readOnly: true });
  const repository = new LocalArchiveRepository({
    adapter: new LocalArchiveMockAdapter(),
    searchIndex: new LocalArchiveSearchIndex(),
  });
  return { registry, policy, repository };
};

describe('crawler adapters', () => {
  test.each([
    ['gitcrawl', GitcrawlAdapter],
    ['slacrawl', SlacrawlAdapter],
    ['wacrawl', WacrawlAdapter],
    ['notcrawl', NotcrawlAdapter],
    ['telecrawl', TelecrawlAdapter],
  ])('%s dry-run sync works', async (id, Adapter) => {
    const deps = build();
    const adapter = new Adapter(deps);
    const output = await adapter.dryRunSync({}, { agentId: 'security-audit-agent' });
    expect(output.crawlerId).toBe(id);
    expect(output.dryRun).toBe(true);
  });

  test('Discrawl remains denied/document-only when disabled', async () => {
    const deps = build();
    const adapter = new DiscrawlAdapter(deps);
    const output = await adapter.dryRunSync({}, { agentId: 'security-audit-agent' });
    expect(output.status).toBe('denied');
  });

  test('real sync requires approval in policy', () => {
    const deps = build();
    const decision = deps.policy.evaluate({ crawler: deps.registry.get('gitcrawl'), operation: 'sync' });
    expect(decision.requiresApproval).toBe(true);
  });
});
