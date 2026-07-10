const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const { assertNoSecretKeys } = require('../src/api/contracts/controlTowerFrontendSchemas');
const {
  ActionEngineService,
  CapabilityMatrixService,
  CatalogCohortService,
  EnvironmentDoctorService,
  LiveControlTowerStatusService,
  OperatingStageEngine,
  ProductActivationEngine,
} = require('../src/core/intelligence');

const sampleProducts = [
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `active-${index + 1}`,
    sku: `ACTIVE-${index + 1}`,
    name: `Existing active product ${index + 1}`,
    category: 'existing',
    price_aed: 12 + index,
    stock: 25,
    status: 'active',
  })),
  ...Array.from({ length: 190 }, (_, index) => ({
    id: `intermex-${index + 1}`,
    sku: `IMX-${String(index + 1).padStart(3, '0')}`,
    name: `Intermex imported draft product ${index + 1}`,
    category: index % 5 === 0 ? null : 'snacks',
    price_aed: 8 + (index % 12),
    stock: 50,
    status: 'inactive',
  })),
];

const createLiveServices = () => {
  const auditLogService = {
    record: async ({ eventType }) => ({ id: `audit-demo-${eventType}-${Date.now()}` }),
  };
  const readOnlyClient = {
    countRows: async ({ table }) => ({ count: table === 'cornerops_products_v' ? sampleProducts.length : 0 }),
    selectRows: async ({ table, limit }) => ({
      data: table === 'cornerops_products_v' ? sampleProducts.slice(0, limit || 1000) : [],
    }),
  };
  const catalogCohortService = new CatalogCohortService({
    auditLogService,
    client: readOnlyClient,
    config: { cornermexExpectedProductCount: 190 },
  });
  const founderReviewService = {
    buildFounderReview: async () => ({
      operatingStage: 'pre_launch',
      launchReadinessStatus: 'needs_work',
      launchReadinessScore: 57,
      catalogReadiness: {
        expectedFounderProductCount: 190,
        readableProductCount: 199,
        productCountMismatch: false,
      },
      launchActions: [
        { id: 'launch-action-demo-1', title: 'Validate 190 imported draft products.' },
        { id: 'launch-action-demo-2', title: 'Select first launch-ready products.' },
      ],
      warnings: [],
      auditId: 'audit-demo-founder-review-v18',
    }),
  };
  const flowEngine = {
    analyzeFlows: async () => ({
      sourceMode: 'real_read_only',
      dataSource: 'cornermex_supabase',
      auditId: 'audit-demo-flow-v18',
      flows: [],
      warnings: [],
    }),
  };
  const operatingStageEngine = new OperatingStageEngine({
    config: {
      cornermexOperatingStage: 'pre_launch',
      cornermexLaunchDate: '2026-08-17',
    },
  });
  const actionEngineService = new ActionEngineService({
    auditLogService,
    catalogCohortService,
    flowEngine,
    founderReviewService,
  });
  const productActivationEngine = new ProductActivationEngine({ catalogCohortService });
  const environmentDoctorService = new EnvironmentDoctorService({
    config: {
      cornermexExpectedProductCount: 190,
      cornermexSupabaseReadOnly: true,
      cornermexSupabaseAllowWrites: false,
      cornermexSupabaseBlockMutations: true,
      runtimeSupabaseWritesEnabled: false,
      whatsappSendEnabled: false,
      emailSendEnabled: false,
      openclawEnabled: false,
      controlTowerFrontendOperatorTokenHash: 'configured',
    },
  });
  return {
    actionEngineService,
    productActivationEngine,
    liveControlTowerStatusService: new LiveControlTowerStatusService({
      actionEngine: actionEngineService,
      capabilityMatrixService: new CapabilityMatrixService({
        config: {
          cornermexSupabaseReadOnly: true,
          cornermexSupabaseAllowWrites: false,
          whatsappSendEnabled: false,
          emailSendEnabled: false,
          openclawEnabled: false,
        },
      }),
      catalogCohortService,
      environmentDoctorService,
      founderReviewService,
      operatingStageEngine,
      productActivationEngine,
    }),
  };
};

const sampleReport = {
  generatedAt: new Date().toISOString(),
  realSourceExpansion: { sourceModeSummary: 'repo_discovered' },
  safety: { externalSendsBlocked: true, warnings: [] },
  openclaw: { enabled: false },
  cornerMexLovableConnector: {
    sourceMode: 'repo_discovered',
    writesBlocked: true,
    supabaseRealReadOnlyReadiness: 'pending_credentials',
    mappedContracts: [
      { entity: 'Product', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Lead', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Quote', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Order', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Customer', confidence: 'medium', sourceMode: 'repo_discovered' },
      { entity: 'Payment', confidence: 'medium', sourceMode: 'repo_discovered' },
    ],
    missingFounderConfig: ['CORNERMEX_SUPABASE_URL', 'CORNERMEX_SUPABASE_ANON_KEY'],
    warnings: ['Supabase real_read_only is pending founder credentials.'],
  },
  cornerMexFlowEngine: {
    enabled: true,
    sourceMode: 'repo_discovered',
    availableFlows: [
      'b2b_lead_flow',
      'quote_follow_up_flow',
      'order_attention_flow',
      'manual_payment_review_flow',
      'product_quality_flow',
      'customer_follow_up_flow',
      'fulfillment_review_flow',
    ],
    flowsWithEnoughData: ['b2b_lead_flow', 'quote_follow_up_flow', 'manual_payment_review_flow'],
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

async function run() {
  const liveServices = createLiveServices();
  const contract = new ControlTowerFrontendContract({
    approvalCenterService: {
      list: async () => ({
        approvals: [
          { id: 'approval-sample-task', status: 'pending', actionType: 'create_internal_task' },
          { id: 'approval-sample-draft', status: 'pending', actionType: 'draft_follow_up' },
        ],
        pendingCount: 2,
      }),
    },
    auditViewerService: {
      getEvents: async () => ({
        events: [
          { id: 'audit-sample-telegram', eventType: 'telegram_founder_command', summary: 'Founder command processed.' },
          { id: 'audit-sample-draft', eventType: 'cornermex_message_draft_created', summary: 'Local draft created; no external send.' },
        ],
      }),
    },
    controlTowerReportService: { getReport: async () => sampleReport },
    controlledActionExecutor: {
      status: () => ({ enabled: true, dryRun: true, realExecutionAllowed: false, actions: [] }),
    },
    flowEngine: {
      analyzeFlows: async () => ({
        sourceMode: 'repo_discovered',
        auditId: 'audit-demo-flow-v13',
        availableFlows: sampleReport.cornerMexFlowEngine.availableFlows,
        summary: { candidates: { b2b_lead_flow: 1, quote_follow_up_flow: 1, manual_payment_review_flow: 1 } },
        flows: [
          { id: 'b2b_lead_flow', records: [{ id: 'lead-sample', reason: 'Warm UAE restaurant lead needs follow-up.' }] },
          { id: 'quote_follow_up_flow', records: [{ id: 'quote-sample', reason: 'Quote sent and pending follow-up.' }] },
          { id: 'manual_payment_review_flow', records: [{ id: 'order-sample', reason: 'Bank Transfer pending human review.' }] },
        ],
        warnings: [],
      }),
    },
    ...liveServices,
    messageDraftService: {
      createDraft: async () => ({
        auditId: 'audit-demo-draft-v13',
        draft: {
          id: 'draft-demo-v13',
          type: 'whatsapp_follow_up_draft',
          channel: 'whatsapp',
          body: 'Internal draft preview. Confirm pricing and availability before any manual send.',
          sendStatus: 'not_sendable_in_v1.2',
          localOnly: true,
        },
        warnings: ['Draft is local/internal only. WhatsApp and email sending are disabled.'],
      }),
    },
  });
  const payload = await contract.getAllSections();
  if (!assertNoSecretKeys(payload)) throw new Error('Frontend contract attempted to expose a secret-like value.');
  return payload;
}

if (require.main === module) {
  run()
    .then((payload) => process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`Control Tower frontend contract demo failed safely: ${error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { run };
