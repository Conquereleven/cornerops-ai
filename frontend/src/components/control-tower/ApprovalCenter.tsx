import { Check, ShieldAlert, X } from 'lucide-react';
import type { ControlTowerApproval } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

export function ApprovalCenter({
  approvals,
  busyId,
  onDecision,
  onExecuteDryRun,
}: {
  approvals: ControlTowerApproval[];
  busyId?: string;
  onDecision: (id: string, decision: 'approve' | 'reject') => void;
  onExecuteDryRun: (id: string) => void;
}) {
  return <section className="panel ct-panel ct-wide">
    <div className="panel-heading"><div><span className="eyebrow">Human in the loop</span><h2>Approval Center</h2></div><StatusBadge tone="amber">APPROVAL-GATED</StatusBadge></div>
    <div className="table-wrap"><table className="ct-table"><thead><tr><th>Action</th><th>Agent</th><th>Risk</th><th>Data touched</th><th>Status</th><th>Decision</th></tr></thead><tbody>
      {approvals.length ? approvals.map((approval) => <tr key={approval.id}>
        <td><strong className="cell-primary">{approval.requestedAction}</strong><small>{approval.id}</small></td>
        <td>{approval.requestedByAgent}</td>
        <td><StatusBadge tone={approval.riskLevel === 'high' ? 'red' : 'amber'}><ShieldAlert size={10} /> {approval.riskLevel}</StatusBadge></td>
        <td>{approval.dataTouched.join(', ') || 'none disclosed'}</td>
        <td><StatusBadge tone={approval.status === 'pending' ? 'amber' : approval.executionStatus === 'execution_failed' ? 'red' : approval.status === 'approved' ? 'green' : 'red'}>{approval.executionStatus || approval.status}</StatusBadge></td>
        <td>{approval.status === 'pending' ? <div className="ct-actions"><button disabled={busyId === approval.id} onClick={() => onDecision(approval.id, 'approve')}><Check size={13} />Approve dry-run</button><button disabled={busyId === approval.id} onClick={() => onDecision(approval.id, 'reject')}><X size={13} />Reject</button></div> : approval.executable ? <button disabled={busyId === approval.id} onClick={() => onExecuteDryRun(approval.id)}><Check size={13} />Execute dry-run</button> : <span className="ct-muted">Resolved · {approval.executionStatus || 'no execution'}</span>}</td>
      </tr>) : <tr><td className="empty-cell" colSpan={6}>No approvals are pending.</td></tr>}
    </tbody></table></div>
  </section>;
}
