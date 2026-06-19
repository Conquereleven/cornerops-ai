const approvalDataContract = {
  entity: 'approval',
  sourceName: 'cornerops-business-data',
  sourceTable: 'approvals',
  fields: [
    { canonicalField: 'id', aliases: ['id', 'approval_id'], required: true, piiLevel: 'none' },
    { canonicalField: 'actionType', aliases: ['actionType', 'action_type'], required: true, piiLevel: 'none' },
    { canonicalField: 'status', aliases: ['status'], required: true, piiLevel: 'none' },
    { canonicalField: 'createdBy', aliases: ['createdBy', 'created_by'], required: false, piiLevel: 'medium' },
    { canonicalField: 'createdAt', aliases: ['createdAt', 'created_at'], required: true, transform: 'iso_timestamp', piiLevel: 'none' },
    { canonicalField: 'updatedAt', aliases: ['updatedAt', 'updated_at'], required: false, transform: 'iso_timestamp', piiLevel: 'none' },
  ],
};

module.exports = { approvalDataContract };
