import React, { useRef, useState } from 'react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { PickBoardFightCard } from './PickBoardFightCard';
import html2canvas from 'html2canvas';
import { Share, Loader2, Users } from 'lucide-react';
import { useSocket } from '@/shared/hooks/use-socket';
import { useEffect } from 'react';

interface PickBoardProps {
  event: any;
  fights: EventFight[];
  fighters: Map<string, Fighter>;
  picks: any[];
}

export const PickBoard: React.FC<PickBoardProps> = ({ event, fights, fighters, picks }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !event?.id) return;
    socket.emit('join_event_chat', event.id);
  }, [socket, event?.id]);

  // Sort fights logically
  const sortedFights = [...fights].sort((a, b) => b.boutOrder - a.boutOrder);

  const handleShare = async () => {
    if (!boardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        ignoreElements: (element) => element.id === 'hide-from-capture',
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `GRIT-${event.name.replace(/\s+/g, '-')}-Picks.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto pb-12">
      <div className="flex justify-end" id="hide-from-capture">
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="gold-btn flex items-center justify-center gap-2 px-4 py-2 text-xs w-full sm:w-auto"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share className="w-4 h-4" />}
          {isGenerating ? 'GENERATING...' : 'SHARE PICKS'}
        </button>
      </div>

      <div ref={boardRef} className="bg-[#0a0a0a] p-5 sm:p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black uppercase text-white tracking-widest leading-tight">{event.name}</h2>
          <div className="flex flex-col items-center gap-1 mt-1">
            <p className="text-[10px] text-[#E8A020] font-bold uppercase tracking-[0.2em]">Official Pick Board</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 mt-1">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">
                <span className="text-white">1,429 players</span> tracking this event
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sortedFights.map((fight) => {
            const pick = picks.find((p) => p.fightId === fight.id);
            return (
              <PickBoardFightCard
                key={fight.id}
                fight={fight}
                fighters={fighters}
                pickedFighterId={pick?.pickedFighterId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
