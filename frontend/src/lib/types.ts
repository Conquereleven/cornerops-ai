export type WorkerName =
  | 'supportWorker'
  | 'salesWorker'
  | 'ordersWorker'
  | 'b2bWorker'
  | 'humanHandoffWorker'
  | 'ivrWorker';

export type IntentName =
  | 'support'
  | 'product_search'
  | 'order_status'
  | 'b2b_lead'
  | 'human_handoff'
  | 'unknown';

export interface ChatResponse {
  reply: string;
  worker: WorkerName;
  intent: IntentName;
  conversationId: string;
  metadata: Record<string, unknown>;
  intentCategory: 'support' | 'sales' | 'orders' | 'b2b' | 'unknown';
  memorySummary: Record<string, unknown>;
  source: 'supabase' | 'memory' | 'mock';
  idempotentReplay?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  worker?: WorkerName;
  intent?: IntentName;
  metadata?: Record<string, unknown>;
  conversationId?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  items: Array<{ sku: string; name: string; quantity: number }>;
  estimatedDelivery: string | null;
  createdAt: string;
}

export interface Product {
  id?: string;
  sku: string;
  name: string;
  category: string;
  priceAED: number | null;
  stock: number;
  description: string;
  languages: string[];
  b2bAvailable: boolean;
  active?: boolean;
}

export interface B2BLead {
  id: string;
  businessName?: string;
  city?: string;
  businessType?: string;
  productsOfInterest?: string[];
  estimatedVolume?: string;
  contact?: string;
  contactName?: string;
  email?: string;
  whatsapp?: string;
  missingFields: string[];
  status: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  status: string;
  lastMessage: string;
  worker: WorkerName;
  intent: IntentName;
  messageCount: number;
  requiresHuman?: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalConversations: number;
  totalLeads: number;
  totalOrders: number;
  activeProducts: number;
  workerRuns: number;
  conversationsToday: number;
  b2bLeadsCaptured: number;
  ordersConsulted: number;
  productsConsulted: number;
  humanHandoffs: number;
  activeWorkers: number;
  totalWorkers: number;
  firstResponseSeconds: number;
}

export interface WorkerConfig {
  id: WorkerName;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'placeholder';
  interactions: number;
  latencyMs: number;
  model: string;
  enabled: boolean;
  prompt: string;
  lastActivity: string | null;
}

export interface OperationEvent {
  id: string;
  type: string;
  worker: WorkerName;
  message: string;
  tone: 'green' | 'blue' | 'amber';
  createdAt: string;
}

export interface Handoff {
  id: string;
  conversationId: string;
  userId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  status: 'waiting' | 'assigned' | 'resolved';
  contact: string;
  assignee?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  waitSeconds: number;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  workers: WorkerConfig[];
  events: OperationEvent[];
  handoffs: Handoff[];
  dataSource: DataSourceStatus;
  generatedAt: string;
}

export interface DataSourceStatus {
  mode: 'mock' | 'supabase';
  requested: boolean;
  configured: boolean;
}

export interface WorkerRun {
  id: string;
  conversationId?: string;
  userId?: string;
  worker: WorkerName;
  intent: IntentName;
  input: string;
  output: string;
  metadata: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  latencyMs: number;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'not_connected' | 'coming_soon';
  description: string;
}

export interface WorkspaceSettings {
  productName: string;
  businessName: string;
  region: string;
  languages: string[];
  futureLanguages: string[];
  developmentMode: boolean;
  operatorName: string;
}

export interface ClientSummary {
  id: string;
  slug: string;
  name: string;
  pilot?: boolean;
  sourceMode: string;
  dataSource: string;
  readOnly: boolean;
  writesBlocked: boolean;
}

export interface SignalSummary {
  id: string;
  clientSlug: string;
  type: string;
  title: string;
  source: string;
  sourceMode: string;
  entityId?: string;
  readOnly: boolean;
}

export interface AnomalySummary {
  id: string;
  anomalyKey: string;
  clientSlug: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  title: string;
  description?: string;
  evidence: unknown[];
  hypotheses: string[];
  suggestedAction: string;
  confidenceScore: number;
  sourceMode: string;
  readOnly: boolean;
  writesBlocked: boolean;
}

export interface CaseSummary {
  id: string;
  anomalyKey: string;
  clientSlug: string;
  title: string;
  status: string;
  severity: string;
  confidenceScore: number;
  ruleScore: number;
  recommendedAction: string;
  playbookId: string;
  sourceMode: string;
  readOnly: boolean;
  writesBlocked: boolean;
  dryRun: boolean;
  externalSendsBlocked: boolean;
}

export interface PlaybookSummary {
  id: string;
  name: string;
  anomalyTypes: string[];
  steps: string[];
  writesBlocked: boolean;
}

export interface ConnectorSummary {
  id: string;
  type: string;
  name: string;
  status: string;
  dataSource: string;
  readOnly: boolean;
  writesBlocked: boolean;
}

export interface IntelligenceOverview {
  status: string;
  sourceMode: string;
  dataSource: string;
  readOnly: boolean;
  dryRun: boolean;
  writesBlocked: boolean;
  externalSendsBlocked: boolean;
  piiMasked: boolean;
  generatedAt: string;
  auditId?: string;
  clients: ClientSummary[];
  counts: {
    productsCount: number;
    activeProducts: number;
    lowStockProducts: number;
    b2bLeadCount: number;
    warmLeads: number;
    pendingPaymentReviewCount: number;
    fulfillmentDelayedCount: number;
    anomalyCandidateCount: number;
    trackedAnomalyCaseCount: number;
  };
  topOperationalAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    recommendedAction: string;
  }>;
  recommendedFounderActions: string[];
  dataFreshness: {
    lastReadAt: string | null;
    tableAvailability: Record<string, string>;
  };
  signals: SignalSummary[];
  anomalies: AnomalySummary[];
  cases: CaseSummary[];
  playbooks: PlaybookSummary[];
  connectors: ConnectorSummary[];
  warnings: string[];
}

export interface ControlTowerAuditEvent {
  timestamp?: string;
  eventType: string;
  agentId?: string;
  source: string;
  channel: string;
  policyDecision: string;
  status: string;
  auditId: string;
  riskLevel?: string;
  preview: string;
}

export interface ControlTowerApproval {
  id: string;
  status: string;
  requestedAction: string;
  requestedByAgent: string;
  riskLevel: string;
  dataTouched: string[];
  sourceMode: string;
  createdAt: string;
  approvalRequiredReason: string;
  dryRun: boolean;
  realExecutionAllowed: boolean;
  executionStatus?: string;
  executable?: boolean;
}

export interface ControlledActionDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  defaultMode: string;
  riskLevel: string;
  allowedAgents: string[];
  allowedChannels: string[];
  requiresApproval: boolean;
  externalSideEffect: boolean;
}

export interface ControlTowerV08Report {
  status: 'healthy' | 'degraded' | 'unhealthy';
  mode: string;
  generatedAt: string;
  environment: string;
  safety: {
    failClosed: boolean;
    dryRun: boolean;
    readOnly: boolean;
    writesBlocked: boolean;
    externalSendsBlocked: boolean;
    piiMasking: boolean;
    logSanitization: boolean;
    whatsappDisabled: boolean;
    customerChannelsDisabled: boolean;
    nativeToolsDisabled: boolean;
    clawhubExecutionDisabled: boolean;
    approvalRealExecutionBlocked: boolean;
    controlledActionsFailClosed?: boolean;
    controlledActionsRealExecutionBlocked?: boolean;
    paymentOrderLeadQuoteMutationsBlocked?: boolean;
    warnings: string[];
  };
  webConsole: {
    enabled: boolean;
    localOnly: boolean;
    authRequired: boolean;
    authConfigured: boolean;
    readOnly: boolean;
    dryRun: boolean;
    refreshSeconds: number;
  };
  operatorChannel: {
    provider: string;
    enabled: boolean;
    realMode: boolean;
    dryRun: boolean;
    replyEnabled: boolean;
    allowedUsersCount: number;
    allowedChatsCount: number;
    replayProtectionHealthy: boolean;
    rejectionTrackingHealthy: boolean;
    rateLimitingHealthy: boolean;
    rejectedLast24h: number;
    lastInboundAt?: string;
    lastOutboundAt?: string;
    warnings: string[];
  };
  firstRealSource: {
    selectedSource: string;
    mode: string;
    ready: boolean;
    readOnlyVerified: boolean;
    credentialsPresent: boolean;
    warnings: string[];
  };
  agents: Array<{
    id: string;
    name: string;
    enabled: boolean;
    status: string;
    permissionLevel: string;
    allowedTools: string[];
    warnings: string[];
  }>;
  agentSummary: { total: number; enabled: number; disabled: number };
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
    highRiskPending: number;
    dryRun: boolean;
    realExecutionAllowed: boolean;
    controlledPending?: number;
    dryRunExecuted?: number;
    realExecuted?: number;
    executionFailed?: number;
  };
  controlledActions?: {
    enabled: boolean;
    dryRun: boolean;
    requireApproval: boolean;
    realExecutionAllowed: boolean;
    githubIssueCreationEnabled: boolean;
    internalNoteCreationEnabled: boolean;
    internalTaskCreationEnabled: boolean;
    localInternalWritesEnabled: boolean;
    pendingApprovals: number;
    actions: ControlledActionDefinition[];
    idempotency: { healthy: boolean; provider: string };
    executions: { dryRun: number; real: number; blocked: number; last: Record<string, unknown> | null };
  };
  founderBetaReadiness?: {
    version: string;
    ready: boolean;
    setupStatus: string;
    setupCounts: { ok: number; warning: number; blocked: number };
    localEnvStatus: string;
    persistenceStatus: string;
    backupStatus: string;
    authLocalOnlyStatus: string;
    controlledActionsStatus: string;
    githubIssueRealCreationStatus: string;
    telegramRealModeStatus: string;
    externalSendsStatus: string;
    writesStatus: string;
    lastDailyRun: string | null;
    lastBackup: string | null;
    warnings: string[];
  };
  realSourceExpansion?: {
    version: string;
    selectedSource: string;
    selectedSourceMode: string;
    sourceModeSummary: string;
    github: Record<string, unknown> & {
      mode?: string;
      enabled?: boolean;
      credentialsPresent?: boolean;
      writesBlocked?: boolean;
      readOnlyVerified?: boolean;
      auditReads?: boolean;
      warnings?: string[];
    };
    businessData: Record<string, unknown> & {
      mode?: string;
      provider?: string;
      credentialsPresent?: boolean;
      writesBlocked?: boolean;
      readOnlyVerified?: boolean;
      piiMasking?: boolean;
      schemaDiscoveryEnabled?: boolean;
      warnings?: string[];
    };
    agentUsage: Record<string, string>;
    blockedWriteFlags: Record<string, boolean>;
    warnings: string[];
  };
  cornerMexLovableConnector?: {
    enabled: boolean;
    discoveryMode: string;
    sourceMode: string;
    projectConfigured: boolean;
    githubRepoConfigured: boolean;
    supabaseConfigured: boolean;
    discoveredEntities: string[];
    discoveredFlows: string[];
    mappedContracts: Array<{
      entity: string;
      confidence: string;
      sourceMode: string;
      missingFields: string[];
      warnings: string[];
    }>;
    contractConfidence: Record<string, string>;
    schemaDiscovery?: {
      status: string;
      migrationFileCount: number;
      tables: string[];
      contracts: string[];
      piiCandidateFields: string[];
      rlsPoliciesDiscovered: string[];
      writeRiskSql: string[];
    };
    supabaseMigrationDiscoveryStatus?: string;
    schemaDiscovered?: boolean;
    discoveredTablesCount?: number;
    mappedContractConfidence?: Record<string, string>;
    rlsEvidenceStatus?: string;
    piiCandidateFields?: string[];
    supabaseRealReadOnlyReadiness?: string;
    piiMasking: boolean;
    writesBlocked: boolean;
    lastReadAuditStatus: string;
    warnings: string[];
    founderNextSteps: string[];
    version?: string;
    configIntakeStatus?: string;
    configCompleteness?: Record<string, boolean>;
    missingFounderConfig?: string[];
    discoveredWriteRiskPaths?: Array<{ pattern: string; risk: string }>;
    exactNextRecommendedAction?: string;
    configIntake?: Record<string, unknown>;
  };
  audit: {
    eventsLast24h: number;
    deniedLast24h: number;
    errorsLast24h: number;
    latest: ControlTowerAuditEvent[];
  };
  dataSources: Array<Record<string, unknown>>;
  contextSources: Array<Record<string, unknown>>;
  ecosystemServices: Array<Record<string, unknown>>;
  businessData: Record<string, unknown>;
  github: Record<string, unknown>;
  openclaw: Record<string, unknown>;
  security: Record<string, unknown> & { warnings: string[] };
  demoMode: boolean;
  betaMode: boolean;
}

export interface ApprovalCenterResponse {
  enabled: boolean;
  dryRun: boolean;
  realExecutionAllowed: boolean;
  summary: Record<string, number>;
  items: ControlTowerApproval[];
}

export interface OperatorAskResponse {
  status: string;
  responseText: string;
  sourceMode: string;
  approvals: { required: boolean };
  auditId?: string;
  warnings: string[];
}
