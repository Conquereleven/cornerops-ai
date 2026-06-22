import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ControlTower } from './ControlTower';

const report = {
  status: 'degraded', mode: 'mock', generatedAt: new Date().toISOString(), environment: 'test',
  safety: { failClosed: true, dryRun: true, readOnly: true, writesBlocked: true, externalSendsBlocked: true, piiMasking: true, logSanitization: true, whatsappDisabled: true, customerChannelsDisabled: true, nativeToolsDisabled: true, clawhubExecutionDisabled: true, approvalRealExecutionBlocked: true, warnings: [] },
  webConsole: { enabled: true, localOnly: true, authRequired: true, authConfigured: true, readOnly: true, dryRun: true, refreshSeconds: 300 },
  operatorChannel: { provider: 'telegram', enabled: false, realMode: false, dryRun: true, replyEnabled: true, allowedUsersCount: 0, allowedChatsCount: 0, replayProtectionHealthy: true, rejectionTrackingHealthy: true, rateLimitingHealthy: true, rejectedLast24h: 2, warnings: [] },
  firstRealSource: { selectedSource: 'mock', mode: 'mock', ready: false, readOnlyVerified: false, credentialsPresent: false, warnings: [] },
  agents: [{ id: 'daily-briefing-agent', name: 'Daily Briefing Agent', enabled: true, status: 'ready', permissionLevel: 'read_only', allowedTools: ['read_leads'], warnings: [] }],
  agentSummary: { total: 1, enabled: 1, disabled: 0 },
  approvals: { pending: 1, approved: 0, rejected: 0, highRiskPending: 1, dryRun: true, realExecutionAllowed: false },
  audit: { eventsLast24h: 2, deniedLast24h: 1, errorsLast24h: 0, latest: [{ timestamp: new Date().toISOString(), eventType: 'security_denied', source: 'operator', channel: 'web', policyDecision: 'denied', status: 'denied', auditId: 'audit-safe', preview: '{"input":"[REDACTED_PRIVATE_CONTENT]"}' }] },
  dataSources: [{ id: 'orders', mode: 'mock', enabled: true, connected: true }],
  contextSources: [{ id: 'github', mode: 'mock', enabled: false, recordCount: 0 }],
  ecosystemServices: [], businessData: { mode: 'mock', provider: 'mock', readOnlyVerified: true, mappedEntities: [] },
  github: { mode: 'mock', enabled: false, connected: false, readOnly: true },
  openclaw: { mode: 'dry_run', enabled: false, connected: false }, security: { warnings: [] }, demoMode: true, betaMode: true,
};

const approvalResponse = {
  enabled: true, dryRun: true, realExecutionAllowed: false, summary: { pending: 1 },
  items: [{ id: 'approval-safe', status: 'pending', requestedAction: 'mark_payment_paid', requestedByAgent: 'quotes-orders-agent', riskLevel: 'high', dataTouched: ['orderId'], sourceMode: 'mock', createdAt: new Date().toISOString(), approvalRequiredReason: 'Policy requires approval.', dryRun: true, realExecutionAllowed: false }],
};

describe('Control Tower web console', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('cornerops-console-token', 'browser-test-secret');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const body = url.includes('/approvals') && !url.includes('approve-dry-run')
        ? approvalResponse
        : url.includes('/operator/v0.8/ask')
          ? { status: 'dry_run', responseText: 'No critical risks.', sourceMode: 'mock', approvals: { required: false }, auditId: 'audit-ask', warnings: [] }
          : url.includes('approve-dry-run')
            ? { executed: false, auditId: 'audit-decision' }
            : report;
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  });
  afterEach(() => vi.restoreAllMocks());

  test('renders health, safety, Telegram, sources, approvals, audit, security and ask', async () => {
    render(<ControlTower />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Control Tower' })).toBeInTheDocument());
    expect(await screen.findByText('System health')).toBeInTheDocument();
    expect(screen.getByText('Telegram operator')).toBeInTheDocument();
    expect(screen.getByText('First real source')).toBeInTheDocument();
    expect(screen.getByText('Business data')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Approval Center' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Audit Viewer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Security Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Operator Ask' })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('browser-test-secret');
  });

  test('uses only dry-run approval and policy-routed ask controls', async () => {
    render(<ControlTower />);
    const approve = await screen.findByRole('button', { name: /Approve dry-run/ });
    fireEvent.click(approve);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('approve-dry-run'), expect.objectContaining({ method: 'POST' })));
    fireEvent.click(screen.getByRole('button', { name: 'Show security risks.' }));
    fireEvent.click(screen.getByRole('button', { name: /Ask safely/ }));
    expect(await screen.findByText('No critical risks.')).toBeInTheDocument();
    expect(screen.getByText('Audit: audit-ask')).toBeInTheDocument();
  });
});
