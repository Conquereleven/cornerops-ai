import type { ReactNode } from 'react';

export function StatusBadge({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'blue' | 'amber' | 'red' | 'neutral' }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
