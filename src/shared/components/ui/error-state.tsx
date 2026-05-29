import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { EmptyState } from './empty-state';
import { Button } from './button';

interface ErrorStateProps {
  /** Optional override for the headline. */
  title?: string;
  /** Optional override for the body copy. */
  description?: string;
  /** Called when the user clicks Retry. Usually a react-query refetch. */
  onRetry?: () => void;
  /** Disables the retry button while a refetch is in flight. */
  isRetrying?: boolean;
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

/**
 * Branded load-failure state. Distinct from EmptyState so a network error
 * never looks like "no data" — the user gets a clear retry affordance.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Couldn't load",
  description = 'Something went wrong fetching this. Check your connection and try again.',
  onRetry,
  isRetrying = false,
  variant = 'default',
  className,
}) => {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      variant={variant}
      className={className}
      action={
        onRetry ? (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-[#E8A020] hover:bg-[#d48f00] text-black font-black uppercase tracking-widest rounded-xl"
          >
            <RotateCw className={isRetrying ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        ) : undefined
      }
    />
  );
};
