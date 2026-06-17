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
export { API_BASE_URL };
