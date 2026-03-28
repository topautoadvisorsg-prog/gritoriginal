import React from 'react';
import { OddsData } from '@/shared/types/fighter';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface BettingOddsProps {
  odds?: OddsData;
  isLive?: boolean;
}

export const BettingOdds: React.FC<BettingOddsProps> = ({ odds, isLive = false }) => {
  if (!odds) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="section-header mb-4">Betting Data</h3>
        <p className="text-sm text-muted-foreground">No betting data available</p>
      </div>
    );
  }

  const isFavorite = odds.moneyline.startsWith('-');

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden">
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-win" />
          </span>
        </div>
      )}

      <h3 className="section-header mb-4">
        Betting Data {isLive && <span className="text-win">(Live)</span>}
      </h3>

      {/* Main Odds Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Moneyline</div>
          <div className={cn(
            'text-3xl font-bold font-mono',
            isFavorite ? 'text-win' : 'text-accent'
          )}>
            {odds.moneyline}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-muted-foreground mb-1">Implied Prob.</div>
          <div className="flex items-center gap-1">
            {isFavorite ? (
              <TrendingUp className="h-4 w-4 text-win" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
            <span className="text-xl font-bold font-mono text-foreground">
              {odds.impliedProbability}%
            </span>
          </div>
        </div>
      </div>

      {/* Odds Breakdown */}
      <div className="space-y-3 font-mono text-sm">
        <div className="flex justify-between items-center pb-2 border-b border-border/30">
          <span className="text-muted-foreground">Over 1.5 Rounds</span>
          <span className="font-bold text-foreground">{odds.overUnder}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-border/30">
          <span className="text-muted-foreground">Method: KO/TKO</span>
          <span className="font-bold text-foreground">{odds.methodKo}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-border/30">
          <span className="text-muted-foreground">Method: Submission</span>
          <span className="font-bold text-foreground">{odds.methodSub}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Method: Decision</span>
          <span className="font-bold text-foreground">{odds.methodDec}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">
          Odds are for informational purposes only. Lines subject to change.
        </p>
      </div>
    </div>
  );
};
