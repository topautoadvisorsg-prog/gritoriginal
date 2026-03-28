import React from 'react';
import { FightRecord } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

interface Last5FightsIndicatorProps {
  fights: FightRecord[];
  className?: string;
  showLabel?: boolean;
}

export const Last5FightsIndicator: React.FC<Last5FightsIndicatorProps> = ({
  fights,
  className,
  showLabel = true,
}) => {
  // Get last 5 fights, most recent first
  const last5Fights = fights.slice(0, 5);

  const getIndicatorClass = (result: string) => {
    switch (result) {
      case 'WIN':
        return 'fight-indicator-win';
      case 'LOSS':
        return 'fight-indicator-loss';
      case 'DRAW':
      case 'NC':
      default:
        return 'fight-indicator-neutral';
    }
  };

  const getTooltipText = (fight: FightRecord) => {
    return `${fight.result} vs ${fight.opponentName} (${fight.method})`;
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLabel && (
        <span className="data-label">Last 5 Fights</span>
      )}
      <div className="flex items-center gap-1.5">
        {last5Fights.map((fight, index) => (
          <div
            key={fight.id || index}
            className="group relative"
          >
            <div
              className={cn(
                'fight-indicator',
                getIndicatorClass(fight.result)
              )}
              title={getTooltipText(fight)}
            />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg">
              <span className={cn(
                'font-bold',
                fight.result === 'WIN' && 'text-win',
                fight.result === 'LOSS' && 'text-loss',
                (fight.result === 'DRAW' || fight.result === 'NC') && 'text-muted-foreground'
              )}>
                {fight.result}
              </span>
              <span className="text-muted-foreground"> vs </span>
              <span className="text-foreground">{fight.opponentName}</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
            </div>
          </div>
        ))}
        
        {/* Fill empty spots if less than 5 fights */}
        {Array.from({ length: 5 - last5Fights.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="fight-indicator bg-muted/30 border border-border/30"
            title="No fight data"
          />
        ))}
      </div>
      
      {/* Quick stats */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-win font-medium">
          {last5Fights.filter(f => f.result === 'WIN').length}W
        </span>
        <span className="text-muted-foreground">-</span>
        <span className="text-loss font-medium">
          {last5Fights.filter(f => f.result === 'LOSS').length}L
        </span>
        {last5Fights.filter(f => f.result === 'DRAW' || f.result === 'NC').length > 0 && (
          <>
            <span className="text-muted-foreground">-</span>
            <span className="text-muted-foreground font-medium">
              {last5Fights.filter(f => f.result === 'DRAW' || f.result === 'NC').length}D
            </span>
          </>
        )}
      </div>
    </div>
  );
};
