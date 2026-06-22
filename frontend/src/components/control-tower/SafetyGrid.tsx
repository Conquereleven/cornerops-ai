import { Ban, Eye, LockKeyhole, Send, ShieldCheck, UserRoundX } from 'lucide-react';
import type { ControlTowerV08Report } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

const items = [
  ['Fail closed', 'failClosed', LockKeyhole],
  ['Read only', 'readOnly', Eye],
  ['Writes blocked', 'writesBlocked', Ban],
  ['External sends blocked', 'externalSendsBlocked', Send],
  ['PII masking', 'piiMasking', UserRoundX],
  ['Log sanitization', 'logSanitization', ShieldCheck],
] as const;

export function SafetyGrid({ safety }: { safety: ControlTowerV08Report['safety'] }) {
  return <section className="ct-safety-grid" aria-label="Safety controls">
    {items.map(([label, key, Icon]) => <article className="ct-safety-item" key={key}>
      <Icon size={16} />
      <span>{label}</span>
      <StatusBadge tone={safety[key] ? 'green' : 'red'}>{safety[key] ? 'ENFORCED' : 'UNSAFE'}</StatusBadge>
    </article>)}
  </section>;
}
