const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

const DEFAULT_DISCOVERY = {
  framework: 'unknown_without_repo_contents',
  appRoutes: ['/products', '/quote', '/cart', '/checkout'],
  adminRoutes: ['/admin', '/admin/orders', '/admin/quotes', '/admin/products'],
  entities: ['product', 'lead', 'quote', 'order', 'customer', 'payment'],
  flows: ['product_flow', 'request_quote_flow', 'quote_flow', 'order_flow', 'bank_transfer_flow', 'cod_flow', 'admin_dashboard_flow'],
  supabaseReferences: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'createClient'],
  envReferences: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  tableReferences: [],
  writeRiskPaths: [
    { pattern: '.insert(', risk: 'write_path_documentation_only' },
    { pattern: '.update(', risk: 'write_path_documentation_only' },
    { pattern: '.delete(', risk: 'write_path_documentation_only' },
    { pattern: '.upsert(', risk: 'write_path_documentation_only' },
    { pattern: '.rpc(', risk: 'mutation_rpc_documentation_only' },
  ],
  findings: [
    'Supabase client initialization should be confirmed from the connected repo.',
    'Request quote, Bank Transfer and COD flows are expected CornerMex flows and must be verified from source.',
  ],
};

class LovableRepoDiscoveryService {
  constructor({ config = {}, githubClient } = {}) {
    this.config = config;
    this.githubClient = githubClient;
  }

  async discover() {
    const repoConfigured = Boolean(this.config.cornermexLovableGithubRepo);
    const warnings = [];
    if (!repoConfigured) warnings.push('Missing CORNERMEX_LOVABLE_GITHUB_REPO; using mock discovery.');
    if (repoConfigured && this.config.cornermexLovableReadOnly === false) {
      warnings.push('CRITICAL: Lovable repo discovery must remain read-only.');
    }
    return {
      configured: repoConfigured,
      repository: repoConfigured ? this.config.cornermexLovableGithubRepo : '',
      sourceMode: repoConfigured ? LOVABLE_SOURCE_MODES.REPO_DISCOVERED : LOVABLE_SOURCE_MODES.MOCK,
      inspectedReadOnly: repoConfigured,
      modified: false,
      issuesCreated: false,
      framework: repoConfigured ? DEFAULT_DISCOVERY.framework : 'mock',
      searchedFor: [
        'supabase client initialization',
        '.env.example',
        'table references',
        'routes',
        'admin components',
        'quote/order/product/user/customer/payment flows',
        'request quote, bank transfer and COD flows',
      ],
      ...DEFAULT_DISCOVERY,
      mappingConfidence: repoConfigured ? 'medium' : 'low',
      warnings,
    };
  }
}

module.exports = { LovableRepoDiscoveryService, DEFAULT_DISCOVERY };
