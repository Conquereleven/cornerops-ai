const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const badge = (value) => `<span class="badge ${value === true || ['healthy', 'ready', 'real_read_only'].includes(value) ? 'ok' : 'warn'}">${escapeHtml(value)}</span>`;
const rows = (items, fields) => items.length
  ? items.map((item) => `<tr>${fields.map((field) => `<td>${escapeHtml(item[field] ?? '')}</td>`).join('')}</tr>`).join('')
  : `<tr><td colspan="${fields.length}">No events available.</td></tr>`;

const renderControlTowerHtml = (report) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CornerOps Control Tower v0.8</title><style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui;background:#081018;color:#d7e0e8}body{max-width:1440px;margin:auto;padding:28px}header,.card{background:#101923;border:1px solid #24313e;border-radius:10px}header{padding:22px;margin-bottom:14px}h1{margin:0 0 8px;font-size:24px}h2{font-size:14px;margin:0 0 14px;color:#fff}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{padding:16px;min-width:0}.metric{font-size:24px;font-weight:750}.muted{color:#84919e;font-size:12px}.badge{display:inline-block;padding:4px 7px;border-radius:5px;background:#382d16;color:#f2c46b;font-size:11px}.badge.ok{background:#123322;color:#55dc82}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:8px;border-bottom:1px solid #202d39;text-align:left;word-break:break-word}th{color:#84919e}.wide{grid-column:1/-1}ul{padding-left:18px;color:#aab7c3;font-size:12px}@media(max-width:800px){.grid{grid-template-columns:1fr}body{padding:14px}}
</style></head><body>
<header><div class="muted">INTERNAL · LOCAL REPORT · READ ONLY</div><h1>CornerOps AI Control Tower v0.8</h1><div>${badge(report.status)} ${badge(report.mode)} ${badge(report.safety.dryRun ? 'dry_run' : 'unsafe')}</div><p class="muted">Generated ${escapeHtml(report.generatedAt)}. This report cannot execute actions.</p></header>
<main class="grid">
<section class="card"><h2>System Safety</h2><div class="metric">${escapeHtml(report.status)}</div><p class="muted">Fail closed: ${report.safety.failClosed} · Read only: ${report.safety.readOnly} · Writes blocked: ${report.safety.writesBlocked}</p></section>
<section class="card"><h2>Telegram Operator</h2><div class="metric">${report.operatorChannel.enabled ? 'Enabled' : 'Disabled'}</div><p class="muted">Replay: ${report.operatorChannel.replayProtectionHealthy} · Rejections: ${report.operatorChannel.rejectionTrackingHealthy} · Rate limit: ${report.operatorChannel.rateLimitingHealthy}</p></section>
<section class="card"><h2>First Real Source</h2><div class="metric">${escapeHtml(report.firstRealSource.selectedSource)}</div><p class="muted">Mode: ${escapeHtml(report.firstRealSource.mode)} · Ready: ${report.firstRealSource.ready} · Read-only verified: ${report.firstRealSource.readOnlyVerified}</p></section>
<section class="card"><h2>Business Data</h2><div class="metric">${escapeHtml(report.businessData.mode || 'mock')}</div><p class="muted">Provider: ${escapeHtml(report.businessData.provider || 'mock')} · Read-only verified: ${Boolean(report.businessData.readOnlyVerified)}</p></section>
<section class="card"><h2>Agents</h2><div class="metric">${report.agentSummary.enabled}/${report.agentSummary.total}</div><p class="muted">Enabled agents</p></section>
<section class="card"><h2>Approval Center</h2><div class="metric">${report.approvals.pending || 0}</div><p class="muted">Pending · High risk: ${report.approvals.highRiskPending || 0} · Real execution blocked</p></section>
<section class="card"><h2>Audit Viewer</h2><div class="metric">${report.audit.eventsLast24h || 0}</div><p class="muted">Denied: ${report.audit.deniedLast24h || 0} · Errors: ${report.audit.errorsLast24h || 0}</p></section>
<section class="card wide"><h2>Security Warnings</h2><ul>${report.safety.warnings.length ? report.safety.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : '<li>No critical warnings.</li>'}</ul></section>
<section class="card wide"><h2>Data Sources</h2><table><thead><tr><th>Source</th><th>Mode</th><th>Enabled</th></tr></thead><tbody>${rows(report.dataSources, ['id','mode','enabled'])}</tbody></table></section>
<section class="card wide"><h2>Context Sources</h2><table><thead><tr><th>Source</th><th>Mode</th><th>Status</th></tr></thead><tbody>${rows(report.contextSources, ['id','mode','status'])}</tbody></table></section>
<section class="card wide"><h2>OpenClaw Ecosystem</h2><table><thead><tr><th>Service</th><th>Mode</th><th>Status</th></tr></thead><tbody>${rows(report.ecosystemServices, ['id','mode','status'])}</tbody></table></section>
<section class="card wide"><h2>Latest Sanitized Audit Events</h2><table><thead><tr><th>Timestamp</th><th>Event</th><th>Source</th><th>Status</th><th>Audit ID</th></tr></thead><tbody>${rows(report.audit.latest.slice(0, 25), ['timestamp','eventType','source','status','auditId'])}</tbody></table></section>
<section class="card wide"><h2>Next Steps</h2><ul><li>Keep the web console local-only and authenticated.</li><li>Review pending high-risk approvals without executing them.</li><li>Provision a verified read-only source only through its runbook.</li></ul></section>
</main></body></html>`;

module.exports = { escapeHtml, renderControlTowerHtml };
