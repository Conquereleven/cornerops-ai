import { FormEvent, useState } from 'react';
import { CornerDownLeft, Sparkles } from 'lucide-react';
import type { OperatorAskResponse } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

const prompts = ['Give me today’s briefing.', 'Which B2B leads need follow-up?', 'Show security risks.', 'Show pending approvals.'];

export function OperatorAskPanel({ onAsk }: { onAsk: (text: string) => Promise<OperatorAskResponse> }) {
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState<OperatorAskResponse>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError('');
    try { setAnswer(await onAsk(text.trim())); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Request failed safely.'); }
    finally { setBusy(false); }
  };
  return <section className="panel ct-panel ct-ask">
    <div className="panel-heading"><div><span className="eyebrow">Policy-routed</span><h2>Operator Ask</h2></div><StatusBadge tone="blue">READ ONLY</StatusBadge></div>
    <form onSubmit={(event) => void submit(event)} className="ct-ask-form"><textarea value={text} maxLength={12000} onChange={(event) => setText(event.target.value)} placeholder="Ask CornerOps about today’s operations…" /><button disabled={!text.trim() || busy}><Sparkles size={15} />{busy ? 'Routing…' : 'Ask safely'}<CornerDownLeft size={13} /></button></form>
    <div className="ct-prompts">{prompts.map((prompt) => <button key={prompt} onClick={() => setText(prompt)}>{prompt}</button>)}</div>
    {error && <div className="dashboard-alert">{error}</div>}
    {answer && <div className="ct-answer"><div><StatusBadge tone={answer.status === 'denied' ? 'red' : 'green'}>{answer.status}</StatusBadge><StatusBadge tone="blue">{answer.sourceMode}</StatusBadge><span>Approval: {answer.approvals.required ? 'required' : 'no'}</span><span>Audit: {answer.auditId || 'unavailable'}</span></div><pre>{answer.responseText}</pre></div>}
  </section>;
}
