import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Crown, TrendingUp, TrendingDown, CheckCircle2, Target } from 'lucide-react';

interface FighterComparisonCardProps {
  fighter: Fighter;
  corner: 'red' | 'blue';
  isSelected: boolean;
  onSelect: () => void;
  isPickLocked: boolean;
}

export const FighterComparisonCard: React.FC<FighterComparisonCardProps> = ({
  fighter,
  corner,
  isSelected,
  onSelect,
  isPickLocked,
}) => {
  const record = `${fighter.record.wins}-${fighter.record.losses}${fighter.record.draws > 0 ? `-${fighter.record.draws}` : ''}`;
  const streak = fighter.performance.win_streak > 0 
    ? { type: 'win' as const, count: fighter.performance.win_streak }
    : fighter.performance.loss_streak > 0 
      ? { type: 'loss' as const, count: fighter.performance.loss_streak }
      : null;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group",
        "bg-card border-2",
        isSelected && corner === 'red' && "border-accent ring-2 ring-accent/30 shadow-lg shadow-accent/10",
        isSelected && corner === 'blue' && "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10",
        !isSelected && "border-border/50 hover:border-border",
        isPickLocked && "cursor-default"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className={cn(
          "absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
          corner === 'red' ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        )}>
          <Target className="w-3.5 h-3.5" />
          YOUR PICK
        </div>
      )}

      {/* Corner indicator */}
      <div className={cn(
        "absolute top-0 left-0 w-1.5 h-full",
        corner === 'red' ? "bg-accent" : "bg-primary"
      )} />

      <div className="p-6">
        {/* Fighter Image & Basic Info */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Image Container */}
          <div className={cn(
            "relative w-32 h-40 md:w-40 md:h-52 mb-4 rounded-xl overflow-hidden",
            "bg-gradient-to-b from-muted/50 to-muted/20"
          )}>
            <img
              src={fighter.bodyImageUrl || fighter.imageUrl}
              alt={`${fighter.firstName} ${fighter.lastName}`}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/160x200/1a1a2e/00d4ff?text=${fighter.firstName[0]}${fighter.lastName[0]}`;
              }}
            />
            {fighter.isChampion && (
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-yellow-900" />
              </div>
            )}
          </div>

          {/* Name & Nickname */}
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            {fighter.firstName} {fighter.lastName}
            {fighter.isChampion && <span className="text-yellow-500 ml-1">(C)</span>}
          </h2>
          {fighter.nickname && (
            <p className="text-sm text-muted-foreground italic">"{fighter.nickname}"</p>
          )}

          {/* Record & Streak */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-mono font-bold text-foreground">{record}</span>
            {streak && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                streak.type === 'win' ? "bg-win/20 text-win" : "bg-loss/20 text-loss"
              )}>
                {streak.type === 'win' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {streak.type === 'win' ? 'W' : 'L'}{streak.count}
              </div>
            )}
          </div>

          {/* Moneyline */}
          {fighter.odds?.moneyline && (
            <div className={cn(
              "mt-3 px-4 py-1.5 rounded-lg text-lg font-mono font-bold",
              fighter.odds.moneyline.startsWith('-') 
                ? "bg-primary/10 text-primary border border-primary/30" 
                : "bg-accent/10 text-accent border border-accent/30"
            )}>
              {fighter.odds.moneyline}
            </div>
          )}
        </div>

        {/* Physical Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-card text-center">
            <span className="data-label">Height</span>
            <p className="text-base font-bold text-foreground">{fighter.physicalStats.height || '--'}</p>
          </div>
          <div className="stat-card text-center">
            <span className="data-label">Reach</span>
            <p className="text-base font-bold text-foreground">{fighter.physicalStats.reach || '--'}</p>
          </div>
          <div className="stat-card text-center">
            <span className="data-label">Age</span>
            <p className="text-base font-bold text-foreground">{fighter.physicalStats.age || '--'}</p>
          </div>
        </div>

        {/* Core Identity */}
        <div className="space-y-2 pt-4 border-t border-border/30">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Stance</span>
            <span className="text-sm font-medium text-foreground">{fighter.stance || '--'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Gym</span>
            <span className="text-sm font-medium text-foreground truncate ml-2">{fighter.gym || '--'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Country</span>
            <span className="text-sm font-medium text-foreground">{fighter.nationality || '--'}</span>
          </div>
        </div>
      </div>

      {/* Click to select overlay */}
      {!isPickLocked && !isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className={cn(
            "px-4 py-2 rounded-lg font-bold text-sm",
            corner === 'red' ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          )}>
            Click to Pick
          </div>
        </div>
      )}
    </div>
  );
};
