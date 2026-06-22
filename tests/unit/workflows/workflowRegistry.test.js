process.env.NODE_ENV = 'test';

const { WorkflowRegistry } = require('../../../src/core/workflows/WorkflowRegistry');
const { WORKFLOW_IDS } = require('../../../src/core/workflows/workflowTypes');

describe('WorkflowRegistry', () => {
  test('lists Core Agent Pack workflows', () => {
    const registry = new WorkflowRegistry();

    expect(registry.list()).toHaveLength(5);
    expect(registry.has(WORKFLOW_IDS.DAILY_BRIEFING)).toBe(true);
    expect(registry.get(WORKFLOW_IDS.SECURITY_AUDIT_REVIEW)).toMatchObject({
      agentId: 'security-audit-agent',
    });
  });
});
