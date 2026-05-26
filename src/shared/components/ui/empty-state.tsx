import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

/**
 * Branded empty state. Replaces the scattered ad-hoc "No X found" blocks
 * across the app with a consistent, premium pattern.
 *
 * variant:
 *  - default — generous padding, centered, for full-page empty
 *  - compact — tighter, for empty list inside a section
 *  - card    — bordered glass-card wrapper for empty widget panels
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}) => {
  const isCard = variant === 'card';
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        isCompact ? 'py-10 px-6 gap-2' : 'py-16 px-8 gap-3',
        isCard && 'rounded-2xl border border-white/8 bg-[#0e0e12]/60 backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full mb-2',
          isCompact ? 'w-12 h-12' : 'w-16 h-16',
          'bg-gradient-to-br from-white/[0.04] to-transparent',
          'border border-white/8',
          'text-[#E8A020]/70',
        )}
      >
        <Icon className={isCompact ? 'w-5 h-5' : 'w-7 h-7'} strokeWidth={1.5} />
      </div>

      <h3
        className={cn(
          'font-black uppercase tracking-tight text-white display-font italic',
          isCompact ? 'text-base' : 'text-xl',
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-white/50 max-w-sm leading-relaxed',
            isCompact ? 'text-xs' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};
