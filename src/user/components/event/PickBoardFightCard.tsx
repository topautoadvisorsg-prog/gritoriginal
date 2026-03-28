import React, { useState } from 'react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { useSocket } from '@/shared/hooks/use-socket';
import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

interface PickBoardFightCardProps {
  fight: EventFight;
  fighters: Map<string, Fighter>;
  pickedFighterId?: string;
}

const SILHOUETTE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Cellipse cx='50' cy='30' rx='22' ry='24' fill='%23444'/%3E%3Cpath d='M15 150 Q15 75 50 68 Q85 75 85 150Z' fill='%23444'/%3E%3C/svg%3E";

const BoardFighter: React.FC<{
  fighter: Fighter | undefined;
  side: 'left' | 'right';
  isSelected: boolean;
  isDimmed: boolean;
  crowdPct: number | undefined;
  crowdCount: number | undefined;
}> = ({ fighter, side, isSelected, isDimmed, crowdPct, crowdCount }) => {
  const [err, setErr] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const isConsensus = (crowdPct || 0) >= 60;
  const prevPctRef = useRef(crowdPct);

  useEffect(() => {
    if (crowdPct !== undefined && prevPctRef.current !== undefined && crowdPct !== prevPctRef.current) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 500);
      return () => clearTimeout(timer);
    }
    prevPctRef.current = crowdPct;
  }, [crowdPct]);

  return (
    <div
      className={cn(
        'relative flex-1 flex flex-col items-center justify-end overflow-hidden pt-2 transition-all duration-300',
        isSelected && 'bg-gradient-to-t from-[#E8A020]/20 to-transparent',
        isDimmed && 'opacity-30 grayscale saturate-0'
      )}
    >
      <div className="relative w-full h-24 flex items-end justify-center">
        {fighter?.imageUrl && !err ? (
          <img
            src={fighter.imageUrl}
            alt={fighter.firstName}
            onError={() => setErr(true)}
            className={cn(
              'h-full object-contain object-bottom',
              side === 'right' && 'scale-x-[-1]'
            )}
          />
        ) : (
          <img src={SILHOUETTE} alt="TBD" className="h-full object-contain opacity-30" />
        )}
        {isConsensus && !isDimmed && (
          <div className="absolute top-0 right-0 z-30 transform translate-x-1/4 -translate-y-1/4">
            <div className="bg-[#E8A020] text-black text-[7px] font-black px-1.5 py-0.5 rounded-sm shadow-lg rotate-12 flex items-center gap-0.5 border border-black/20">
              <TrendingUp className="w-2 h-2" />
              CONSENSUS
            </div>
          </div>
        )}
      </div>

      {/* Animated live crowd percentage bar */}
      {crowdPct !== undefined && crowdCount !== undefined && (
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-20">
          {side === 'left' && (
            <span className={cn("text-[9px] font-black [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] z-30 transition-colors duration-300", highlight ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" : "text-[#E8A020]")}>
              {crowdPct}% ({crowdCount})
            </span>
          )}
          <div className="flex-1 h-1.5 bg-black/50 overflow-hidden rounded-full mx-2 relative border border-white/5">
            <div 
              className={cn("absolute h-full transition-all duration-700 ease-out", highlight ? "bg-white" : "bg-[#E8A020]")}
              style={{ 
                width: `${crowdPct}%`,
                left: side === 'left' ? 0 : 'auto',
                right: side === 'right' ? 0 : 'auto',
              }}
            />
          </div>
          {side === 'right' && (
            <span className={cn("text-[9px] font-black [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] z-30 transition-colors duration-300", highlight ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" : "text-[#E8A020]")}>
              {crowdPct}% ({crowdCount})
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full text-center py-1.5 border-t z-10',
          isSelected ? 'bg-[#E8A020]/20 border-[#E8A020]/50' : 'bg-black/40 border-white/5'
        )}
      >
        <span
          className={cn(
            'text-[10px] uppercase font-black tracking-tighter block truncate px-1',
            isSelected ? 'text-[#E8A020]' : 'text-white/70'
          )}
        >
          {fighter ? fighter.lastName : 'TBD'}
        </span>
      </div>
    </div>
  );
};

export const PickBoardFightCard: React.FC<PickBoardFightCardProps> = ({ fight, fighters, pickedFighterId }) => {
  const f1 = fighters.get(fight.fighter1Id);
  const f2 = fighters.get(fight.fighter2Id);

  const f1Selected = pickedFighterId === fight.fighter1Id;
  const f2Selected = pickedFighterId === fight.fighter2Id;
  const isPicked = f1Selected || f2Selected;

  const socket = useSocket();
  const [crowdData, setCrowdData] = useState<{ percentages?: Record<string, number>, counts?: Record<string, number> } | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data: any) => {
      if (data.fightId === fight.id) {
        setCrowdData({
          percentages: data.percentages,
          counts: data.counts
        });
      }
    };
    socket.on('pick_update', handleUpdate);
    return () => {
      socket.off('pick_update', handleUpdate);
    };
  }, [socket, fight.id]);

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border transition-all duration-300",
        isPicked ? "border-[#E8A020]/30 shadow-[0_0_15px_rgba(232,160,32,0.1)]" : "border-white/10"
      )}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)'
      }}
    >
      <div className="absolute top-0 w-full text-center pt-1 z-20 pointer-events-none">
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#E8A020]/60 block mb-0.5">
          {fight.weightClass}
        </span>
      </div>

      <div className="flex w-full h-full mt-2">
        <BoardFighter
          fighter={f1}
          side="left"
          isSelected={f1Selected}
          isDimmed={isPicked && !f1Selected}
          crowdPct={crowdData?.percentages ? crowdData.percentages[fight.fighter1Id] : undefined}
          crowdCount={crowdData?.counts ? crowdData.counts[fight.fighter1Id] : undefined}
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/80 rounded-full border border-white/10 px-1.5 py-0.5">
            <span className="text-[9px] font-black italic text-white/50">VS</span>
          </div>
        </div>

        <BoardFighter
          fighter={f2}
          side="right"
          isSelected={f2Selected}
          isDimmed={isPicked && !f2Selected}
          crowdPct={crowdData?.percentages ? crowdData.percentages[fight.fighter2Id] : undefined}
          crowdCount={crowdData?.counts ? crowdData.counts[fight.fighter2Id] : undefined}
        />
      </div>
    </div>
  );
};
