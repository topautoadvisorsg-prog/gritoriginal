import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DataFreshnessIndicatorProps {
  dataUpdatedAt?: number;
  isFetching?: boolean;
  className?: string;
}

/**
 * Displays when data was last updated and shows refreshing state.
 * Helps users understand data freshness and when backend changes will appear.
 */
export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  dataUpdatedAt,
  isFetching = false,
  className,
}) => {
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs",
      isFetching ? "text-[#E8A020]" : "text-white/40",
      className
    )}>
      {isFetching ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="font-bold uppercase tracking-wider">Refreshing...</span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3" />
          <span className="font-bold uppercase tracking-wider">
            Updated: {dataUpdatedAt ? formatTime(dataUpdatedAt) : 'N/A'}
          </span>
        </>
      )}
    </div>
  );
};
