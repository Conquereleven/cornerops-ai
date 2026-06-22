const { ContextAccessPolicy } = require('../../../src/core/context/ContextAccessPolicy');
const { ContextHealthService } = require('../../../src/core/context/ContextHealthService');
const { ContextNormalizer } = require('../../../src/core/context/ContextNormalizer');
const { ContextRetentionService } = require('../../../src/core/context/ContextRetentionService');
const { ContextSearchService } = require('../../../src/core/context/ContextSearchService');
const { ContextSourceRegistry } = require('../../../src/core/context/ContextSourceRegistry');
const { LocalArchiveMockAdapter } = require('../../../src/core/local-archives/LocalArchiveMockAdapter');
const { LocalArchiveRepository } = require('../../../src/core/local-archives/LocalArchiveRepository');
const { LocalArchiveSearchIndex } = require('../../../src/core/local-archives/LocalArchiveSearchIndex');

const buildSearchService = () => {
  const registry = new ContextSourceRegistry({
    config: {
      contextLayerEnabled: true,
      contextMode: 'mock',
      githubContextEnabled: true,
      slackContextEnabled: true,
      whatsappContextEnabled: true,
      telegramContextEnabled: true,
      notionContextEnabled: true,
      goplacesEnabled: true,
      clawpdfEnabled: true,
    },
  });
  const repository = new LocalArchiveRepository({
    adapter: new LocalArchiveMockAdapter(),
    searchIndex: new LocalArchiveSearchIndex(),
  });
  return {
    registry,
    repository,
    service: new ContextSearchService({
      contextAccessPolicy: new ContextAccessPolicy({ dryRun: true, piiMasking: true }),
      repository,
      sourceRegistry: registry,
      maxResults: 20,
    }),
  };
};

describe('context knowledge layer', () => {
  test('ContextSourceRegistry registers all sources', () => {
    const registry = new ContextSourceRegistry({ config: { contextLayerEnabled: true } });
    expect(registry.list()).toHaveLength(14);
    expect(registry.has('github_archive')).toBe(true);
  });

  test('ContextAccessPolicy blocks disabled source and masks PII', () => {
    const registry = new ContextSourceRegistry({ config: { contextLayerEnabled: false } });
    const policy = new ContextAccessPolicy({ piiMasking: true });
    const denied = policy.evaluate({
      agentId: 'daily-briefing-agent',
      channel: 'internal',
      operation: 'search',
      source: registry.get('whatsapp_archive'),
      userId: 'operator',
    });
    expect(denied.allowed).toBe(false);
    expect(policy.sanitizeRecord({
      piiLevel: 'high',
      email: 'jose@example.com',
      phone: '+529999991234',
      participants: ['person-a'],
    })).toMatchObject({
      email: 'jo***@example.com',
      phone: '+52******1234',
      participants: ['[MASKED_PARTICIPANT]'],
    });
  });

  test('ContextSearchService returns mock results and audits safely', async () => {
    const { service } = buildSearchService();
    const results = await service.search({ query: 'Tajin Pulparindo restaurant', limit: 5 }, {
      agentId: 'daily-briefing-agent',
      channel: 'internal',
      userId: 'operator',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].provenance.adapter).toBeTruthy();
  });

  test('ContextNormalizer creates canonical LocalArchiveRecord', () => {
    const record = new ContextNormalizer().normalizeRecord({
      sourceId: 'manual_uploads',
      text: 'hello',
    });
    expect(record.id).toBeTruthy();
    expect(record.provenance.checksum).toBeTruthy();
  });

  test('ContextRetentionService flags expired records', () => {
    const retention = new ContextRetentionService({ retentionDays: 1 });
    expect(retention.isExpired({ updatedAt: '2026-06-01T00:00:00.000Z' }, new Date('2026-06-18T00:00:00.000Z'))).toBe(true);
  });

  test('ContextHealthService reports degraded when archive DB is missing/stubbed', async () => {
    const { registry, repository } = buildSearchService();
    const report = await new ContextHealthService({
      archiveRepository: repository,
      contextMode: 'mock',
      sourceRegistry: registry,
    }).getReport();
    expect(report.mode).toBe('mock');
    expect(report.archive.recordCount).toBeGreaterThan(0);
    expect(report.warnings.length).toBeGreaterThan(0);
  });
});
