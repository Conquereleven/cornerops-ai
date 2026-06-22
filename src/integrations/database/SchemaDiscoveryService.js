const { jsType, piiGuessForColumn } = require('./schemaDiscoveryTypes');

const EXPECTED_TABLES = ['leads', 'quotes', 'orders', 'audit_logs', 'approvals'];

class SchemaDiscoveryService {
  constructor({ adapter, auditLogService, enabled = false, expectedTables = EXPECTED_TABLES } = {}) {
    this.adapter = adapter;
    this.auditLogService = auditLogService;
    this.enabled = Boolean(enabled);
    this.expectedTables = expectedTables;
  }

  async discover(context = {}) {
    const health = await this.adapter.health();
    const warnings = [...health.warnings];
    if (!this.enabled && health.mode === 'real_read_only') {
      warnings.push('Real schema discovery is disabled by feature flag.');
    }
    const useReal = this.enabled && health.mode === 'real_read_only';
    const tables = [];
    for (const tableName of this.expectedTables) {
      try {
        const result = await this.adapter.select({ table: tableName, limit: 1 }, {
          ...context,
          agentId: context.agentId || 'schema-discovery-service',
        });
        const sample = result.rows[0] || {};
        tables.push({
          tableName,
          schemaName: useReal ? this.adapter.config.schema : 'mock',
          columns: Object.entries(sample).map(([name, value]) => ({
            name,
            type: jsType(value),
            nullable: value === null || value === undefined,
            piiGuess: piiGuessForColumn(name),
          })),
          estimatedRowCount: undefined,
          sampleAvailable: Boolean(result.rows.length),
        });
      } catch (error) {
        warnings.push(`${tableName}: ${error.code || error.message}`);
      }
    }
    const report = {
      provider: useReal ? health.provider : 'mock',
      readOnlyVerified: Boolean(health.readOnlyVerified),
      tables,
      warnings,
      createdAt: new Date().toISOString(),
    };
    await this.auditLogService?.record({
      ...context,
      eventType: 'schema_discovery',
      dataSource: 'business_database',
      operation: 'discover_schema',
      policyDecision: report.readOnlyVerified ? 'allowed' : 'denied',
      status: report.readOnlyVerified ? 'success' : 'denied',
      output: {
        provider: report.provider,
        tableCount: report.tables.length,
        warningCount: report.warnings.length,
      },
    });
    return report;
  }
}

module.exports = {
  EXPECTED_TABLES,
  SchemaDiscoveryService,
};
