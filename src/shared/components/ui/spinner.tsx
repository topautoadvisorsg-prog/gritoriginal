import React from 'react';
import { cn } from '@/shared/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Branded inline spinner — for actions/buttons where a full skeleton
 * doesn't make sense (form submit, in-line refetch, button busy state).
 *
 * Uses a conic-gradient ring for premium feel vs the spinner-svg default.
 */
export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label, className }) => {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 28 : 18;
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-white/60', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        style={{ width: dim, height: dim }}
        className="brand-spinner-ring"
        aria-hidden="true"
      />
      {label && (
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">
          {label}
        </span>
      )}
      <span className="sr-only">{label || 'Loading'}</span>
    </span>
  );
};
