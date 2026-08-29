import type { ReactNode } from 'react';
import { GlassSurface } from './GlassSurface';

/**
 * Glass filter/action toolbar. Uses role="toolbar" for correct semantics.
 */
export function GlassToolbar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <GlassSurface className="cg-toolbar" role="toolbar" aria-label={label}>
      {children}
    </GlassSurface>
  );
}
