import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from './App';

const dashboard = {
  metrics: {
    totalConversations: 10,
    totalLeads: 2,
    totalOrders: 3,
    activeProducts: 4,
    workerRuns: 7,
    conversationsToday: 10,
    b2bLeadsCaptured: 2,
    ordersConsulted: 3,
    productsConsulted: 4,
    humanHandoffs: 1,
    activeWorkers: 5,
    totalWorkers: 6,
    firstResponseSeconds: 42,
  },
  workers: [],
  events: [],
  handoffs: [],
  dataSource: { mode: 'mock', requested: false, configured: false },
  generatedAt: new Date().toISOString(),
};

describe('App', () => {
  afterEach(() => vi.restoreAllMocks());

  test('renders the command center with backend data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const body = url.endsWith('/health')
        ? { status: 'ok', service: 'cornerops-ai-workers', dataSource: dashboard.dataSource }
        : dashboard;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: /AI Chat Center/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Backend conectado')).toBeInTheDocument());
    expect(screen.getByText('No hay handoffs pendientes.')).toBeInTheDocument();
  });
});
