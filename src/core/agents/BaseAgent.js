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
      this.resultText(input, route),
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
    return lines.join('\n');
  }

  resultText(input, route) {
    const text = input.text;
    switch (this.definition.id) {
      case 'cornerops-router-agent':
        return `Ruta sugerida: ${route.agentId}. Confianza: ${route.confidence}. Razón: ${route.reason}.`;
      case 'daily-briefing-agent':
        return 'Briefing operativo preparado en modo read-only: revisar leads nuevos, quotes sin seguimiento, órdenes con acción pendiente, bloqueos técnicos y riesgos del día.';
      case 'b2b-sales-agent':
        return `Draft comercial preparado para la solicitud: "${text}". No se enviará ningún mensaje sin aprobación humana.`;
      case 'quotes-orders-agent':
        return `Resumen operativo de quotes/órdenes preparado para: "${text}". Los cambios de estado o pago quedan como propuesta pendiente.`;
      case 'dev-codex-github-agent':
        return `Draft técnico preparado para Codex/GitHub: "${text}". No se creará ningún issue ni PR real sin aprobación.`;
      case 'security-audit-agent':
        return 'Revisión de seguridad/auditoría preparada en modo read-only: revisar eventos rechazados, acciones sensibles, fallos OpenClaw y riesgos de configuración.';
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
