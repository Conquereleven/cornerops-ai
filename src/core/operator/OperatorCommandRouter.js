const { randomUUID } = require('crypto');
const { sanitizeMessage, sanitizeValue } = require('../security/SecuritySanitizer');
const { OPERATOR_INTENTS } = require('./operatorTypes');

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const hasAny = (text, values) => values.some((value) => text.includes(value));

class OperatorCommandRouter {
  constructor({
    agentAuditService,
    agentOrchestrator,
    approvalService,
    auditLogService,
    config,
    contextHealthService,
    controlTowerService,
    dataHealthService,
    formatter,
    openclawAuditService,
    sessionService,
  } = {}) {
    this.agentAuditService = agentAuditService;
    this.agentOrchestrator = agentOrchestrator;
    this.approvalService = approvalService;
    this.auditLogService = auditLogService;
    this.config = config;
    this.contextHealthService = contextHealthService;
    this.controlTowerService = controlTowerService;
    this.dataHealthService = dataHealthService;
    this.formatter = formatter;
    this.openclawAuditService = openclawAuditService;
    this.sessionService = sessionService;
  }

  classify(textValue) {
    const text = normalizeText(textValue);
    if (!text || hasAny(text, ['help', 'ayuda', 'commands', 'comandos', 'what can you do'])) {
      return { intent: OPERATOR_INTENTS.HELP };
    }
    const approvalId = text.match(/approval-[a-z0-9-]+/i)?.[0];
    if (approvalId && hasAny(text, ['approve', 'aprobar', 'aprueba'])) {
      return { intent: OPERATOR_INTENTS.APPROVAL_ACTION, action: 'approve', approvalId };
    }
    if (approvalId && hasAny(text, ['reject', 'rechazar', 'rechaza'])) {
      return { intent: OPERATOR_INTENTS.APPROVAL_ACTION, action: 'reject', approvalId };
    }
    if (hasAny(text, ['send ', 'envia ', 'enviar ', 'email real', 'whatsapp real', 'message real'])) {
      return { intent: OPERATOR_INTENTS.FORBIDDEN_EXTERNAL_ACTION };
    }
    if (
      hasAny(text, ['mark paid', 'marca como pagad', 'update status', 'cambia el estado', 'delete ', 'borra '])
      || /\bmark\b.*\bpaid\b/.test(text)
      || /\bmarca\b.*\bpagad/.test(text)
    ) {
      return { intent: OPERATOR_INTENTS.FORBIDDEN_WRITE };
    }
    if (hasAny(text, ['pending approvals', 'aprobaciones pendientes', 'show approvals', 'muestra aprobaciones'])) {
      return { intent: OPERATOR_INTENTS.PENDING_APPROVALS };
    }
    if (hasAny(text, ['audit summary', 'audit events', 'audit logs', 'audit errors', 'denied actions', 'errores de audit', 'eventos de auditoria', 'acciones rechazadas'])) {
      return {
        intent: OPERATOR_INTENTS.AUDIT_SUMMARY,
        filter: hasAny(text, ['denied', 'rechazad']) ? 'denied'
          : hasAny(text, ['error', 'errores']) ? 'errors' : 'recent',
      };
    }
    if (
      ['status', 'estado'].includes(text)
      || hasAny(text, ['control tower', 'system health', 'estado del sistema', 'show system', 'status del sistema'])
    ) {
      return { intent: OPERATOR_INTENTS.CONTROL_TOWER_STATUS };
    }
    if (hasAny(text, ['data health', 'salud de datos', 'data sources', 'fuentes de datos'])) {
      return { intent: OPERATOR_INTENTS.DATA_HEALTH };
    }
    if (hasAny(text, ['context health', 'salud del contexto'])) {
      return { intent: OPERATOR_INTENTS.CONTEXT_HEALTH };
    }
    if (hasAny(text, ['security', 'seguridad', 'riesgos', 'risk review'])) {
      return { intent: OPERATOR_INTENTS.SECURITY_AUDIT_SUMMARY };
    }
    if (hasAny(text, ['github', 'codex', 'pull request', 'workflow', 'ci issues'])) {
      return { intent: OPERATOR_INTENTS.GITHUB_ENGINEERING_SUMMARY };
    }
    if (hasAny(text, ['manual payment', 'pagos manuales', 'bank transfer', 'cod review'])) {
      return { intent: OPERATOR_INTENTS.MANUAL_PAYMENTS_REVIEW };
    }
    if (hasAny(text, ['quotes', 'quote ', 'cotizaciones', 'cotizacion'])) {
      return { intent: OPERATOR_INTENTS.QUOTES_REVIEW };
    }
    if (hasAny(text, ['orders', 'ordenes', 'pedidos', 'order review'])) {
      return { intent: OPERATOR_INTENTS.ORDERS_REVIEW };
    }
    if (
      hasAny(text, ['draft', 'prepara', 'prepare'])
      && hasAny(text, ['follow-up', 'follow up', 'mensaje', 'message', 'restaurant', 'restaurante', 'tajin', 'pulparindo'])
    ) {
      return { intent: OPERATOR_INTENTS.B2B_MESSAGE_DRAFT };
    }
    if (hasAny(text, ['b2b', 'leads', 'prospectos']) && hasAny(text, ['follow', 'seguimiento', 'pending', 'pendientes'])) {
      return { intent: OPERATOR_INTENTS.B2B_LEADS_FOLLOWUP };
    }
    if (hasAny(text, ['briefing', 'resumen de hoy', "today's briefing", 'daily summary'])) {
      return { intent: OPERATOR_INTENTS.BRIEFING };
    }
    return { intent: OPERATOR_INTENTS.UNKNOWN };
  }

  async handle(input = {}) {
    const request = this.normalizeInput(input);
    const session = this.sessionService.getOrCreate(request);
    request.sessionId = session.id;
    const route = this.classify(request.text);
    const gate = this.evaluateGate(request);
    const receivedAudit = await this.auditLogService?.record({
      requestId: request.requestId,
      correlationId: request.sessionId,
      eventType: 'operator_request_received',
      dataSource: 'operator_interface',
      operation: route.intent,
      userId: request.operatorId,
      channel: request.channel,
      policyDecision: gate.allowed ? 'allowed' : 'denied',
      status: gate.allowed ? 'pending' : 'denied',
      input: request,
    });
    if (this.config.requireAudit && !receivedAudit) {
      return this.deniedOutput(request, route.intent, 'Operator audit service is required but unavailable.', 'OPERATOR_AUDIT_REQUIRED');
    }
    if (!gate.allowed) {
      const output = this.deniedOutput(request, route.intent, gate.reason, gate.code, receivedAudit?.id);
      await this.completeAudit(request, output);
      return output;
    }
    try {
      const execution = await this.execute(route, request);
      this.sessionService.touch(session.id, { lastIntent: route.intent });
      const baseOutput = {
        requestId: request.requestId,
        sessionId: session.id,
        intent: route.intent,
        agentId: execution.agentId || this.config.defaultAgent,
        status: execution.status || 'success',
        sourceMode: execution.sourceMode || 'disabled',
        proposedActions: execution.proposedActions || [],
        approvals: execution.approvals || { required: false },
        auditId: receivedAudit?.id,
        warnings: [...new Set(execution.warnings || [])],
      };
      baseOutput.responseText = this.formatter.format({
        ...baseOutput,
        answerText: execution.answerText,
        metrics: execution.metrics,
      });
      await this.completeAudit(request, baseOutput);
      return baseOutput;
    } catch (error) {
      const output = {
        requestId: request.requestId,
        sessionId: session.id,
        intent: route.intent,
        agentId: this.config.defaultAgent,
        status: 'error',
        sourceMode: 'disabled',
        approvals: { required: false },
        auditId: receivedAudit?.id,
        warnings: [error.code || 'OPERATOR_REQUEST_ERROR'],
      };
      output.responseText = this.formatter.format({
        ...output,
        answerText: 'CornerOps could not complete this request. No action was executed.',
      });
      await this.completeAudit(request, output, error);
      return output;
    }
  }

  normalizeInput(input) {
    return {
      requestId: input.requestId || `operator-request-${randomUUID().slice(0, 12)}`,
      operatorId: sanitizeMessage(String(input.operatorId || 'local-founder')),
      channel: input.channel || 'cli',
      text: String(input.text || '').trim(),
      sessionId: input.sessionId,
      metadata: input.metadata || {},
    };
  }

  evaluateGate(request) {
    if (!this.config.enabled) return { allowed: false, code: 'OPERATOR_DISABLED', reason: 'Operator interface is disabled.' };
    if (!this.config.allowedChannels.includes(request.channel)) {
      return { allowed: false, code: 'OPERATOR_CHANNEL_DENIED', reason: `Operator channel ${request.channel} is disabled.` };
    }
    if (!this.config.readOnly || !this.config.dryRun) {
      return { allowed: false, code: 'OPERATOR_SAFE_MODE_REQUIRED', reason: 'Operator beta requires read-only and dry-run mode.' };
    }
    if (!this.config.requireApproval) {
      return { allowed: false, code: 'OPERATOR_APPROVAL_REQUIRED', reason: 'Operator approval safeguards are disabled.' };
    }
    return { allowed: true };
  }

  async execute(route, request) {
    switch (route.intent) {
      case OPERATOR_INTENTS.BRIEFING:
      case OPERATOR_INTENTS.B2B_LEADS_FOLLOWUP:
      case OPERATOR_INTENTS.B2B_MESSAGE_DRAFT:
      case OPERATOR_INTENTS.QUOTES_REVIEW:
      case OPERATOR_INTENTS.ORDERS_REVIEW:
      case OPERATOR_INTENTS.MANUAL_PAYMENTS_REVIEW:
      case OPERATOR_INTENTS.GITHUB_ENGINEERING_SUMMARY:
      case OPERATOR_INTENTS.SECURITY_AUDIT_SUMMARY:
        return this.executeAgent(route.intent, request);
      case OPERATOR_INTENTS.CONTROL_TOWER_STATUS:
        return this.controlTowerStatus();
      case OPERATOR_INTENTS.DATA_HEALTH:
        return this.dataHealth();
      case OPERATOR_INTENTS.CONTEXT_HEALTH:
        return this.contextHealth();
      case OPERATOR_INTENTS.PENDING_APPROVALS:
        return this.pendingApprovals();
      case OPERATOR_INTENTS.APPROVAL_ACTION:
        return this.resolveApproval(route, request);
      case OPERATOR_INTENTS.AUDIT_SUMMARY:
        return this.auditSummary(route.filter);
      case OPERATOR_INTENTS.FORBIDDEN_EXTERNAL_ACTION:
        return this.blockedAction('External sends are blocked in interactive beta.');
      case OPERATOR_INTENTS.FORBIDDEN_WRITE:
        return this.blockedAction('Production and business-data writes are blocked in interactive beta.');
      case OPERATOR_INTENTS.HELP:
        return this.help();
      default:
        return this.help('I could not classify that request. Choose one of the supported examples below.');
    }
  }

  async executeAgent(intent, request) {
    const result = await this.agentOrchestrator.handleMessage({
      requestId: request.requestId,
      conversationId: request.sessionId,
      userId: request.operatorId,
      channel: 'internal',
      text: request.text,
      metadata: { ...request.metadata, operatorChannel: request.channel },
    });
    const sourceModes = result.dataSnapshot?.sourceModes || [];
    const warnings = [
      ...(result.dataSnapshot?.missingSources || []).map((source) => `Source unavailable: ${source}.`),
      ...Object.values(result.dataSnapshot?.raw || {}).flatMap((tool) => tool?.warnings || []),
    ];
    const approvalIds = result.approvalId ? [result.approvalId] : [];
    return {
      agentId: result.agentId,
      status: result.status,
      sourceMode: this.formatter.inferSourceMode(sourceModes),
      proposedActions: result.proposedActions || [],
      approvals: {
        required: result.status === 'needs_approval'
          || (result.proposedActions || []).some((action) => action.requiresApproval),
        approvalIds,
      },
      warnings,
      answerText: this.agentAnswer(intent, result),
      metrics: result.dataSnapshot?.metrics || {},
    };
  }

  agentAnswer(intent, result) {
    const metrics = result.dataSnapshot?.metrics || {};
    switch (intent) {
      case OPERATOR_INTENTS.BRIEFING:
        return 'Prepared from the currently available business, GitHub, context-health and audit sources. No unavailable metric was inferred.';
      case OPERATOR_INTENTS.B2B_LEADS_FOLLOWUP:
        return `${metrics.leadsFollowUp || 0} B2B leads need follow-up. Review source confidence and account details before using any draft.`;
      case OPERATOR_INTENTS.B2B_MESSAGE_DRAFT:
        return result.dataSnapshot?.raw?.draft?.payload?.draft
          || 'A B2B follow-up draft could not be produced because the required context is unavailable.';
      case OPERATOR_INTENTS.QUOTES_REVIEW:
        return `${metrics.quotesFollowUp || 0} quotes need follow-up. ${metrics.ordersRequiringAction || 0} related orders require review.`;
      case OPERATOR_INTENTS.ORDERS_REVIEW:
        return `${metrics.ordersRequiringAction || 0} orders require action. All status changes remain blocked.`;
      case OPERATOR_INTENTS.MANUAL_PAYMENTS_REVIEW:
        return `${metrics.manualPayments || 0} manual payment orders require operator review. No payment status was changed.`;
      case OPERATOR_INTENTS.GITHUB_ENGINEERING_SUMMARY:
        return `${metrics.githubIssues || 0} issues, ${metrics.githubPRs || 0} pull requests and ${metrics.workflowRuns || 0} workflow runs are visible. Codex work remains draft-only.`;
      case OPERATOR_INTENTS.SECURITY_AUDIT_SUMMARY:
        return `Security review found ${metrics.businessDataWarnings || 0} business-data warnings, ${metrics.schemaWarnings || 0} schema warnings and ${metrics.contractWarnings || 0} contract warnings. No configuration was changed.`;
      default:
        return result.responseText;
    }
  }

  async controlTowerStatus() {
    const report = await this.controlTowerService.getBetaReport();
    const sourceMode = report.firstRealSource?.mode === 'read_only'
      ? 'real_read_only'
      : report.businessData.mode === 'read_only' ? 'read_only' : 'mock';
    return {
      agentId: 'operator-control-tower',
      status: 'success',
      sourceMode,
      warnings: [...report.businessData.warnings, ...report.security.warnings],
      answerText: [
        `Control Tower status: ${report.status}.`,
        `Beta mode: ${report.betaMode}.`,
        `Business data: ${report.businessData.mode}; read-only verified: ${report.businessData.readOnlyVerified}.`,
        `Writes blocked: ${report.security.writesBlocked}. External sends blocked: ${report.security.externalSendsBlocked}.`,
        `Pending approvals: ${report.approvals.pending}. Audit events (24h): ${report.audit.eventsLast24h}.`,
      ].join('\n'),
    };
  }

  async dataHealth() {
    const report = await this.dataHealthService.getReport();
    const sources = report.sources || [];
    return {
      agentId: 'operator-data-health',
      status: 'success',
      sourceMode: report.businessData?.mode === 'real_read_only' ? 'real_read_only' : 'mock',
      warnings: report.warnings || [],
      answerText: [
        `Data health: ${report.status}.`,
        ...sources.map((source) => `- ${source.id}: ${source.enabled ? source.mode : 'disabled'} (${source.connected ? 'connected' : 'not connected'})`),
      ].join('\n'),
    };
  }

  async contextHealth() {
    const report = await this.contextHealthService.getReport();
    return {
      agentId: 'operator-context-health',
      status: 'success',
      sourceMode: report.mode === 'read_only' ? 'read_only' : 'mock',
      warnings: report.warnings || [],
      answerText: [
        `Context health: ${report.status}.`,
        ...(report.sources || []).map((source) => `- ${source.id}: ${source.enabled ? source.mode : 'disabled'}`),
      ].join('\n'),
    };
  }

  async pendingApprovals() {
    const approvals = await this.approvalService.listPendingApprovals({ limit: 50 });
    return {
      agentId: 'operator-approvals',
      status: 'success',
      sourceMode: 'mock',
      warnings: approvals.length ? [] : ['No pending approvals.'],
      answerText: approvals.length
        ? approvals.map((approval) => this.approvalLine(approval)).join('\n')
        : 'There are no pending approvals.',
    };
  }

  async resolveApproval(route, request) {
    const existing = await this.approvalService.getApproval(route.approvalId);
    if (!existing) return this.blockedAction(`Approval ${route.approvalId} was not found.`);
    const result = route.action === 'approve'
      ? await this.approvalService.approveApproval(route.approvalId, request.operatorId)
      : await this.approvalService.rejectApproval(route.approvalId, request.operatorId);
    return {
      agentId: 'operator-approvals',
      status: 'dry_run',
      sourceMode: 'mock',
      approvals: { required: false, approvalIds: [result.id] },
      warnings: ['Approval status changed in memory only. No underlying action was executed.'],
      answerText: `${this.approvalLine(result)}\nExecution mode: dry_run.`,
    };
  }

  approvalLine(approval) {
    const risk = /send|paid|status|create|deploy/i.test(`${approval.actionType} ${approval.toolName}`)
      ? 'high' : 'controlled';
    return [
      `- ${approval.id}`,
      `action=${approval.actionType || 'unknown'}`,
      `risk=${risk}`,
      `data=${approval.toolName || 'proposal metadata only'}`,
      'source=internal',
      `createdAt=${approval.createdAt}`,
      `status=${approval.status}`,
      'execution=dry_run',
      `reason=${approval.reason || 'CornerOps policy requires human review.'}`,
    ].join(' | ');
  }

  async auditSummary(filter = 'recent') {
    const [domain, agent, openclaw] = await Promise.all([
      this.auditLogService.list({ limit: 100 }),
      Promise.resolve(this.agentAuditService.list({ limit: 100 })),
      Promise.resolve(this.openclawAuditService.list({ limit: 100 })),
    ]);
    let events = [...domain, ...agent, ...openclaw]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (filter === 'denied') {
      events = events.filter((event) => event.status === 'denied' || event.policyDecision === 'denied');
    }
    if (filter === 'errors') {
      events = events.filter((event) => event.status === 'error' || event.errorCode);
    }
    events = sanitizeValue(events.slice(0, 20));
    return {
      agentId: 'operator-audit',
      status: 'success',
      sourceMode: 'mock',
      warnings: events.length ? [] : [`No ${filter} audit events found.`],
      answerText: events.length
        ? events.map((event) => [
          `- ${event.createdAt}`,
          `event=${event.eventType || event.actionType || event.intent || 'unknown'}`,
          `agent=${event.agentId || 'n/a'}`,
          `source=${event.dataSource || event.channel || 'internal'}`,
          `policy=${event.policyDecision || 'n/a'}`,
          `status=${event.status || 'n/a'}`,
          event.errorCode ? `error=${event.errorCode}` : null,
        ].filter(Boolean).join(' | ')).join('\n')
        : `No ${filter} audit events were found.`,
    };
  }

  async help(prefix = '') {
    const report = await this.controlTowerService.getBetaReport();
    const enabled = report.realSourcesEnabled.map((source) => source.id);
    const disabled = report.disabledExternalSources.map((source) => source.id);
    return {
      agentId: 'cornerops-router-agent',
      status: 'success',
      sourceMode: report.firstRealSource?.mode === 'read_only'
        ? 'real_read_only'
        : report.businessData.mode === 'read_only' ? 'read_only' : 'mock',
      warnings: prefix ? [prefix] : [],
      answerText: [
        prefix,
        'Available commands: ask, briefing, control, health, approvals, audit, help.',
        'Examples:',
        '- Give me today\'s briefing.',
        '- Which B2B leads need follow-up?',
        '- Prepare a follow-up draft for restaurants interested in Tajin and Pulparindo.',
        '- Which quotes need follow-up?',
        '- Which orders require action?',
        '- Review GitHub issues and suggest what Codex should do next.',
        '- Show me security risks.',
        `Current mode: ${report.businessData.mode}; operator dry-run/read-only.`,
        `Enabled real sources: ${enabled.length ? enabled.join(', ') : 'none'}.`,
        `Disabled sources: ${disabled.join(', ')}.`,
        `Safety: writesBlocked=${report.security.writesBlocked}, externalSendsBlocked=${report.security.externalSendsBlocked}.`,
        'Blocked: production writes, external sends, crawler syncs, native host tools, ClawHub execution and deploys.',
        'Demos: npm run demo:interactive-beta, npm run demo:beta, npm run demo:control-tower.',
        'Read-only onboarding: docs/runbooks/business-data-read-only-onboarding.md.',
        'Operator docs: docs/operator/quickstart-v0.5.md.',
      ].filter(Boolean).join('\n'),
    };
  }

  blockedAction(reason) {
    return {
      agentId: 'cornerops-router-agent',
      status: 'denied',
      sourceMode: 'disabled',
      warnings: [reason],
      answerText: `${reason} No tool or external action was executed.`,
    };
  }

  deniedOutput(request, intent, reason, code, auditId) {
    const output = {
      requestId: request.requestId,
      sessionId: request.sessionId,
      intent,
      agentId: this.config.defaultAgent,
      status: 'denied',
      sourceMode: 'disabled',
      approvals: { required: false },
      auditId,
      warnings: [code, reason].filter(Boolean),
    };
    output.responseText = this.formatter.format({ ...output, answerText: reason });
    return output;
  }

  async completeAudit(request, output, error) {
    return this.auditLogService?.record({
      requestId: request.requestId,
      correlationId: request.sessionId,
      eventType: 'operator_request_completed',
      dataSource: 'operator_interface',
      operation: output.intent,
      userId: request.operatorId,
      channel: request.channel,
      policyDecision: output.status === 'denied' ? 'denied' : 'allowed',
      status: output.status,
      output: {
        intent: output.intent,
        agentId: output.agentId,
        sourceMode: output.sourceMode,
        approvalRequired: output.approvals?.required,
        warningCount: output.warnings?.length || 0,
      },
      errorCode: error?.code,
      errorMessage: error?.message,
    });
  }
}

module.exports = {
  OperatorCommandRouter,
  hasAny,
  normalizeText,
};
