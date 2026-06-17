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
