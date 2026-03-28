import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface PickResult {
  status: 'win' | 'loss' | 'pending';
  eventName?: string;
}

interface ResultIndicatorsProps {
  results: PickResult[];
  className?: string;
  totalBlocks?: number;
}

export const ResultIndicators: React.FC<ResultIndicatorsProps> = ({ 
  results, 
  className, 
  totalBlocks = 12 
}) => {
  // Ensure we always show exactly `totalBlocks` blocks by padding with 'pending' if needed
  const displayResults: PickResult[] = [...results];
  while (displayResults.length < totalBlocks) {
    displayResults.push({ status: 'pending' });
  }
  // If we have more than totalBlocks, just take the most recent ones
  const finalResults = displayResults.slice(-totalBlocks);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {finalResults.map((result, index) => {
        // Mock tooltip text if event is missing
        const isWin = result.status === 'win';
        const isLoss = result.status === 'loss';
        const tooltipText = result.eventName 
          ? `${result.eventName}: ${isWin ? 'Correct' : isLoss ? 'Incorrect' : 'Pending'}`
          : `Pick ${index + 1}: ${isWin ? 'Correct' : isLoss ? 'Incorrect' : 'Pending'}`;

        return (
          <div
            key={index}
            title={tooltipText}
            className={cn(
              "w-5 h-4 md:w-6 md:h-5 rounded-[4px] transition-all duration-300 cursor-help relative group/block overflow-hidden",
              isWin && "bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.3)]",
              isLoss && "bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.3)]",
              result.status === 'pending' && "bg-white/10"
            )}
          >
            {isWin && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-white/30 opacity-0 group-hover/block:opacity-100 transition-opacity" />
            )}
          </div>
        );
      })}
    </div>
  );
};
