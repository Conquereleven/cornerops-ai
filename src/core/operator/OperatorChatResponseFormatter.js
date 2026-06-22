const { sanitizeMessage, sanitizeValue } = require('../security/SecuritySanitizer');

class OperatorChatResponseFormatter {
  constructor({ maxMessageChars = 12000 } = {}) {
    this.maxMessageChars = maxMessageChars;
  }

  format(output = {}) {
    const approval = output.approvals?.required || output.requiresApproval
      ? 'required' : 'not required';
    const warnings = [...new Set(sanitizeValue(output.warnings || []).filter(Boolean))];
    const lines = [
      'CornerOps AI',
      `Status: ${output.status || 'error'}`,
      '',
      'Answer:',
      sanitizeMessage(output.answerText || this.extractAnswer(output.responseText) || 'No answer is available.'),
      '',
      `Source: ${output.sourceMode || 'disabled'}`,
      `Approval: ${approval}`,
      `Audit: ${output.auditId || 'unavailable'}`,
      'Warnings:',
      ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ['- None.']),
    ];
    return this.truncate(lines.join('\n'));
  }

  extractAnswer(value) {
    const text = String(value || '');
    const match = text.match(/## (?:Answer|Executive Briefing|Draft)\n([\s\S]*?)(?:\n\n##|$)/);
    return match?.[1]?.trim() || text.split('\n\n##')[0].replace(/^## [^\n]+\n/, '').trim();
  }

  truncate(value) {
    if (value.length <= this.maxMessageChars) return value;
    const suffix = '\n\n[Response summarized by channel safety limit. Use the CLI or Control Tower for detail.]';
    return `${value.slice(0, Math.max(0, this.maxMessageChars - suffix.length))}${suffix}`;
  }
}

module.exports = { OperatorChatResponseFormatter };
