const { sanitizeMessage, sanitizeValue } = require('../security/SecuritySanitizer');
const { OPERATOR_INTENTS } = require('./operatorTypes');

const yesNo = (value) => value ? 'Yes' : 'No';

class OperatorResponseFormatter {
  constructor({
    maxResponseChars = 12000,
    showApprovalStatus = true,
    showAuditId = true,
    showSourceLabels = true,
  } = {}) {
    this.maxResponseChars = maxResponseChars;
    this.showApprovalStatus = showApprovalStatus;
    this.showAuditId = showAuditId;
    this.showSourceLabels = showSourceLabels;
  }

  inferSourceMode(sourceModes = []) {
    const modes = new Set(sourceModes.filter(Boolean).map((mode) => {
      if (mode === 'real_read_only' || mode === 'read_only') return 'read_only';
      if (mode === 'mock' || mode === 'fixture') return 'mock';
      return null;
    }).filter(Boolean));
    if (modes.size > 1) return 'mixed';
    if (modes.has('read_only')) return 'read_only';
    if (modes.has('mock')) return 'mock';
    return 'disabled';
  }

  format({
    answerText,
    approvals = { required: false },
    auditId,
    intent,
    metrics = {},
    proposedActions = [],
    sourceMode = 'disabled',
    warnings = [],
  } = {}) {
    const safeAnswer = sanitizeMessage(answerText || 'No answer is available.');
    const safeWarnings = sanitizeValue(warnings).filter(Boolean);
    let sections;
    if (intent === OPERATOR_INTENTS.BRIEFING) {
      sections = this.briefingSections(safeAnswer, metrics, sourceMode, safeWarnings);
    } else if (intent === OPERATOR_INTENTS.B2B_MESSAGE_DRAFT) {
      sections = [
        '## Draft',
        safeAnswer,
        '',
        '## Why this message',
        'Prepared from the currently available, source-labeled lead and quote context.',
      ];
    } else {
      sections = ['## Answer', safeAnswer];
    }
    if (this.showSourceLabels && intent !== OPERATOR_INTENTS.BRIEFING) {
      sections.push('', '## Source Mode', sourceMode);
    }
    sections.push('', '## Suggested Actions', proposedActions.length
      ? proposedActions.map((action) => `- ${sanitizeMessage(action.label || action.type)}`).join('\n')
      : '- None.');
    if (this.showApprovalStatus) {
      sections.push('', '## Requires Approval', yesNo(approvals.required));
      if (approvals.approvalIds?.length) {
        sections.push(`approvalIds: ${approvals.approvalIds.join(', ')}`);
      }
    }
    sections.push('', '## Warnings', safeWarnings.length
      ? safeWarnings.map((warning) => `- ${warning}`).join('\n')
      : '- None.');
    if (this.showAuditId) sections.push('', '## Audit', `auditId: ${auditId || 'unavailable'}`);
    return this.truncate(sections.join('\n'));
  }

  briefingSections(answerText, metrics, sourceMode, warnings) {
    return [
      '## Executive Briefing',
      answerText,
      '',
      '## Top 3 Priorities',
      `1. Follow up ${metrics.leadsFollowUp || 0} leads.`,
      `2. Review ${metrics.quotesFollowUp || 0} quotes.`,
      `3. Review ${metrics.ordersRequiringAction || 0} orders, including ${metrics.manualPayments || 0} manual payments.`,
      '',
      '## Leads',
      `${metrics.leadsFollowUp || 0} need follow-up.`,
      '',
      '## Quotes',
      `${metrics.quotesFollowUp || 0} need follow-up.`,
      '',
      '## Orders',
      `${metrics.ordersRequiringAction || 0} require action.`,
      '',
      '## GitHub / Codex',
      `${metrics.githubIssues || 0} issues and ${metrics.githubPRs || 0} pull requests are visible.`,
      '',
      '## Risks',
      `${(metrics.businessDataWarnings || 0) + (metrics.contextHealthWarnings || 0)} source/health warnings.`,
      '',
      '## Recommended Next Step',
      'Review the top priorities and keep every proposed action in draft or approval-only mode.',
      '',
      '## Source Mode / Warnings',
      sourceMode,
      ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ['- None.']),
    ];
  }

  truncate(value) {
    const text = String(value || '');
    if (text.length <= this.maxResponseChars) return text;
    return `${text.slice(0, this.maxResponseChars - 80)}\n\n[Response truncated by operator safety limit]`;
  }
}

module.exports = { OperatorResponseFormatter, yesNo };
