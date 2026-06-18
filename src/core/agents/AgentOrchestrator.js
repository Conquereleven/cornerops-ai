const { randomUUID } = require('crypto');
const { BaseAgent } = require('./BaseAgent');
const {
  AGENT_IDS,
  AGENT_STATUSES,
  RISK_LEVELS,
} = require('./agentTypes');

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasAny = (text, words) => words.some((word) => text.includes(word));

class AgentOrchestrator {
  constructor({
    auditService,
    config,
    humanApprovalService,
    memoryService,
    openclawAdapter,
    openclawConfig,
    permissionPolicy,
    registry,
  }) {
    this.auditService = auditService;
    this.config = config;
    this.humanApprovalService = humanApprovalService;
    this.memoryService = memoryService;
    this.openclawAdapter = openclawAdapter;
    this.openclawConfig = openclawConfig;
    this.permissionPolicy = permissionPolicy;
    this.registry = registry;
  }

  async handleMessage(input) {
    const normalizedInput = this.normalizeInput(input);
    const route = this.routeMessage(normalizedInput);
    const agent = this.registry.get(route.agentId)
      || this.registry.get(this.config.defaultAgent)
      || this.registry.get(AGENT_IDS.DAILY_BRIEFING);
    const prompt = this.registry.getBasePrompt(agent.id);
    const proposedActions = this.buildProposedActions(agent, route, normalizedInput);
    const policy = this.permissionPolicy.evaluate({
      agent,
      input: normalizedInput,
      proposedActions,
    });

    if (!policy.allowed) {
      const output = this.output({
        agentId: agent.id,
        status: AGENT_STATUSES.DENIED,
        responseText: `Acción denegada: ${policy.reason}`,
        proposedActions,
        errorCode: 'AGENT_POLICY_DENIED',
      });
      this.audit(normalizedInput, route, policy, output, proposedActions);
      this.memoryService.remember(normalizedInput, output);
      return output;
    }

    if (policy.requiresApproval) {
      const approval = this.humanApprovalService.createApproval({
        actionType: proposedActions[0]?.type || route.intent,
        channel: normalizedInput.channel,
        conversationId: normalizedInput.conversationId,
        createdBy: normalizedInput.userId,
        impact: 'No agent action will execute until a human approves it.',
        payload: {
          agentId: agent.id,
          text: normalizedInput.text,
          proposedActions,
        },
        reason: policy.reason,
        requestId: normalizedInput.requestId,
        toolName: proposedActions[0]?.toolName,
      });
      const responseText = new BaseAgent({ definition: agent, prompt })
        .render({ input: normalizedInput, route, proposedActions });
      const output = this.output({
        agentId: agent.id,
        status: AGENT_STATUSES.NEEDS_APPROVAL,
        responseText,
        proposedActions,
        approvalId: approval.id,
      });
      this.audit(normalizedInput, route, policy, output, proposedActions, approval.id);
      this.memoryService.remember(normalizedInput, output);
      return output;
    }

    if (
      !this.config.enabled ||
      this.config.dryRun ||
      !this.openclawConfig?.enabled ||
      this.openclawConfig?.dryRun
    ) {
      const responseText = new BaseAgent({ definition: agent, prompt })
        .render({ input: normalizedInput, route, proposedActions });
      const output = this.output({
        agentId: agent.id,
        status: AGENT_STATUSES.DRY_RUN,
        responseText,
        proposedActions,
      });
      this.audit(normalizedInput, route, policy, output, proposedActions);
      this.memoryService.remember(normalizedInput, output);
      return output;
    }

    try {
      const openclawResult = await this.openclawAdapter.handleMessage({
        ...normalizedInput,
        actionType: proposedActions[0]?.type || route.intent,
        toolName: proposedActions[0]?.toolName,
        metadata: {
          ...normalizedInput.metadata,
          agentId: agent.id,
          prompt,
        },
      });
      const output = this.output({
        agentId: agent.id,
        status: AGENT_STATUSES.SUCCESS,
        responseText: openclawResult.reply,
        proposedActions,
      });
      this.audit(normalizedInput, route, policy, output, proposedActions);
      this.memoryService.remember(normalizedInput, output);
      return output;
    } catch (error) {
      const output = this.output({
        agentId: agent.id,
        status: AGENT_STATUSES.ERROR,
        responseText: 'OpenClaw no respondió; CornerOps conserva control y no ejecutó acciones.',
        proposedActions,
        errorCode: error.code || 'AGENT_OPENCLAW_ERROR',
      });
      this.audit(normalizedInput, route, policy, output, proposedActions, undefined, error);
      this.memoryService.remember(normalizedInput, output);
      return output;
    }
  }

  normalizeInput(input = {}) {
    return {
      messageId: input.messageId || `msg-${randomUUID().slice(0, 12)}`,
      requestId: input.requestId || `request-${randomUUID().slice(0, 12)}`,
      conversationId: input.conversationId || `conv-${randomUUID().slice(0, 12)}`,
      userId: String(input.userId || 'unknown'),
      userRole: input.userRole || input.metadata?.userRole || 'operator',
      channel: input.channel || 'internal',
      text: String(input.text || '').trim(),
      metadata: input.metadata || {},
    };
  }

  routeMessage(input) {
    const text = normalizeText(input.text);
    if (hasAny(text, ['seguridad', 'security', 'audit', 'auditoria', 'logs', 'rechazad', 'riesgo', 'permisos'])) {
      return this.route(AGENT_IDS.SECURITY_AUDIT, 'security_audit', 0.94, 'Security/audit intent detected.', RISK_LEVELS.LOW);
    }
    if (hasAny(text, ['github', 'codex', 'issue', 'pull request', ' pr ', 'bug', 'ci', 'branch', 'rama', 'documentacion tecnica'])) {
      const risk = hasAny(text, ['crea', 'crear', 'create', 'merge', 'deploy'])
        ? RISK_LEVELS.HIGH
        : RISK_LEVELS.MEDIUM;
      return this.route(AGENT_IDS.DEV_CODEX_GITHUB, 'dev_codex_github', 0.92, 'Technical GitHub/Codex intent detected.', risk);
    }
    if (hasAny(text, ['quote', 'cotizacion', 'cotiza', 'orden', 'pedido', 'pago', 'pagada', 'pagado', 'bank transfer', 'cod', 'contra entrega', 'manual'])) {
      const risk = hasAny(text, ['marca', 'marcar', 'cambia', 'cambiar', 'pagada', 'pagado', 'paid'])
        ? RISK_LEVELS.HIGH
        : RISK_LEVELS.MEDIUM;
      return this.route(AGENT_IDS.QUOTES_ORDERS, 'quotes_orders', 0.91, 'Quote/order/payment intent detected.', risk);
    }
    if (hasAny(text, ['b2b', 'lead', 'restaurante', 'tienda latina', 'distribuidor', 'prospect', 'prospecto', 'follow-up', 'follow up', 'tajin', 'pulparindo', 'valentina', 'proveedor', 'cliente'])) {
      return this.route(AGENT_IDS.B2B_SALES, 'b2b_sales', 0.88, 'B2B sales or follow-up intent detected.', RISK_LEVELS.MEDIUM);
    }
    if (hasAny(text, ['briefing', 'resumen', 'hoy', 'prioridades', 'bloqueos', 'pendientes', 'daily'])) {
      return this.route(AGENT_IDS.DAILY_BRIEFING, 'daily_briefing', 0.9, 'Daily operations briefing intent detected.', RISK_LEVELS.LOW);
    }
    return {
      ...this.route(AGENT_IDS.DAILY_BRIEFING, 'clarify_or_briefing', 0.45, 'Low confidence; safe fallback to briefing.', RISK_LEVELS.LOW),
      needsClarification: true,
    };
  }

  route(agentId, intent, confidence, reason, riskLevel) {
    return { agentId, intent, confidence, reason, riskLevel };
  }

  buildProposedActions(agent, route, input) {
    const text = normalizeText(input.text);
    switch (agent.id) {
      case AGENT_IDS.ROUTER:
        return [];
      case AGENT_IDS.DAILY_BRIEFING:
        return [
          this.action('read_leads', 'read_leads', 'Leer leads nuevos y pendientes.'),
          this.action('read_quotes', 'read_quotes', 'Leer quotes sin seguimiento.'),
          this.action('read_orders', 'read_orders', 'Leer órdenes que requieren acción.'),
          this.action('read_tasks', 'read_tasks', 'Leer tareas técnicas y bloqueos.'),
        ];
      case AGENT_IDS.B2B_SALES:
        return [
          this.action('read_leads', 'read_leads', 'Leer contexto de leads B2B.'),
          this.action('draft_message', 'draft_message', 'Preparar mensaje comercial en borrador.', { mutates: true }),
        ];
      case AGENT_IDS.QUOTES_ORDERS:
        if (hasAny(text, ['pagada', 'pagado', 'paid', 'marca', 'marcar'])) {
          return [
            this.action('read_orders', 'read_orders', 'Leer orden y estado de pago.'),
            this.action('mark_order_paid', 'propose_payment_mark_paid', 'Proponer marcar orden como pagada.', {
              mutates: true,
              requiresApproval: true,
            }),
          ];
        }
        if (hasAny(text, ['cambia', 'cambiar', 'estado'])) {
          return [
            this.action('read_orders', 'read_orders', 'Leer orden y estado actual.'),
            this.action('change_order_status', 'propose_order_status_change', 'Proponer cambio de estado de orden.', {
              mutates: true,
              requiresApproval: true,
            }),
          ];
        }
        return [
          this.action('read_quotes', 'read_quotes', 'Leer quotes sin seguimiento.'),
          this.action('read_orders', 'read_orders', 'Leer órdenes relacionadas.'),
        ];
      case AGENT_IDS.DEV_CODEX_GITHUB:
        if (hasAny(text, ['crea', 'crear', 'create'])) {
          return [
            this.action('draft_issue', 'draft_issue', 'Preparar issue en borrador.'),
            this.action('create_issue', 'create_issue_pending_approval', 'Proponer creación de issue en GitHub.', {
              mutates: true,
              requiresApproval: true,
            }),
          ];
        }
        return [
          this.action('draft_issue', 'draft_issue', 'Preparar issue o prompt técnico en draft.'),
        ];
      case AGENT_IDS.SECURITY_AUDIT:
        return [
          this.action('read_audit_logs', 'read_audit_logs', 'Leer audit logs recientes.'),
          this.action('read_agent_logs', 'read_agent_logs', 'Leer eventos de agentes.'),
          this.action('read_config_summary', 'read_config_summary', 'Leer resumen seguro de configuración.'),
        ];
      default:
        return [];
    }
  }

  action(type, toolName, label, options = {}) {
    return {
      id: `action-${randomUUID().slice(0, 8)}`,
      type,
      toolName,
      label,
      mutates: Boolean(options.mutates),
      requiresApproval: Boolean(options.requiresApproval),
      destructive: Boolean(options.destructive),
      dryRunOnly: true,
    };
  }

  output({ agentId, status, responseText, proposedActions, approvalId, errorCode }) {
    return {
      agentId,
      status,
      responseText,
      proposedActions,
      approvalId,
      errorCode,
    };
  }

  audit(input, route, policy, output, proposedActions, approvalId, error) {
    const auditEvent = this.auditService.record({
      requestId: input.requestId,
      messageId: input.messageId,
      conversationId: input.conversationId,
      userId: input.userId,
      channel: input.channel,
      agentId: output.agentId,
      routedFromAgentId: AGENT_IDS.ROUTER,
      intent: route.intent,
      riskLevel: route.riskLevel,
      status: output.status,
      policyDecision: policy.decision,
      approvalId,
      proposedActions,
      input,
      output,
      errorCode: output.errorCode,
      errorMessage: error?.message,
    });
    if (auditEvent) output.auditId = auditEvent.id;
    return auditEvent;
  }
}

module.exports = {
  AgentOrchestrator,
  normalizeText,
};
