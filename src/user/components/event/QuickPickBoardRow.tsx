import React from 'react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

interface QuickPickBoardRowProps {
  fight: EventFight;
  fighters: Map<string, Fighter>;
  pick?: {
    pickedFighterId: string;
  };
  onQuickPick: (fight: EventFight, fighterId: string) => void;
}

export const QuickPickBoardRow: React.FC<QuickPickBoardRowProps> = ({
  fight,
  fighters,
  pick,
  onQuickPick,
}) => {
  const f1 = fighters.get(fight.fighter1Id);
  const f2 = fighters.get(fight.fighter2Id);

  return (
    <div className="flex items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#E8A020]/30 transition-all">
      {/* Fighter 1 */}
      <button
        onClick={() => onQuickPick(fight, fight.fighter1Id)}
        className={cn(
          "flex-1 flex items-center gap-2 py-2 px-3 rounded-lg transition-all",
          pick?.pickedFighterId === fight.fighter1Id
            ? "bg-win/20 border-2 border-win"
            : "bg-white/[0.03] border-2 border-transparent hover:border-white/20"
        )}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
          {f1?.imageUrl ? (
            <img src={f1.imageUrl} alt={f1.lastName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10" />
          )}
        </div>
        <span className={cn(
          "text-xs font-black uppercase tracking-tight truncate",
          pick?.pickedFighterId === fight.fighter1Id ? "text-win" : "text-white/70"
        )}>
          {f1?.lastName || 'TBD'}
        </span>
      </button>

      {/* VS Divider */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-[9px] font-bold text-[#E8A020]">VS</span>
      </div>

      {/* Fighter 2 */}
      <button
        onClick={() => onQuickPick(fight, fight.fighter2Id)}
        className={cn(
          "flex-1 flex items-center gap-2 py-2 px-3 rounded-lg transition-all",
          pick?.pickedFighterId === fight.fighter2Id
            ? "bg-win/20 border-2 border-win"
            : "bg-white/[0.03] border-2 border-transparent hover:border-white/20"
        )}
      >
        <span className={cn(
          "text-xs font-black uppercase tracking-tight truncate",
          pick?.pickedFighterId === fight.fighter2Id ? "text-win" : "text-white/70"
        )}>
          {f2?.lastName || 'TBD'}
        </span>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
          {f2?.imageUrl ? (
            <img src={f2.imageUrl} alt={f2.lastName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10" />
          )}
        </div>
      </button>
    </div>
  );
};
