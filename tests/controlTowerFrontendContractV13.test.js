const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const {
  CONTROL_TOWER_FRONTEND_SECTIONS,
  assertNoSecretKeys,
} = require('../src/api/contracts/controlTowerFrontendSchemas');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const baseReport = {
  generatedAt: '2026-07-02T00:00:00.000Z',
  realSourceExpansion: { sourceModeSummary: 'repo_discovered' },
  safety: {
    externalSendsBlocked: true,
    warnings: [],
  },
  openclaw: { enabled: false },
  cornerMexLovableConnector: {
    sourceMode: 'repo_discovered',
    writesBlocked: true,
    supabaseRealReadOnlyReadiness: 'pending_credentials',
    mappedContracts: [
      { entity: 'Product', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Order', confidence: 'medium', sourceMode: 'repo_discovered' },
    ],
    missingFounderConfig: ['CORNERMEX_SUPABASE_URL', 'CORNERMEX_SUPABASE_ANON_KEY'],
    warnings: [],
  },
  cornerMexFlowEngine: {
    enabled: true,
    sourceMode: 'repo_discovered',
    availableFlows: ['manual_payment_review_flow', 'quote_follow_up_flow'],
    flowsWithEnoughData: ['manual_payment_review_flow'],
    flowsMissingData: ['customer_follow_up_flow'],
  },
  telegramOperator: {
    operatorMode: 'polling',
    founderPollingStatus: 'active_local_founder_only',
    realReplyAllowed: true,
    replyDryRun: false,
    allowedUsersCount: 1,
    allowedChatsCount: 1,
    groupsRejected: true,
    pollingMissingConfig: [],
    warnings: [],
  },
};

const createContract = () => new ControlTowerFrontendContract({
  approvalCenterService: {
    list: jest.fn(async () => ({
      approvals: [{ id: 'approval-1', status: 'pending', actionType: 'draft_follow_up' }],
      pendingCount: 1,
    })),
  },
  auditViewerService: {
    getEvents: jest.fn(async () => ({
      events: [{ id: 'audit-1', eventType: 'telegram_founder_command', summary: 'sanitized' }],
    })),
  },
  controlTowerReportService: {
    getReport: jest.fn(async () => baseReport),
  },
  controlledActionExecutor: {
    status: () => ({ enabled: true, dryRun: true, realExecutionAllowed: false, actions: [] }),
  },
  flowEngine: {
    analyzeFlows: jest.fn(async () => ({
      sourceMode: 'repo_discovered',
      auditId: 'audit-flow-v13',
      availableFlows: ['manual_payment_review_flow'],
      summary: { candidates: { manual_payment_review_flow: 1 } },
      flows: [{ id: 'manual_payment_review_flow', records: [{ id: 'order-1', reason: 'pending payment' }] }],
      warnings: [],
    })),
  },
  messageDraftService: {
    createDraft: jest.fn(async () => ({
      status: 'dry_run',
      auditId: 'audit-draft-v13',
      draft: {
        id: 'draft-1',
        type: 'whatsapp_follow_up_draft',
        body: 'Masked internal draft',
        sendStatus: 'not_sendable_in_v1.2',
        localOnly: true,
      },
      warnings: ['Draft is local/internal only.'],
    })),
  },
});

describe('Control Tower Frontend Contract v1.3', () => {
  test('returns all frontend sections with safe envelopes', async () => {
    const payload = await createContract().getAllSections();
    expect(Object.keys(payload.sections).sort()).toEqual([...CONTROL_TOWER_FRONTEND_SECTIONS].sort());
    for (const section of Object.values(payload.sections)) {
      expect(section).toMatchObject({
        status: 'success',
        readOnly: true,
        dryRun: true,
        writesBlocked: true,
        externalSendsBlocked: true,
      });
      expect(section.sourceMode).toBeTruthy();
      expect(section.auditId).toBeTruthy();
    }
    expect(assertNoSecretKeys(payload)).toBe(true);
  });

  test('telegram and draft sections reflect founder polling and not-sendable drafts', async () => {
    const contract = createContract();
    const telegram = await contract.getSection('telegram');
    const drafts = await contract.getSection('drafts');
    expect(telegram.data.mode).toBe('polling');
    expect(telegram.data.founderOnly).toBe(true);
    expect(telegram.data.allowedUsersCount).toBe(1);
    expect(drafts.approvalRequired).toBe(true);
    expect(drafts.data.sendStatus).toBe('not_sendable_in_current_version');
    expect(drafts.data.sampleDraft.sendStatus).toBe('not_sendable_in_v1.2');
  });

  test('approvals and actions stay approval-gated and dry-run', async () => {
    const contract = createContract();
    const approvals = await contract.getSection('approvals');
    const actions = await contract.getSection('actions');
    expect(approvals.approvalRequired).toBe(true);
    expect(approvals.data.externalSendsBlocked).toBe(true);
    expect(actions.approvalRequired).toBe(true);
    expect(actions.data.realExecutionBlocked).toBe(true);
    expect(actions.data.dryRunOnly).toBe(true);
  });

  test('mock data files are valid JSON and contain no secret-like values', () => {
    const dir = path.join(root, 'docs/lovable/mock-data');
    const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
    expect(files).toHaveLength(9);
    for (const file of files) {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      expect(parsed.writesBlocked).toBe(true);
      expect(parsed.externalSendsBlocked).toBe(true);
      expect(assertNoSecretKeys(parsed)).toBe(true);
    }
  });

  test('Lovable spec, prompt and integration docs exist', () => {
    [
      'docs/lovable/cornerops-control-tower-lovable-spec-v1.3.md',
      'docs/lovable/lovable-prompt-cornerops-control-tower-v1.3.md',
      'docs/lovable/control-tower-frontend-integration-plan-v1.3.md',
      'docs/api/control-tower-frontend-api-v1.3.md',
      'docs/acceptance/acceptance-v1.3.md',
    ].forEach((file) => {
      expect(fs.existsSync(path.join(root, file))).toBe(true);
    });
  });

  test('demo outputs contract JSON without credentials', () => {
    const output = execFileSync(nodeBin, ['scripts/demo-control-tower-frontend-contract.js'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: '',
        TELEGRAM_OPERATOR_WEBHOOK_SECRET: '',
        CORNERMEX_SUPABASE_ANON_KEY: '',
      },
      maxBuffer: 8 * 1024 * 1024,
    });
    const parsed = JSON.parse(output);
    expect(parsed.sections.status.writesBlocked).toBe(true);
    expect(parsed.sections.telegram.data.mode).toBeTruthy();
    expect(assertNoSecretKeys(parsed)).toBe(true);
  });
});
