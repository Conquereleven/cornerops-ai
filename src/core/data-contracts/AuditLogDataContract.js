const auditLogDataContract = {
  entity: 'audit_log',
  sourceName: 'cornerops-business-data',
  sourceTable: 'audit_logs',
  fields: [
    { canonicalField: 'id', aliases: ['id', 'audit_id'], required: true, piiLevel: 'none' },
    { canonicalField: 'requestId', aliases: ['requestId', 'request_id'], required: false, piiLevel: 'low' },
    { canonicalField: 'eventType', aliases: ['eventType', 'event_type'], required: true, piiLevel: 'none' },
    { canonicalField: 'agentId', aliases: ['agentId', 'agent_id'], required: false, piiLevel: 'none' },
    { canonicalField: 'userId', aliases: ['userId', 'user_id'], required: false, piiLevel: 'medium' },
    { canonicalField: 'status', aliases: ['status'], required: true, piiLevel: 'none' },
    { canonicalField: 'createdAt', aliases: ['createdAt', 'created_at'], required: true, transform: 'iso_timestamp', piiLevel: 'none' },
  ],
};

module.exports = { auditLogDataContract };
