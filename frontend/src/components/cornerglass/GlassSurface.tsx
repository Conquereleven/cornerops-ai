import type { ElementType, ReactNode } from 'react';

type Variant = 'default' | 'strong';

/**
 * Base CornerGlass surface. Applies the shared glass token classes; automatically
 * falls back to a solid opaque surface where backdrop-filter is unsupported (CSS-driven).
 * Text and icon children remain fully opaque — never make content translucent.
 */
export function GlassSurface({
  as: Tag = 'div',
  variant = 'default',
  flush = false,
  animate = false,
  className = '',
  children,
  ...rest
}: {
  as?: ElementType;
  variant?: Variant;
  flush?: boolean;
  animate?: boolean;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const classes = [
    'cg-surface',
    variant === 'strong' ? 'cg-surface--strong' : '',
    flush ? 'cg-surface--flush' : '',
    animate ? 'cg-anim-in' : '',
    className,
  ].filter(Boolean).join(' ');
  return <Tag className={classes} {...rest}>{children}</Tag>;
}
