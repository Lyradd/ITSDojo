'use client';

import { cn } from '@/lib/utils';

type GlowColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

interface GlowCardProps {
  children: React.ReactNode;
  color?: GlowColor;
  className?: string;
  /** Whether the glow animation plays. Default: true */
  active?: boolean;
}

const glowColors: Record<GlowColor, { border: string; glow: string }> = {
  blue:   { border: 'from-blue-400 via-cyan-400 to-blue-600',    glow: 'shadow-blue-500/30' },
  green:  { border: 'from-green-400 via-emerald-400 to-teal-500', glow: 'shadow-green-500/30' },
  purple: { border: 'from-purple-400 via-pink-400 to-violet-600', glow: 'shadow-purple-500/30' },
  orange: { border: 'from-orange-400 via-amber-400 to-red-500',   glow: 'shadow-orange-500/30' },
  pink:   { border: 'from-pink-400 via-rose-400 to-fuchsia-500',  glow: 'shadow-pink-500/30' },
};

/**
 * GlowCard — wraps children with an animated rotating gradient border.
 * The border uses a conic-gradient that spins continuously, creating a "holographic" glow effect.
 */
export function GlowCard({ children, color = 'blue', className, active = true }: GlowCardProps) {
  const colors = glowColors[color];

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative group rounded-xl', className)}>
      {/* Animated rotating gradient border */}
      <div
        className={cn(
          'absolute -inset-[1.5px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          active && 'opacity-100'
        )}
        style={{
          background: `conic-gradient(from var(--angle, 0deg), transparent 20%, var(--glow-1), var(--glow-2), var(--glow-1), transparent 80%)`,
          animation: active ? 'glow-rotate 3s linear infinite' : 'none',
        }}
      >
        {/* Fallback linear gradient border for browsers without @property support */}
        <div className={cn('absolute inset-0 rounded-xl bg-linear-to-r', colors.border, 'opacity-80')} />
      </div>

      {/* Outer glow shadow */}
      <div
        className={cn(
          'absolute -inset-2 rounded-2xl blur-xl opacity-30',
          active && 'opacity-40'
        )}
        style={{
          background: `conic-gradient(from var(--angle, 0deg), transparent 20%, var(--glow-1), var(--glow-2), transparent 80%)`,
          animation: active ? 'glow-rotate 3s linear infinite' : 'none',
        }}
      >
        <div className={cn('absolute inset-0 rounded-2xl bg-linear-to-r', colors.border)} />
      </div>

      {/* Card content — sits above the border */}
      <div className="relative z-10 rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
