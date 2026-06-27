import { useCallback, useEffect, useState } from 'react';
import { Activity, Bot, Database, Github, KeyRound, Radio, RefreshCw, ShieldCheck, Waypoints } from 'lucide-react';
import { ApprovalCenter } from '../components/control-tower/ApprovalCenter';
import { AuditViewer } from '../components/control-tower/AuditViewer';
import { OperatorAskPanel } from '../components/control-tower/OperatorAskPanel';
import { SafetyGrid } from '../components/control-tower/SafetyGrid';
import { StatusBadge } from '../components/ui/StatusBadge';
import { askControlTower, decideApprovalDryRun, executeControlledActionDryRun, getControlTowerApprovals, getControlTowerV08 } from '../lib/api';
import type { ApprovalCenterResponse, ControlTowerV08Report } from '../lib/types';

const booleanLabel = (value: unknown) => value ? 'Yes' : 'No';
const textValue = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : booleanLabel(value);
const toneFor = (value: string | boolean) => value === true || ['healthy', 'ready', 'real_read_only'].includes(String(value)) ? 'green' : ['degraded', 'dry_run', 'mock'].includes(String(value)) ? 'amber' : 'red';

function TowerCard({ icon: Icon, label, value, details }: { icon: typeof Activity; label: string; value: string; details: string[] }) {
  return <article className="panel ct-card"><div className="ct-card-head"><span><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong></div><StatusBadge tone={toneFor(value)}>{value}</StatusBadge></div><ul>{details.map((detail) => <li key={detail}>{detail}</li>)}</ul></article>;
}

function SourceTable({ title, sources }: { title: string; sources: Array<Record<string, unknown>> }) {
  return <section className="panel ct-panel"><div className="panel-heading"><div><span className="eyebrow">Read-only inventory</span><h2>{title}</h2></div><StatusBadge tone="neutral">{sources.length} SOURCES</StatusBadge></div><div className="table-wrap"><table className="ct-table"><thead><tr><th>Source</th><th>Mode</th><th>Status</th><th>Records</th></tr></thead><tbody>{sources.length ? sources.map((source, index) => <tr key={String(source.id || index)}><td className="cell-primary">{textValue(source.id || 'unknown')}</td><td>{textValue(source.mode || 'disabled')}</td><td><StatusBadge tone={source.enabled ? 'green' : 'neutral'}>{source.enabled ? 'enabled' : 'disabled'}</StatusBadge></td><td>{textValue(source.recordCount ?? source.connected ?? '—')}</td></tr>) : <tr><td className="empty-cell" colSpan={4}>No sources registered.</td></tr>}</tbody></table></div></section>;
}

export function ControlTower() {
  const [tokenInput, setTokenInput] = useState(() => sessionStorage.getItem('cornerops-console-token') || '');
  const [token, setToken] = useState(() => sessionStorage.getItem('cornerops-console-token') || '');
  const [report, setReport] = useState<ControlTowerV08Report>();
  const [approvals, setApprovals] = useState<ApprovalCenterResponse>({ enabled: false, dryRun: true, realExecutionAllowed: false, summary: {}, items: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyApproval, setBusyApproval] = useState<string>();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextReport, nextApprovals] = await Promise.all([getControlTowerV08(token), getControlTowerApprovals(token)]);
      setReport(nextReport); setApprovals(nextApprovals); setError('');
    } catch (reason) {
      setReport(undefined);
      setApprovals({ enabled: false, dryRun: true, realExecutionAllowed: false, summary: {}, items: [] });
      setError(reason instanceof Error ? reason.message : 'Control Tower is unavailable.');
    } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!report?.webConsole.refreshSeconds) return undefined;
    const timer = window.setInterval(() => void load(), report.webConsole.refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [load, report?.webConsole.refreshSeconds]);
  const connect = () => {
    sessionStorage.setItem('cornerops-console-token', tokenInput);
    setToken(tokenInput);
  };
  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusyApproval(id);
    try { await decideApprovalDryRun(id, decision, token); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Approval decision failed safely.'); }
    finally { setBusyApproval(undefined); }
  };
  const executeDryRun = async (id: string) => {
    setBusyApproval(id);
    try { await executeControlledActionDryRun(id, token); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Controlled action dry-run failed safely.'); }
    finally { setBusyApproval(undefined); }
  };

  return <div className="control-tower-page">
    <header className="ct-title"><div><span className="eyebrow">Internal operator surface · v1.0 founder beta</span><h1>Control Tower</h1><p>Controlled actions, approvals and audit. CornerOps remains the source of truth.</p></div><div className="ct-title-status">{report && <><StatusBadge tone={toneFor(report.status)}>{report.status}</StatusBadge><StatusBadge tone="amber">{report.mode}</StatusBadge><StatusBadge tone="blue">{report.controlledActions?.dryRun === false ? 'CONTROLLED REAL' : 'DRY-RUN'}</StatusBadge></>}<button onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={14} />Refresh</button></div></header>
    <section className="ct-auth panel"><KeyRound size={16} /><div><strong>Local console authentication</strong><small>The token stays in this browser session and is never returned by the API.</small></div><input aria-label="Control Tower token" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Enter local auth token" /><button onClick={connect}>Connect</button></section>
    {error && <div className="ct-locked"><ShieldCheck size={20} /><div><strong>Console locked safely</strong><p>{error}</p><small>Enable the local console and configure its auth token in your private environment.</small></div></div>}
    {report && <>
      <div className="ct-meta"><span>Environment <strong>{report.environment}</strong></span><span>Updated <strong>{new Date(report.generatedAt).toLocaleString()}</strong></span><span>Beta <strong>{booleanLabel(report.betaMode)}</strong></span><span>Demo <strong>{booleanLabel(report.demoMode)}</strong></span></div>
      <SafetyGrid safety={report.safety} />
      {report.founderBetaReadiness && <section className="panel ct-panel ct-wide"><div className="panel-heading"><div><span className="eyebrow">Founder Beta Readiness</span><h2>Local operating posture</h2></div><StatusBadge tone={report.founderBetaReadiness.ready ? 'green' : report.founderBetaReadiness.setupStatus === 'blocked' ? 'red' : 'amber'}>{report.founderBetaReadiness.ready ? 'READY' : report.founderBetaReadiness.setupStatus.toUpperCase()}</StatusBadge></div><div className="ct-safety-grid">{[
        ['Setup', `${report.founderBetaReadiness.setupStatus} · ${report.founderBetaReadiness.setupCounts.ok} ok / ${report.founderBetaReadiness.setupCounts.warning} warn / ${report.founderBetaReadiness.setupCounts.blocked} blocked`],
        ['Local env', report.founderBetaReadiness.localEnvStatus],
        ['Persistence', report.founderBetaReadiness.persistenceStatus],
        ['Backup', report.founderBetaReadiness.backupStatus],
        ['Auth/local-only', report.founderBetaReadiness.authLocalOnlyStatus],
        ['Controlled actions', report.founderBetaReadiness.controlledActionsStatus],
        ['GitHub real issues', report.founderBetaReadiness.githubIssueRealCreationStatus],
        ['Telegram real mode', report.founderBetaReadiness.telegramRealModeStatus],
        ['External sends', report.founderBetaReadiness.externalSendsStatus],
        ['Writes', report.founderBetaReadiness.writesStatus],
        ['Last daily', report.founderBetaReadiness.lastDailyRun || 'not recorded'],
        ['Last backup', report.founderBetaReadiness.lastBackup || 'none'],
      ].map(([label, value]) => <div className="ct-safety-item" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></section>}
      <section className="ct-card-grid">
        <TowerCard icon={Activity} label="System health" value={report.status} details={[`Fail closed: ${booleanLabel(report.safety.failClosed)}`, `Writes blocked: ${booleanLabel(report.safety.writesBlocked)}`, `Audit events 24h: ${report.audit.eventsLast24h || 0}`]} />
        <TowerCard icon={Radio} label="Telegram operator" value={report.operatorChannel.enabled ? 'ready' : 'disabled'} details={[`Real mode: ${booleanLabel(report.operatorChannel.realMode)}`, `Replay / rejection / rate: ${booleanLabel(report.operatorChannel.replayProtectionHealthy)} / ${booleanLabel(report.operatorChannel.rejectionTrackingHealthy)} / ${booleanLabel(report.operatorChannel.rateLimitingHealthy)}`, `Rejected 24h: ${report.operatorChannel.rejectedLast24h} · Last in/out: ${report.operatorChannel.lastInboundAt || 'none'} / ${report.operatorChannel.lastOutboundAt || 'none'}`]} />
        <TowerCard icon={Database} label="First real source" value={report.firstRealSource.mode} details={[`Selected: ${report.firstRealSource.selectedSource}`, `Ready: ${booleanLabel(report.firstRealSource.ready)}`, `Read-only verified: ${booleanLabel(report.firstRealSource.readOnlyVerified)}`]} />
        <TowerCard icon={Database} label="Business data" value={textValue(report.businessData.mode || 'mock')} details={[`Provider: ${textValue(report.businessData.provider || 'mock')}`, `Read-only verified: ${booleanLabel(report.businessData.readOnlyVerified)}`, `Mapped entities: ${Array.isArray(report.businessData.mappedEntities) ? report.businessData.mappedEntities.length : 0}`]} />
        <TowerCard icon={Github} label="GitHub" value={textValue(report.github.mode || 'disabled')} details={[`Enabled: ${booleanLabel(report.github.enabled)}`, `Connected: ${booleanLabel(report.github.connected)}`, `Read only: ${booleanLabel(report.github.readOnly)}`]} />
        <TowerCard icon={Waypoints} label="OpenClaw gateway" value={textValue(report.openclaw.mode || 'disabled')} details={[`Enabled: ${booleanLabel(report.openclaw.enabled)}`, `Connected: ${booleanLabel(report.openclaw.connected)}`, `Ecosystem services: ${report.ecosystemServices.length}`]} />
        <TowerCard icon={Bot} label="Agent registry" value={report.agentSummary.enabled ? 'ready' : 'disabled'} details={[`Enabled: ${report.agentSummary.enabled}/${report.agentSummary.total}`, `Pending approvals: ${report.approvals.pending || 0}`, `High-risk pending: ${report.approvals.highRiskPending || 0}`]} />
        {report.controlledActions && <TowerCard icon={ShieldCheck} label="Controlled actions" value={report.controlledActions.enabled ? (report.controlledActions.dryRun ? 'dry_run' : 'ready') : 'disabled'} details={[`GitHub / notes / tasks: ${booleanLabel(report.controlledActions.githubIssueCreationEnabled)} / ${booleanLabel(report.controlledActions.internalNoteCreationEnabled)} / ${booleanLabel(report.controlledActions.internalTaskCreationEnabled)}`, `Pending: ${report.controlledActions.pendingApprovals} · Dry-run: ${report.controlledActions.executions.dryRun} · Real: ${report.controlledActions.executions.real}`, `Idempotency: ${report.controlledActions.idempotency.healthy ? 'healthy' : 'unavailable'}`]} />}
      </section>
      <section className="panel ct-panel ct-wide"><div className="panel-heading"><div><span className="eyebrow">Permissions inventory</span><h2>Core Agents</h2></div><StatusBadge tone="blue">NO DIRECT WRITES</StatusBadge></div><div className="table-wrap"><table className="ct-table"><thead><tr><th>Agent</th><th>Status</th><th>Permission</th><th>Allowed tools</th></tr></thead><tbody>{report.agents.map((agent) => <tr key={agent.id}><td><strong className="cell-primary">{agent.name}</strong><small>{agent.id}</small></td><td><StatusBadge tone={agent.enabled ? 'green' : 'neutral'}>{agent.status}</StatusBadge></td><td>{agent.permissionLevel}</td><td>{agent.allowedTools.join(', ') || 'none'}</td></tr>)}</tbody></table></div></section>
      <div className="ct-two-column"><SourceTable title="Data Sources" sources={report.dataSources} /><SourceTable title="Context Sources" sources={report.contextSources} /></div>
      {report.controlledActions && <section className="panel ct-panel ct-wide"><div className="panel-heading"><div><span className="eyebrow">Allowlisted surface</span><h2>Controlled Actions v0.9</h2></div><StatusBadge tone={report.controlledActions.realExecutionAllowed ? 'amber' : 'green'}>{report.controlledActions.realExecutionAllowed ? 'REAL GATED' : 'REAL BLOCKED'}</StatusBadge></div><div className="table-wrap"><table className="ct-table"><thead><tr><th>Action</th><th>Status</th><th>Mode</th><th>Risk</th><th>Side effect</th></tr></thead><tbody>{report.controlledActions.actions.map((action) => <tr key={action.id}><td><strong className="cell-primary">{action.name}</strong><small>{action.id}</small></td><td><StatusBadge tone={action.enabled ? 'green' : 'neutral'}>{action.enabled ? 'enabled' : 'disabled'}</StatusBadge></td><td>{action.defaultMode}</td><td>{action.riskLevel}</td><td>{action.externalSideEffect ? 'external' : 'local_internal'}</td></tr>)}</tbody></table></div></section>}
      <ApprovalCenter approvals={approvals.items} busyId={busyApproval} onDecision={(id, decision) => void decide(id, decision)} onExecuteDryRun={(id) => void executeDryRun(id)} />
      <AuditViewer events={report.audit.latest} />
      <section className="panel ct-panel ct-security"><div className="panel-heading"><div><span className="eyebrow">Fail-closed posture</span><h2>Security Dashboard</h2></div><StatusBadge tone={report.safety.warnings.length ? 'amber' : 'green'}>{report.safety.warnings.length} WARNINGS</StatusBadge></div><div className="ct-security-body"><div>{[['WhatsApp disabled', report.safety.whatsappDisabled], ['Customer channels disabled', report.safety.customerChannelsDisabled], ['Native tools disabled', report.safety.nativeToolsDisabled], ['ClawHub execution disabled', report.safety.clawhubExecutionDisabled], ['Approval execution blocked', report.safety.approvalRealExecutionBlocked]].map(([label, state]) => <p key={String(label)}><ShieldCheck size={14} /><span>{label}</span><StatusBadge tone={state ? 'green' : 'red'}>{state ? 'YES' : 'NO'}</StatusBadge></p>)}</div><ul>{report.safety.warnings.length ? report.safety.warnings.map((warning) => <li key={warning}>{warning}</li>) : <li>No critical security warnings.</li>}</ul></div></section>
      <OperatorAskPanel onAsk={(text) => askControlTower(text, token)} />
    </>}
  </div>;
}
