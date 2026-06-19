class BaseAgent {
  constructor({ definition, prompt }) {
    this.definition = definition;
    this.prompt = prompt;
  }

  render({ input, route, proposedActions = [], dataSnapshot }) {
    const actionLines = proposedActions.length
      ? proposedActions.map((action) => `- ${action.label}`).join('\n')
      : '- Sin acciones externas propuestas.';
    const approvalRequired = proposedActions.some((action) => action.requiresApproval)
      ? 'Sí'
      : 'No';
    return [
      '## Resultado',
      this.resultText(input, route, dataSnapshot),
      this.dataSnapshotText(dataSnapshot),
      '',
      '## Acciones sugeridas',
      actionLines,
      '',
      '## Requiere aprobación',
      approvalRequired,
      '',
      '## Riesgos o supuestos',
      this.riskText(route),
      '',
      '## Siguiente paso recomendado',
      this.nextStepText(route),
    ].join('\n');
  }

  dataSnapshotText(dataSnapshot) {
    if (!dataSnapshot) return '';
    const lines = [];
    if (dataSnapshot.summary) lines.push('', dataSnapshot.summary);
    if (dataSnapshot.metrics) {
      lines.push('', `Datos consultados: ${Object.entries(dataSnapshot.metrics)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')}.`);
    }
    if (dataSnapshot.missingSources?.length) {
      lines.push('', `Fuentes no disponibles: ${dataSnapshot.missingSources.join(', ')}.`);
    }
    if (dataSnapshot.sourceModes?.length) {
      lines.push('', `Modos de fuente: ${dataSnapshot.sourceModes.join(', ')}.`);
    }
    return lines.join('\n');
  }

  resultText(input, route, dataSnapshot) {
    const text = input.text;
    const metrics = dataSnapshot?.metrics || {};
    switch (this.definition.id) {
      case 'cornerops-router-agent':
        return `Ruta sugerida: ${route.agentId}. Confianza: ${route.confidence}. Razón: ${route.reason}.`;
      case 'daily-briefing-agent':
        return [
          'Briefing operativo preparado exclusivamente con fuentes etiquetadas y read-only.',
          'Top 3 prioridades:',
          `1. Dar seguimiento a ${metrics.leadsFollowUp || 0} leads pendientes.`,
          `2. Revisar ${metrics.quotesFollowUp || 0} quotes sin seguimiento.`,
          `3. Atender ${metrics.ordersRequiringAction || 0} órdenes que requieren acción, incluyendo ${metrics.manualPayments || 0} pagos manuales.`,
        ].join('\n');
      case 'b2b-sales-agent':
        return `Priorización B2B basada en ${metrics.leadsFollowUp || 0} leads pendientes y ${metrics.relatedQuotes || 0} quotes relacionadas. Draft preparado para: "${text}". No se enviará ningún mensaje.`;
      case 'quotes-orders-agent':
        return `Revisión read-only: ${metrics.quotesFollowUp || 0} quotes requieren seguimiento, ${metrics.ordersRequiringAction || 0} órdenes requieren acción y ${metrics.manualPayments || 0} pagos manuales necesitan revisión. Solicitud: "${text}". Los cambios de estado o pago quedan como propuesta pendiente.`;
      case 'dev-codex-github-agent':
        return `Draft técnico preparado para Codex/GitHub: "${text}". No se creará ningún issue ni PR real sin aprobación.`;
      case 'security-audit-agent':
        return `Revisión de seguridad read-only: ${metrics.businessDataWarnings || 0} advertencias de datos, ${metrics.schemaWarnings || 0} de schema y ${metrics.contractWarnings || 0} de contratos. No se modificó configuración.`;
      default:
        return `Solicitud procesada por ${this.definition.id}.`;
    }
  }

  riskText(route) {
    if (route.riskLevel === 'high' || route.riskLevel === 'critical') {
      return `Riesgo ${route.riskLevel}: requiere aprobación y revisión humana antes de cualquier ejecución.`;
    }
    return `Riesgo ${route.riskLevel}. Si faltan datos reales, la respuesta conserva supuestos explícitos.`;
  }

  nextStepText(route) {
    if (route.needsClarification) {
      return 'Pedir aclaración antes de ejecutar cualquier workflow.';
    }
    if (route.riskLevel === 'high' || route.riskLevel === 'critical') {
      return 'Revisar la propuesta y aprobar/rechazar desde HumanApprovalService.';
    }
    return 'Revisar el borrador y decidir si se convierte en acción aprobada.';
  }
}

module.exports = {
  BaseAgent,
};
