const fs = require('fs');
const os = require('os');
const path = require('path');
const { FileJsonStore } = require('../src/core/persistence/FileJsonStore');
const { HumanApprovalService } = require('../src/integrations/openclaw/HumanApprovalService');
const { AuditLogService } = require('../src/integrations/openclaw/AuditLogService');

const initialData = { version: 1, records: [] };

const run = async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cornerops-v081-demo-'));
  try {
    const approvalFile = 'approvals.json';
    const auditFile = 'audit.json';
    const approvals = new HumanApprovalService({
      store: new FileJsonStore({ critical: true, filePath: approvalFile, initialData, root }),
    });
    const audit = new AuditLogService({
      store: new FileJsonStore({ critical: true, filePath: auditFile, initialData, root }),
    });
    const pending = approvals.createApproval({
      actionType: 'propose_order_status_change',
      createdBy: 'demo-operator',
      payload: { orderId: 'demo-order', token: 'never-persist' },
    });
    audit.record({
      actionType: 'persistence_restart_demo',
      channel: 'internal',
      input: { email: 'founder@example.com', message: 'private demo request' },
      policyDecision: 'dry_run',
      status: 'success',
    });
    const restartedApprovals = new HumanApprovalService({
      store: new FileJsonStore({ critical: true, filePath: approvalFile, initialData, root }),
    });
    const restartedAudit = new AuditLogService({
      store: new FileJsonStore({ critical: true, filePath: auditFile, initialData, root }),
    });
    const files = fs.readdirSync(root);
    const serialized = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
    const result = {
      approvalRecovered: restartedApprovals.getApproval(pending.id)?.status === 'pending',
      auditEventsRecovered: restartedAudit.list().length,
      atomicTempFiles: files.filter((file) => file.endsWith('.tmp')).length,
      secretExposed: serialized.includes('never-persist'),
      piiExposed: serialized.includes('founder@example.com'),
      realActionsExecuted: false,
      provider: 'file_json',
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

if (require.main === module) run().catch((error) => {
  console.error(`v0.8.1 persistence demo failed safely: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { run };
