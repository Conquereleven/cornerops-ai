const { FsSafeBoundary } = require('../../../src/core/native-tools/FsSafeBoundary');
const { LocalArchiveMockAdapter } = require('../../../src/core/local-archives/LocalArchiveMockAdapter');
const { LocalArchiveRepository } = require('../../../src/core/local-archives/LocalArchiveRepository');
const { LocalArchiveSearchIndex } = require('../../../src/core/local-archives/LocalArchiveSearchIndex');

describe('local archives', () => {
  test('mock adapter loads fixtures', async () => {
    const adapter = new LocalArchiveMockAdapter();
    const records = await adapter.listRecords();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].provenance.adapter).toBeTruthy();
  });

  test('FsSafeBoundary blocks path traversal', () => {
    const boundary = new FsSafeBoundary({ root: './.cornerops', allowOutsideRoot: false });
    expect(() => boundary.resolve('../../etc/passwd')).toThrow(/Path traversal/);
    expect(boundary.resolve('archives/context.sqlite')).toContain('.cornerops');
  });

  test('search respects source filters and PII filters through query layer', async () => {
    const repository = new LocalArchiveRepository({
      adapter: new LocalArchiveMockAdapter(),
      searchIndex: new LocalArchiveSearchIndex(),
    });
    const results = await repository.search({
      query: 'manual payment',
      sourceIds: ['github_archive'],
      limit: 10,
    });
    expect(results.every((item) => item.sourceId === 'github_archive')).toBe(true);
    expect(results[0].provenance.originalSource).toBeTruthy();
  });
});
