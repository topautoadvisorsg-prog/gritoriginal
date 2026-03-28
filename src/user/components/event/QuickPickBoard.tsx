import React, { useState } from 'react';
import { Event, EventFight, Fighter } from '@/shared/types/fighter';
import { QuickPickBoardRow } from './QuickPickBoardRow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface QuickPickBoardProps {
  event: Event;
  fights: EventFight[];
  fighters: Map<string, Fighter>;
  picks: any[];
}

export const QuickPickBoard: React.FC<QuickPickBoardProps> = ({
  event,
  fights,
  fighters,
  picks,
}) => {
  const queryClient = useQueryClient();
  const [isBulkMode, setIsBulkMode] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { fightId: string; pickedFighterId: string }) => {
      const res = await fetch(`/api/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fightId: data.fightId,
          pickedFighterId: data.pickedFighterId,
          units: 1, // Default to 1 unit for quick picks
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save pick');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/picks/event', event.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleQuickPick = (fight: EventFight, fighterId: string) => {
    mutation.mutate({ fightId: fight.id, pickedFighterId: fighterId });
  };

  const sortedFights = [...fights].sort((a, b) => a.boutOrder - b.boutOrder);
  const totalFights = sortedFights.length;
  const pickedFights = sortedFights.filter(f => picks.some(p => p.fightId === f.id)).length;
  const progressPercent = totalFights > 0 ? (pickedFights / totalFights) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header with Progress */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Quick Pick Board</span>
          <span className="text-[11px] font-black text-win">{pickedFights} / {totalFights} Picked</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-win transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[9px] text-white/40 mt-2 uppercase tracking-widest">
          Click a fighter to make your pick • One-click to update
        </p>
      </div>

      {/* Loading State */}
      {mutation.isPending && (
        <div className="fixed top-4 right-4 bg-black border border-[#E8A020] text-[#E8A020] px-4 py-2 rounded-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Saving...</span>
        </div>
      )}

      {/* Fight Rows */}
      <div className="grid gap-2">
        {sortedFights.map((fight) => (
          <QuickPickBoardRow
            key={fight.id}
            fight={fight}
            fighters={fighters}
            pick={picks.find(p => p.fightId === fight.id)}
            onQuickPick={handleQuickPick}
          />
        ))}
      </div>

      {/* Completion Message */}
      {pickedFights === totalFights && (
        <div className="mt-6 p-4 rounded-xl bg-win/10 border border-win/30 text-center">
          <CheckCircle2 className="w-6 h-6 text-win mx-auto mb-2" />
          <p className="text-sm font-black text-win uppercase tracking-widest">All Picks Complete!</p>
          <p className="text-[9px] text-white/50 mt-1">You're ready for this event</p>
        </div>
      )}
    </div>
  );
};
