import React, { useState } from 'react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { FighterCorner } from '../event/FighterCorner';
import { HistoryPicksSummary } from './HistoryPicksSummary';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Trophy, Swords, Check, X } from 'lucide-react';
import { getFightTypeLabel } from '@/shared/utils/eventHelpers';

interface UserPick {
  type: 'moneyline' | 'method' | 'round';
  label: string;
  userPick: string;
  actualResult: string;
  isCorrect: boolean;
}

interface FightResult {
  winnerId: string;
  method: string;
  round: number;
}

interface UserNotes {
  fighter1Note?: string;
  fighter2Note?: string;
}

interface HistoryFightCardProps {
  fight: EventFight;
  fighter1: Fighter | undefined;
  fighter2: Fighter | undefined;
  picks: UserPick[];
  result: FightResult;
  userNotes?: UserNotes;
}

export const HistoryFightCard: React.FC<HistoryFightCardProps> = ({
  fight,
  fighter1,
  fighter2,
  picks,
  result,
  userNotes,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fightLabel = getFightTypeLabel(fight.boutOrder, fight.isTitleFight);
  const isMainEvent = fight.boutOrder === 1;
  const isCoMain = fight.boutOrder === 2;

  const correctCount = picks.filter(p => p.isCorrect).length;
  const totalPicks = picks.length;

  // Determine winner for visual indicator
  const winner = result.winnerId === fighter1?.id ? 'fighter1' : 'fighter2';

  // Get moneylines
  const fighter1Moneyline = fighter1?.odds?.moneyline;
  const fighter2Moneyline = fighter2?.odds?.moneyline;

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-300 overflow-hidden",
        "bg-card/80 backdrop-blur-sm",
        isMainEvent && "border-accent/50 shadow-lg shadow-accent/10",
        isCoMain && "border-primary/40",
        !isMainEvent && !isCoMain && "border-border/50",
        isExpanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Fight Type Badge */}
      {fightLabel && (
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-b-md text-[10px] font-bold uppercase tracking-wider",
          isMainEvent && "bg-accent text-accent-foreground",
          isCoMain && "bg-primary text-primary-foreground",
          fight.isTitleFight && !isMainEvent && !isCoMain && "bg-yellow-500/90 text-yellow-900"
        )}>
          <div className="flex items-center gap-1">
            {fight.isTitleFight && <Trophy className="w-3 h-3" />}
            {fightLabel}
          </div>
        </div>
      )}

      {/* Picks Summary Badge (top right) */}
      <div className={cn(
        "absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1",
        correctCount === totalPicks && "bg-green-500/20 text-green-400",
        correctCount === 0 && "bg-red-500/20 text-red-400",
        correctCount > 0 && correctCount < totalPicks && "bg-yellow-500/20 text-yellow-400"
      )}>
        {correctCount === totalPicks ? (
          <Check className="w-3 h-3" />
        ) : correctCount === 0 ? (
          <X className="w-3 h-3" />
        ) : null}
        {correctCount}/{totalPicks}
      </div>

      {/* Main Card Content */}
      <div 
        className="pt-6 pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Weight Class */}
        <div className="text-center mb-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {fight.weightClass}
          </span>
        </div>

        {/* Fighters Row */}
        <div className="flex items-center">
          <div className="relative flex-1">
            <FighterCorner 
              fighter={fighter1} 
              corner="red" 
              moneyline={fighter1Moneyline}
            />
            {/* Winner indicator */}
            {winner === 'fighter1' && (
              <div className="absolute -top-1 left-4">
                <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold uppercase">
                  Winner
                </div>
              </div>
            )}
          </div>
          
          {/* VS Badge */}
          <div className="flex-shrink-0 relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-accent/20 to-primary/20",
              "border border-border/50"
            )}>
              <Swords className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="relative flex-1">
            <FighterCorner 
              fighter={fighter2} 
              corner="blue"
              moneyline={fighter2Moneyline}
            />
            {/* Winner indicator */}
            {winner === 'fighter2' && (
              <div className="absolute -top-1 right-4">
                <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold uppercase">
                  Winner
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-1 text-muted-foreground/60 hover:text-primary transition-colors">
            <span className="text-[10px] uppercase tracking-wider">
              {isExpanded ? 'Hide Picks' : 'View Your Picks'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>
      </div>

      {/* Expanded Content - Picks Summary */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/30 pt-4 animate-fade-in">
          <HistoryPicksSummary
            fighter1={fighter1}
            fighter2={fighter2}
            picks={picks}
            result={result}
            userNotes={userNotes}
          />
        </div>
      )}
    </div>
  );
};
