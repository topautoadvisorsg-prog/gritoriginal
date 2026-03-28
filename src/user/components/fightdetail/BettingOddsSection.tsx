import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { TrendingUp, CircleDollarSign } from 'lucide-react';

interface BettingOddsSectionProps {
  fighter1: Fighter;
  fighter2: Fighter;
}

export const BettingOddsSection: React.FC<BettingOddsSectionProps> = ({ fighter1, fighter2 }) => {
  const hasOdds = fighter1.odds || fighter2.odds;

  if (!hasOdds) {
    return (
      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CircleDollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Betting Odds</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Odds not yet available for this matchup</p>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <CircleDollarSign className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Live Betting Odds</h3>
      </div>

      {/* Odds Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Moneyline */}
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <span className="data-label block mb-3">Moneyline</span>
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              "px-3 py-1.5 rounded-lg font-mono font-bold",
              fighter1.odds?.moneyline?.startsWith('-') 
                ? "bg-primary/10 text-primary" 
                : "bg-accent/10 text-accent"
            )}>
              {fighter1.odds?.moneyline || '--'}
            </div>
            <span className="text-muted-foreground">/</span>
            <div className={cn(
              "px-3 py-1.5 rounded-lg font-mono font-bold",
              fighter2.odds?.moneyline?.startsWith('-') 
                ? "bg-primary/10 text-primary" 
                : "bg-accent/10 text-accent"
            )}>
              {fighter2.odds?.moneyline || '--'}
            </div>
          </div>
        </div>

        {/* Method KO/Sub */}
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <span className="data-label block mb-3">Method (KO/Sub)</span>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KO</span>
              <span className="font-mono font-medium text-foreground">
                {fighter1.odds?.methodKo || '--'} / {fighter2.odds?.methodKo || '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sub</span>
              <span className="font-mono font-medium text-foreground">
                {fighter1.odds?.methodSub || '--'} / {fighter2.odds?.methodSub || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Over/Under */}
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
          <span className="data-label block mb-3">Over/Under Rounds</span>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Over 2.5</span>
              <span className="font-mono font-medium text-foreground">
                {fighter1.odds?.overUnder || '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Under 2.5</span>
              <span className="font-mono font-medium text-foreground">
                {fighter2.odds?.overUnder || '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
