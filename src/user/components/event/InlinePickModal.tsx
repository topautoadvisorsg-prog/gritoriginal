import React, { useState, useRef } from 'react';
import { X, Users } from 'lucide-react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { Button } from '@/shared/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { useSwipeable } from 'react-swipeable';

interface InlinePickModalProps {
  fight: EventFight;
  fighters: Map<string, Fighter>;
  existingPick?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InlinePickModal: React.FC<InlinePickModalProps> = ({
  fight,
  fighters,
  existingPick,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const f1 = fighters.get(fight.fighter1Id);
  const f2 = fighters.get(fight.fighter2Id);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch pick distribution data - no polling, refetches on mutation success
  const { data: distributionData, isLoading: isDistributionLoading } = useQuery({
    queryKey: ['/api/picks/distribution', fight.id],
    queryFn: async () => {
      const res = await fetch(`/api/picks/distribution/${fight.id}`);
      if (!res.ok) throw new Error('Failed to fetch distribution');
      return res.json();
    },
    enabled: !!fight.id,
    staleTime: 0, // Always refetch for accuracy - distribution changes after picks
  });

  // Pick state - simplified for faster flow
  const [selectedFighterId, setSelectedFighterId] = useState<string>(
    existingPick?.pickedFighterId || ''
  );
  const [method, setMethod] = useState<string>(existingPick?.pickedMethod || 'Decision');
  const [round, setRound] = useState<string>(existingPick?.pickedRound || '');
  const [units, setUnits] = useState<number>(existingPick?.units || 1);
  const [expanded, setExpanded] = useState(false); // Auto-expand after fighter selected

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFighterId) throw new Error('Must pick a fighter');

      const res = await fetch(`/api/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fightId: fight.id,
          pickedFighterId: selectedFighterId,
          pickedMethod: method || undefined,
          pickedRound: round || undefined,
          units,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save pick');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/picks/event', fight.eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/picks/distribution', fight.id] });
      toast.success('Pick locked in!');
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Swipe handlers for mobile fighter selection
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (f2) setSelectedFighterId(fight.fighter2Id);
      setExpanded(true);
    },
    onSwipedRight: () => {
      if (f1) setSelectedFighterId(fight.fighter1Id);
      setExpanded(true);
    },
    trackMouse: true,
  });

  const handleSave = () => {
    if (!selectedFighterId) {
      toast.error('Select a fighter first');
      return;
    }
    mutation.mutate();
  };

  const isFinishMethod = method === 'KO/TKO' || method === 'Submission';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-gradient-to-b from-[#1a1a1a] to-black border border-[#E8A020]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        ref={containerRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8A020]/20">
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Quick Pick</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fight Info with Swipe Gesture */}
        <div 
          {...swipeHandlers}
          className="p-4 bg-white/[0.02] cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <p className="text-[9px] text-center text-white/40 uppercase tracking-widest">
              Swipe or Tap to Select
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSelectedFighterId(fight.fighter1Id);
                setExpanded(true);
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200",
                selectedFighterId === fight.fighter1Id
                  ? "border-[#E8A020] bg-[#E8A020]/10 text-white shadow-[0_0_20px_rgba(232,160,32,0.3)]"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30"
              )}
            >
              <p className="text-sm font-black uppercase tracking-tight">{f1?.lastName || 'TBD'}</p>
              {selectedFighterId === fight.fighter1Id && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-[#E8A020]">
                  <span>✓ SELECTED</span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setSelectedFighterId(fight.fighter2Id);
                setExpanded(true);
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200",
                selectedFighterId === fight.fighter2Id
                  ? "border-[#E8A020] bg-[#E8A020]/10 text-white shadow-[0_0_20px_rgba(232,160,32,0.3)]"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30"
              )}
            >
              <p className="text-sm font-black uppercase tracking-tight">{f2?.lastName || 'TBD'}</p>
              {selectedFighterId === fight.fighter2Id && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-[#E8A020]">
                  <span>✓ SELECTED</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Section - Method, Round, Units */}
        {selectedFighterId && expanded && (
          <div className="p-4 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Method Selection */}
            <div>
              <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-2">
                Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['KO/TKO', 'Submission', 'Decision'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      if (m !== 'KO/TKO' && m !== 'Submission') setRound('');
                    }}
                    className={cn(
                      "py-2.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                      method === m
                        ? "border-[#E8A020] bg-[#E8A020]/10 text-[#E8A020]"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/30"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Selection - Only shows for KO/Sub */}
            {isFinishMethod && (
              <div>
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-2">
                  Round
                </label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8A020]"
                >
                  <option value="">Select Round</option>
                  {Array.from({ length: fight.rounds || 5 }, (_, i) => i + 1).map((r) => (
                    <option key={r} value={r} className="bg-black">
                      Round {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Units Selection */}
            <div>
              <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-2">
                Units
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnits(u)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border text-xs font-black transition-all",
                      units === u
                        ? "border-[#E8A020] bg-[#E8A020]/10 text-[#E8A020]"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/30"
                    )}
                  >
                    {u}u
                  </button>
                ))}
              </div>
            </div>

            {/* Community Pick Distribution - Social Proof */}
            {distributionData && distributionData.distribution && distributionData.distribution.length > 0 && (
              <div className="social-proof mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-white/40" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                    Community Picks ({distributionData.totalPicks})
                  </span>
                </div>
                
                {distributionData.distribution.map((dist: any) => {
                  const isLeading = parseFloat(dist.percentage) > 50;
                  return (
                    <div key={dist.fighterId} className="flex items-center gap-3 mb-2 last:mb-0">
                      <span className="text-xs font-bold text-white w-24 truncate">
                        {dist.fighterName}
                      </span>
                      
                      <div className="flex-1">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-700",
                              isLeading 
                                ? "bg-win shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                : "bg-white/20"
                            )}
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <span className={cn(
                        "text-xs font-black w-12 text-right",
                        isLeading ? "text-win" : "text-white/40"
                      )}>
                        {dist.percentage}%
                      </span>
                    </div>
                  );
                })}
                
                {distributionData.distribution[0]?.percentage && (
                  <p className="text-[8px] text-white/30 mt-3 uppercase tracking-wider">
                    🔥 {distributionData.distribution[0].percentage}% picked {distributionData.distribution[0].fighterName}
                  </p>
                )}
              </div>
            )}

            {/* Lock In Button */}
            <Button
              onClick={handleSave}
              disabled={mutation.isPending || !selectedFighterId}
              className="w-full bg-[#E8A020] hover:bg-[#d48f00] text-black font-black uppercase tracking-widest py-6 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : (
                `Lock In Pick (${units}u)`
              )}
            </Button>
          </div>
        )}

        {/* Initial State Hint */}
        {!selectedFighterId && (
          <div className="p-4 text-center">
            <p className="text-[9px] text-white/40 uppercase tracking-widest">
              Tap a fighter or swipe left/right
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
