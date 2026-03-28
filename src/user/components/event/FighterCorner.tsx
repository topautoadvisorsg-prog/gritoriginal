import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Crown, TrendingUp, TrendingDown } from 'lucide-react';

interface FighterCornerProps {
  fighter: Fighter | undefined;
  corner: 'red' | 'blue';
  moneyline?: string;
}

const getStreakInfo = (fighter: Fighter | undefined): { type: 'win' | 'loss' | 'none'; count: number } => {
  if (!fighter?.performance) return { type: 'none', count: 0 };
  
  const { winStreak, lossStreak } = fighter.performance;
  if (winStreak > 0) return { type: 'win', count: winStreak };
  if (lossStreak > 0) return { type: 'loss', count: lossStreak };
  return { type: 'none', count: 0 };
};

export const FighterCorner: React.FC<FighterCornerProps> = ({ fighter, corner, moneyline }) => {
  if (!fighter) {
    return (
      <div className={cn(
        "flex-1 flex items-center gap-3 p-3",
        corner === 'red' ? 'flex-row' : 'flex-row-reverse'
      )}>
        <div className="w-16 h-16 rounded-lg bg-muted/50 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted/50 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const streak = getStreakInfo(fighter);
  const record = `${fighter.record.wins}-${fighter.record.losses}${fighter.record.draws > 0 ? `-${fighter.record.draws}` : ''}`;

  return (
    <div className={cn(
      "flex-1 flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
      corner === 'red' ? 'flex-row' : 'flex-row-reverse',
      "hover:bg-muted/30"
    )}>
      {/* Fighter Image */}
      <div className={cn(
        "relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2",
        corner === 'red' ? 'border-accent/50' : 'border-primary/50'
      )}>
        <img
          src={fighter.imageUrl}
          alt={`${fighter.firstName} ${fighter.lastName}`}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/80x80/1a1a2e/00d4ff?text=${fighter.firstName[0]}${fighter.lastName[0]}`;
          }}
        />
        {fighter.isChampion && (
          <div className={cn(
            "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"
          )}>
            <Crown className="w-3.5 h-3.5 text-yellow-900" />
          </div>
        )}
      </div>

      {/* Fighter Info */}
      <div className={cn(
        "flex-1 min-w-0",
        corner === 'red' ? 'text-left' : 'text-right'
      )}>
        {/* Name */}
        <h3 className="font-bold text-sm md:text-base text-foreground truncate">
          {fighter.firstName} {fighter.lastName}
          {fighter.isChampion && <span className="text-yellow-500 ml-1">(C)</span>}
        </h3>

        {/* Nickname */}
        {fighter.nickname && (
          <p className="text-xs text-muted-foreground truncate italic">
            "{fighter.nickname}"
          </p>
        )}

        {/* Record & Streak */}
        <div className={cn(
          "flex items-center gap-2 mt-1",
          corner === 'red' ? 'justify-start' : 'justify-end'
        )}>
          <span className="text-xs font-mono font-semibold text-muted-foreground">
            {record}
          </span>
          
          {streak.type !== 'none' && (
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
              streak.type === 'win' 
                ? 'bg-win/20 text-win' 
                : 'bg-loss/20 text-loss'
            )}>
              {streak.type === 'win' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{streak.type === 'win' ? 'W' : 'L'}{streak.count}</span>
            </div>
          )}
        </div>

        {/* Moneyline */}
        {moneyline && (
          <div className={cn(
            "mt-1 inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold",
            moneyline.startsWith('-') ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
          )}>
            {moneyline}
          </div>
        )}
      </div>
    </div>
  );
};
