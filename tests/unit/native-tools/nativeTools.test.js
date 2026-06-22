const { ClawPdfAdapter } = require('../../../src/core/native-tools/ClawPdfAdapter');
const { GoPlacesLeadDiscoveryAdapter } = require('../../../src/core/native-tools/GoPlacesLeadDiscoveryAdapter');
const { NativeToolPolicy } = require('../../../src/core/native-tools/NativeToolPolicy');
const { NativeToolRegistry } = require('../../../src/core/native-tools/NativeToolRegistry');
const { WacliArchiveAdapter } = require('../../../src/core/native-tools/WacliArchiveAdapter');
const { GogcliWorkspaceAdapter } = require('../../../src/core/native-tools/GogcliWorkspaceAdapter');
const { LocalArchiveMockAdapter } = require('../../../src/core/local-archives/LocalArchiveMockAdapter');
const { LocalArchiveRepository } = require('../../../src/core/local-archives/LocalArchiveRepository');
const { LocalArchiveSearchIndex } = require('../../../src/core/local-archives/LocalArchiveSearchIndex');

const build = () => {
  const registry = new NativeToolRegistry({
    config: {
      gogcliEnabled: true,
      wacliEnabled: true,
      goplacesEnabled: true,
      clawpdfEnabled: true,
    },
  });
  const policy = new NativeToolPolicy({ dryRun: true, requireApproval: true });
  const repository = new LocalArchiveRepository({
    adapter: new LocalArchiveMockAdapter(),
    searchIndex: new LocalArchiveSearchIndex(),
  });
  return { registry, policy, repository };
};

describe('native tools', () => {
  test('NativeToolRegistry registers tools and policy blocks host control by default', () => {
    const { registry, policy } = build();
    expect(registry.list().length).toBeGreaterThan(3);
    expect(policy.evaluate({ tool: registry.get('gogcli'), operation: 'host_control' }).allowed).toBe(false);
  });

  test('GogcliWorkspaceAdapter dry-run only', async () => {
    const output = await new GogcliWorkspaceAdapter(build()).searchWorkspace({ query: 'supplier' });
    expect(output.status).toBe('dry_run');
  });

  test('WacliArchiveAdapter is read-only/search only', async () => {
    const output = await new WacliArchiveAdapter(build()).searchArchive({ query: 'quote follow-up' });
    expect(output.mode).toBe('read_only');
  });

  test('GoPlacesLeadDiscoveryAdapter dry-run only', async () => {
    const output = await new GoPlacesLeadDiscoveryAdapter(build()).discoverLeads({ query: 'restaurant Dubai' });
    expect(output.dryRun).toBe(true);
  });

  test('ClawPdfAdapter parses mock PDF context', async () => {
    const output = await new ClawPdfAdapter(build()).parseMockPdf({ query: 'catalog Tajin' });
    expect(output.status).toBe('success');
    expect(output.results.length).toBeGreaterThan(0);
  });
});
