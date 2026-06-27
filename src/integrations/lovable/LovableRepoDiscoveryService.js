const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

const DEFAULT_DISCOVERY = {
  appRoutes: ['/products', '/quote', '/cart', '/checkout'],
  adminRoutes: ['/admin', '/admin/orders', '/admin/quotes', '/admin/products'],
  entities: ['product', 'lead', 'quote', 'order', 'customer', 'payment'],
  flows: ['product_flow', 'request_quote_flow', 'quote_flow', 'order_flow', 'bank_transfer_flow', 'cod_flow', 'admin_dashboard_flow'],
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
      warnings,
    };
  }
}

module.exports = { LovableRepoDiscoveryService, DEFAULT_DISCOVERY };
