const configured = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

class EnvironmentDoctorService {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  check() {
    const checks = [
      this.item('runtime_mode', 'Backend runtime mode', this.config.nodeEnv ? 'ok' : 'warning', 'Runtime mode is available.', 'Set NODE_ENV for deployment clarity.'),
      this.item('railway_backend_url', 'Railway backend URL configured', configured(this.config.railwayPublicDomain || this.config.backendUrl) ? 'ok' : 'warning', 'Backend URL is optional locally.', 'Set public backend URL in Lovable Settings when connecting frontend.'),
      this.item('frontend_api_url', 'Frontend API URL configured', configured(this.config.frontendOrigin) ? 'ok' : 'warning', 'Frontend origin is configured or defaults locally.', 'Configure FRONTEND_ORIGIN/CORS for deployed frontend.'),
      this.item('frontend_auth', 'Frontend auth token/header configured', configured(this.config.controlTowerFrontendOperatorTokenHash || this.config.controlTowerFrontendOperatorToken) ? 'ok' : 'warning', 'Operator auth is configured when token/hash exists.', 'Set Control Tower operator auth secret in backend and frontend.'),
      this.item('supabase_url', 'Supabase URL configured', configured(this.config.cornermexSupabaseUrl), 'Supabase URL presence only; value is never exposed.', 'Set CORNERMEX_SUPABASE_URL.'),
      this.item('supabase_anon_key', 'Supabase anon/publishable key configured', configured(this.config.cornermexSupabaseAnonKey), 'Supabase anon key presence only; value is never exposed.', 'Set CORNERMEX_SUPABASE_ANON_KEY.'),
      this.item('supabase_read_only', 'Supabase read-only mode enabled', this.config.cornermexSupabaseReadOnly !== false, 'Read-only mode remains required.', 'Set CORNERMEX_SUPABASE_READ_ONLY=true.'),
      this.item('supabase_writes_disabled', 'Supabase writes disabled', this.config.cornermexSupabaseAllowWrites !== true, 'Writes are blocked by policy.', 'Set CORNERMEX_SUPABASE_ALLOW_WRITES=false.'),
      this.item('github_read_only', 'GitHub read-only status', this.config.githubReadOnly !== false, 'GitHub writes require approval/PR flow.', 'Keep GITHUB_READ_ONLY=true.'),
      this.item('telegram_status', 'Telegram status', configured(this.config.telegramOperatorAllowedChatIds) ? 'ok' : 'warning', 'Telegram is optional and founder-only.', 'Configure founder Telegram allowlist for live bot use.'),
      this.item('openclaw_status', 'OpenClaw status', this.config.openclawEnabled ? 'warning' : 'ok', 'OpenClaw execution is not part of v1.8.', 'Keep OPENCLAW_ENABLED=false until its sprint.'),
      this.item('fallback_mock_usage', 'Fallback/mock usage', this.config.corneropsCornermexConnectorMode === 'mock' ? 'warning' : 'ok', 'Real read-only should avoid mock fallback when configured.', 'Set connector mode to real/read-only once Supabase is configured.'),
      this.item('cornermex_program_evidence_root', 'Canonical program evidence configured', configured(this.config.cornermexProgramEvidenceRoot) ? 'ok' : 'fail', 'Only configuration presence is reported; the path is never exposed.', 'Configure the canonical program evidence directory.'),
      this.item('cornermex_program_evidence_max_age', 'Canonical evidence maximum age valid', this.config.cornermexProgramEvidenceMaxAgeValid !== false ? 'ok' : 'warning', 'Maximum age must be finite, positive, and no more than seven days.', 'Use a value from 1 through 604800000 milliseconds.'),
      this.item('commercial_shipping_rates', 'Commercial destination shipping rates', Object.keys(this.config.corneropsCommercialShippingRatesAed || {}).length ? 'ok' : 'warning', 'Rates are destination-aware and may remain unknown.', 'Configure explicit Emirate rates; no UAE-wide default is assumed.'),
      this.item('commercial_inventory_freshness', 'Commercial inventory freshness policy', Number.isInteger(this.config.corneropsCommercialInventoryEvidenceStaleAfterHours), 'Inventory evidence has a bounded staleness threshold.', 'Set CORNEROPS_COMMERCIAL_INVENTORY_EVIDENCE_STALE_AFTER_HOURS.'),
    ];
    const failed = checks.filter((check) => check.status === 'fail');
    const warnings = checks.filter((check) => check.status === 'warning');
    return {
      overallStatus: failed.length ? 'needs_attention' : warnings.length ? 'usable_with_warnings' : 'healthy',
      generatedAt: new Date().toISOString(),
      secretsExposed: false,
      checks,
    };
  }

  item(id, label, conditionOrStatus, reason, fixHint) {
    const status = typeof conditionOrStatus === 'string'
      ? conditionOrStatus
      : conditionOrStatus ? 'ok' : 'warning';
    return {
      id,
      label,
      status,
      severity: status === 'ok' ? 'info' : status === 'fail' ? 'high' : 'medium',
      reason,
      fixHint: status === 'ok' ? null : fixHint,
    };
  }
}

module.exports = { EnvironmentDoctorService };
