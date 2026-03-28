import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Fighter } from '@/shared/types/fighter';
import { Check, X, StickyNote } from 'lucide-react';

interface UserPick {
  type: 'moneyline' | 'method' | 'round';
  label: string;
  userPick: string;
  actualResult: string;
  isCorrect: boolean;
}

interface FightResult {
  winnerId: string;
  method: string; // 'KO/TKO' | 'Submission' | 'Decision'
  round: number;
}

interface UserNotes {
  fighter1Note?: string;
  fighter2Note?: string;
}

interface HistoryPicksSummaryProps {
  fighter1: Fighter | undefined;
  fighter2: Fighter | undefined;
  picks: UserPick[];
  result: FightResult;
  userNotes?: UserNotes;
  className?: string;
}

export const HistoryPicksSummary: React.FC<HistoryPicksSummaryProps> = ({
  fighter1,
  fighter2,
  picks,
  result,
  userNotes,
  className,
}) => {
  const correctCount = picks.filter(p => p.isCorrect).length;
  const totalPicks = picks.length;
  
  const winner = result.winnerId === fighter1?.id ? fighter1 : fighter2;
  const winnerName = winner ? `${winner.firstName} ${winner.lastName}` : 'Unknown';

  // Determine summary color
  const getSummaryColor = () => {
    if (correctCount === totalPicks) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (correctCount === 0) return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Badge */}
      <div className="flex items-center justify-center">
        <div className={cn(
          "px-4 py-2 rounded-full border text-sm font-bold",
          getSummaryColor()
        )}>
          {correctCount} / {totalPicks} Correct
        </div>
      </div>

      {/* Actual Result */}
      <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Actual Result</span>
        <p className="text-sm font-semibold text-foreground mt-1">
          {winnerName} wins via {result.method} (R{result.round})
        </p>
      </div>

      {/* Picks Grid */}
      <div className="grid grid-cols-3 gap-3">
        {picks.map((pick, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border text-center transition-all",
              pick.isCorrect 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}
          >
            <div className="flex items-center justify-center mb-2">
              {pick.isCorrect ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              {pick.label}
            </span>
            <p className={cn(
              "text-sm font-semibold",
              pick.isCorrect ? "text-green-400" : "text-red-400"
            )}>
              {pick.userPick}
            </p>
            {!pick.isCorrect && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Actual: {pick.actualResult}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* User Notes */}
      {(userNotes?.fighter1Note || userNotes?.fighter2Note) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <StickyNote className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Your Notes</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {userNotes.fighter1Note && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <span className="text-[10px] uppercase tracking-widest text-accent block mb-1">
                  {fighter1?.firstName} {fighter1?.lastName}
                </span>
                <p className="text-xs text-muted-foreground italic">
                  "{userNotes.fighter1Note}"
                </p>
              </div>
            )}
            {userNotes.fighter2Note && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <span className="text-[10px] uppercase tracking-widest text-primary block mb-1">
                  {fighter2?.firstName} {fighter2?.lastName}
                </span>
                <p className="text-xs text-muted-foreground italic">
                  "{userNotes.fighter2Note}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
