import type {
  B2BLead,
  ChatResponse,
  Conversation,
  DashboardSnapshot,
  Handoff,
  Integration,
  Order,
  Product,
  WorkerConfig,
  WorkspaceSettings,
  WorkerRun,
  ChatMessage,
  ApprovalCenterResponse,
  ControlTowerV08Report,
  OperatorAskResponse,
  IntelligenceOverview,
  FounderReview,
  ClientSummary,
  SignalSummary,
  AnomalySummary,
  CaseSummary,
  PlaybookSummary,
  ConnectorSummary,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`No pude conectar con el backend de CórnerOps AI. Verifica que el servidor Express esté corriendo. ${detail}`);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `La API respondió con HTTP ${response.status}.`);
  }
  return response.json();
};

export const sendChatMessage = (payload: { userId: string; message: string; conversationId?: string; requestId?: string; channel?: string }) =>
  request<ChatResponse>('/api/chat', { method: 'POST', body: JSON.stringify(payload) });
const queryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const result = search.toString();
  return result ? `?${result}` : '';
};

export const getConversations = (filters: { limit?: number; status?: string; worker?: string; intent?: string } = {}) =>
  request<Conversation[]>(`/api/conversations${queryString(filters)}`);
export const getConversationMessages = (conversationId: string) =>
  request<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
export const getOrders = (filters: { limit?: number; status?: string } = {}) =>
  request<Order[]>(`/api/orders${queryString(filters)}`);
export const getOrder = (orderNumber: string) =>
  request<Order>(`/api/orders/${encodeURIComponent(orderNumber)}`);
export const getProducts = (filters: { limit?: number; category?: string; b2bAvailable?: boolean; lowStock?: boolean } = {}) =>
  request<Product[]>(`/api/products${queryString(filters)}`);
export const searchProducts = (query: string) =>
  request<Product[]>(`/api/products/search${queryString({ q: query })}`);
export const getProduct = (sku: string) =>
  request<Product>(`/api/products/${encodeURIComponent(sku)}`);
export const getLeads = (filters: { limit?: number; status?: string } = {}) =>
  request<B2BLead[]>(`/api/leads${queryString(filters)}`);
export const getLead = (leadId: string) =>
  request<B2BLead>(`/api/leads/${leadId}`);
export const updateLead = (leadId: string, changes: Partial<B2BLead>) =>
  request<B2BLead>(`/api/leads/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
export const getWorkerRuns = (filters: { limit?: number; worker?: string; intent?: string } = {}) =>
  request<WorkerRun[]>(`/api/worker-runs${queryString(filters)}`);
export const getDashboard = () => request<DashboardSnapshot>('/api/dashboard');
export const getWorkers = () => request<WorkerConfig[]>('/api/workers');
export const updateWorker = (workerId: string, changes: Partial<WorkerConfig>) =>
  request<WorkerConfig>(`/api/workers/${workerId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
export const getHandoffs = () => request<Handoff[]>('/api/handoffs');
export const updateHandoff = (handoffId: string, changes: Partial<Handoff>) =>
  request<Handoff>(`/api/handoffs/${handoffId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
export const getIntegrations = () =>
  request<Integration[]>('/api/integrations');
export const updateIntegration = (
  integrationId: string,
  changes: Partial<Integration>,
) =>
  request<Integration>(`/api/integrations/${integrationId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
export const getSettings = () => request<WorkspaceSettings>('/api/settings');
export const updateSettings = (changes: Partial<WorkspaceSettings>) =>
  request<WorkspaceSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
export const getHealth = async () => {
  const startedAt = performance.now();
  const response = await request<{ status: string; service: string; dataSource: { mode: 'mock' | 'supabase' } }>('/health');
  return { ...response, latencyMs: Math.round(performance.now() - startedAt) };
};

const consoleRequest = <T>(path: string, token = '', options?: RequestInit) => request<T>(path, {
  ...options,
  headers: {
    ...(token ? { 'x-cornerops-console-token': token } : {}),
    'x-operator-id': 'founder-web-console',
    ...options?.headers,
  },
});

export const getControlTowerV08 = (token = '') =>
  consoleRequest<ControlTowerV08Report>('/api/control-tower/v1.1/status', token);
export const getControlTowerApprovals = (token = '') =>
  consoleRequest<ApprovalCenterResponse>('/api/control-tower/v0.8/approvals', token);
export const decideApprovalDryRun = (id: string, decision: 'approve' | 'reject', token = '') =>
  consoleRequest<{ executed: false; auditId?: string }>(
    `/api/control-tower/v0.8/approvals/${encodeURIComponent(id)}/${decision}-dry-run`,
    token,
    { method: 'POST', body: '{}' },
  );
export const executeControlledActionDryRun = (id: string, token = '') =>
  consoleRequest<{ status: string; auditId?: string; duplicate?: boolean }>(
    `/api/actions/approvals/${encodeURIComponent(id)}/execute-dry-run`,
    token,
    { method: 'POST', body: '{}' },
  );
export const askControlTower = (text: string, token = '') =>
  consoleRequest<OperatorAskResponse>('/api/operator/v0.8/ask', token, {
    method: 'POST',
    body: JSON.stringify({ text, operatorId: 'founder-web-console' }),
  });

const intelligenceRequest = <T>(path: string, token = '', options?: RequestInit) => request<T>(path, {
  ...options,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  },
});

export const getIntelligenceOverview = (token = '') =>
  intelligenceRequest<IntelligenceOverview>('/api/intelligence/overview', token);
export const getFounderReview = (token = '') =>
  intelligenceRequest<FounderReview>('/api/intelligence/founder-review', token);
export type AuthorizedSellerSummary = { canonicalKey:string;canonicalName:string;authorizationStatus:string;sourceMode:string;captureStatus:string;catalogProductCount:number;pipelinePriority?:string|null;pipelineWave?:string|null;officialSourceUrl?:string|null };
export type AuthorizedSellerNetworkResponse = { sellers:AuthorizedSellerSummary[];writesBlocked:boolean;externalContactBlocked:boolean;purchasingBlocked:boolean;quoteGenerationBlocked:boolean;marketComparisonPerformed:boolean };
export const getAuthorizedSellerNetwork=(token='')=>intelligenceRequest<AuthorizedSellerNetworkResponse>('/api/intelligence/supplygraph/authorized-sellers?limit=32',token);
export const getAuthorizedSellerReadiness=(token='')=>intelligenceRequest<{sellers:Array<{sellerId:string;canonicalKey:string;catalogReady:boolean;comparisonReady:boolean;authorizationStatus:string;sourceVerificationStatus:string}>;writesBlocked:boolean}>('/api/intelligence/supplygraph/seller-readiness',token);
export const getAuthorizedSellerCatalogGaps=(token='')=>intelligenceRequest<{gaps:Array<{sellerId:string;canonicalKey:string;gap:string}>}>('/api/intelligence/supplygraph/seller-catalog-gaps',token);
export const getIntelligenceClients = (token = '') =>
  intelligenceRequest<ClientSummary[]>('/api/intelligence/clients', token);
export const getIntelligenceSignals = (token = '') =>
  intelligenceRequest<SignalSummary[]>('/api/intelligence/signals', token);
export const getIntelligenceAnomalies = (token = '') =>
  intelligenceRequest<AnomalySummary[]>('/api/intelligence/anomalies', token);
export const getIntelligenceCases = (token = '') =>
  intelligenceRequest<CaseSummary[]>('/api/intelligence/cases', token);
export const createCaseFromAnomaly = (anomaly: Partial<AnomalySummary>, token = '') =>
  intelligenceRequest<{ status: string; caseDraft: CaseSummary; auditId?: string; warnings: string[] }>(
    '/api/intelligence/cases/from-anomaly',
    token,
    { method: 'POST', body: JSON.stringify(anomaly) },
  );
export const updateIntelligenceCaseStatus = (caseId: string, status: string, token = '') =>
  intelligenceRequest<{ status: string; caseDraft: Partial<CaseSummary>; auditId?: string; warnings: string[] }>(
    `/api/intelligence/cases/${encodeURIComponent(caseId)}/status`,
    token,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  );
export const getIntelligencePlaybooks = (token = '') =>
  intelligenceRequest<PlaybookSummary[]>('/api/intelligence/playbooks', token);
export const getIntelligenceConnectors = (token = '') =>
  intelligenceRequest<ConnectorSummary[]>('/api/intelligence/connectors', token);
export { API_BASE_URL };
