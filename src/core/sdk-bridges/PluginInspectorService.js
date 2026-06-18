const riskyPermissions = ['command_execution', 'filesystem', 'network', 'browser', 'secret_access', 'host_control'];

class PluginInspectorService {
  inspect(plugin = {}) {
    const permissions = plugin.permissions || [];
    const findings = permissions
      .filter((permission) => riskyPermissions.includes(permission))
      .map((permission) => `${permission} requires approval and sandbox review.`);
    return {
      id: plugin.id || 'plugin-inspection-dry-run',
      status: 'dry_run',
      riskLevel: findings.length ? 'high' : 'low',
      allowed: findings.length === 0,
      findings,
    };
  }

  reviewRequest(plugin = {}) {
    return {
      status: 'dry_run',
      requiresApproval: true,
      report: this.inspect(plugin),
    };
  }
}

module.exports = {
  PluginInspectorService,
};
