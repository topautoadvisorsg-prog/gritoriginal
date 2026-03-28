import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Trophy, Flame } from 'lucide-react';
import { Event, Fighter, EventFight } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

// Constants
const GOLD = '#E8A020';
const SILHOUETTE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Cellipse cx='50' cy='30' rx='22' ry='24' fill='%23444'/%3E%3Cpath d='M15 150 Q15 75 50 68 Q85 75 85 150Z' fill='%23444'/%3E%3C/svg%3E";

interface EventHeaderProps {
  event: Event;
  mainEvent: EventFight | null;
  fighters: Map<string, Fighter>;
}

const parseLocalDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  if (dateStr.includes('T') || dateStr.includes(' ')) return new Date(dateStr);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const useCountdown = (dateStr: string | Date) => {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = parseLocalDate(dateStr).getTime();
    const tick = () => setDiff(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  const totalSecondsMs = diff / 1000;
  return {
    diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: diff === 0,
    isWarning: totalSecondsMs <= 600 && totalSecondsMs > 180, // <= 10m
    isHighAlert: totalSecondsMs <= 180 && totalSecondsMs > 30, // <= 3m
    isFinalCall: totalSecondsMs <= 30 && totalSecondsMs > 0, // <= 30s
  };
};

const FlipCard: React.FC<{ value: string | number; label: string; color?: string }> = ({ value, label, color = GOLD }) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-10 w-8 md:h-12 md:w-10 bg-[#111] rounded-lg border border-white/5 flex items-center justify-center overflow-hidden shadow-inner">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute font-mono font-black text-xl md:text-2xl tracking-tighter"
            style={{ color }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        {/* Horizontal Card Line */}
        <div className="absolute w-full h-[1px] bg-black/40 top-1/2 left-0 z-10" />
      </div>
      <span className="text-[8px] uppercase text-white/30 font-black tracking-widest">{label}</span>
    </div>
  );
};

const HeroPhoto: React.FC<{ fighter: Fighter | undefined; side: 'left' | 'right' }> = ({ fighter, side }) => {
  const [err, setErr] = useState(false);
  return (
    <div className={cn('relative flex-1 h-[40vh] md:h-[50vh] overflow-hidden', side === 'left' ? 'rounded-tl-xl' : 'rounded-tr-xl')}>
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10" />
      {/* Edge fade */}
      {side === 'left'
        ? <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/70 z-10" />
        : <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/70 z-10" />
      }
      {fighter?.imageUrl && !err ? (
        <img
          src={fighter.imageUrl}
          alt={fighter.firstName}
          onError={() => setErr(true)}
          className={cn('w-full h-full object-cover object-top filter brightness-110 contrast-125 saturate-[1.1]', side === 'right' && 'scale-x-[-1]')}
        />
      ) : (
        <div className="w-full h-full flex items-end justify-center pb-4" style={{ background: 'linear-gradient(to top, rgba(25,18,3,0.9), rgba(8,8,8,0.3))' }}>
          <img src={SILHOUETTE} alt="Fighter" className="h-full w-full object-cover opacity-20" />
        </div>
      )}
      {/* Fighter Name Overlay */}
      <div className={cn("absolute bottom-6 z-20 flex flex-col", side === 'left' ? "left-4 items-start" : "right-4 items-end")}>
        <span className="text-white/80 font-bold uppercase text-xs md:text-sm tracking-widest">{fighter?.firstName || 'TBD'}</span>
        <span className="text-white font-black uppercase text-xl md:text-3xl tracking-tight leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          {fighter?.lastName || ''}
        </span>
      </div>
    </div>
  );
};

export const EventHeader: React.FC<EventHeaderProps> = ({ event, mainEvent, fighters }) => {
  const countdown = useCountdown(event.date);
  const isLive = event.status === 'LIVE';
  const isClosed = event.status === 'CLOSED' || event.status === 'ARCHIVED' || event.status === 'Completed';

  const f1 = mainEvent ? fighters.get(mainEvent.fighter1Id) : undefined;
  const f2 = mainEvent ? fighters.get(mainEvent.fighter2Id) : undefined;
  
  const venueStr = [event.location?.venue, event.location?.city].filter(Boolean).join(', ');
  const formattedDate = parseLocalDate(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className="relative w-full rounded-xl overflow-hidden min-h-[60vh] md:min-h-[70vh] flex flex-col bg-black">
      {/* Background with gradient overlay */}
      {event.imageUrl && (
        <div className="absolute inset-0 opacity-30 select-none pointer-events-none" style={{
          backgroundImage: `url(${event.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 z-0 pointer-events-none" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, rgba(232,160,32,0.05) 0%, transparent 60%)` }} />

      {/* Top Banner (Info) */}
      <div className="relative z-30 pt-8 pb-4 px-4 flex flex-col items-center flex-none">
        {/* GRIT logo subtle */}
        <span className="text-sm font-black tracking-[0.35em] uppercase mb-4 opacity-50 text-white" style={{ color: GOLD }}>GRIT</span>
        
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-2 text-center" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
          {event.name}
        </h1>
        
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#E8A020] opacity-80">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formattedDate}</div>
          {venueStr && <span className="text-white/20">·</span>}
          {venueStr && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{venueStr}</div>}
        </div>
      </div>

      {/* Main Event Integrated Hero */}
      {mainEvent && (
        <div className="relative z-20 flex-1 flex flex-col justify-end pb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 px-3 py-1 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 uppercase font-black text-[10px] tracking-widest text-white/70">
            <Trophy className="w-3 h-3 text-[#E8A020]" />
            Main Event
            {mainEvent.isTitleFight && <span className="text-[#E8A020] ml-1">· Title Fight</span>}
          </div>

          <div className="flex w-full items-end h-full">
            <HeroPhoto fighter={f1} side="left" />
            
            {/* Center VS & Countdown Overlay */}
            <div className="absolute left-1/2 bottom-[15%] -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col items-center min-w-[120px]">
                <span className="font-black text-xs md:text-sm italic tracking-widest text-[#E8A020] mb-2">VS</span>
                {isLive ? (
                  <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
                    <Flame className="w-4 h-4" />
                    <span className="font-black text-xs uppercase tracking-widest">LIVE</span>
                  </div>
                ) : isClosed ? (
                  <span className="font-black text-xs uppercase tracking-widest text-white/50">CLOSED</span>
                ) : !countdown.isPast ? (
                  <div className={cn(
                    "flex flex-col items-center transition-all duration-300", 
                    countdown.isWarning && "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
                    countdown.isHighAlert && "scale-105 drop-shadow-[0_0_12px_rgba(234,88,12,0.8)]",
                    countdown.isFinalCall && "scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]"
                  )}>
                    {(countdown.isHighAlert || countdown.isFinalCall) && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] mb-3 animate-pulse",
                        countdown.isFinalCall ? "text-red-500" : "text-orange-500"
                      )}>
                        {countdown.isFinalCall ? 'FINAL CALL' : 'CLOSING SOON'}
                      </span>
                    )}
                    
                    <div className="flex gap-2.5">
                      <FlipCard value={String(countdown.days).padStart(2, '0')} label="Days" color={countdown.isFinalCall ? '#ef4444' : countdown.isHighAlert ? '#f97316' : GOLD} />
                      <FlipCard value={String(countdown.hours).padStart(2, '0')} label="Hrs" color={countdown.isFinalCall ? '#ef4444' : countdown.isHighAlert ? '#f97316' : GOLD} />
                      <FlipCard value={String(countdown.minutes).padStart(2, '0')} label="Min" color={countdown.isFinalCall ? '#ef4444' : countdown.isHighAlert ? '#f97316' : GOLD} />
                      {(countdown.isHighAlert || countdown.isFinalCall) && (
                        <FlipCard value={String(countdown.seconds).padStart(2, '0')} label="Sec" color={countdown.isFinalCall ? '#ef4444' : '#f97316'} />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <HeroPhoto fighter={f2} side="right" />
          </div>
          
          {/* Main Event Info Bar */}
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black to-transparent h-24 pointer-events-none" />
          <div className="absolute bottom-4 w-full flex justify-center z-30">
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8A020]/80">
               {mainEvent.weightClass} weight bout
             </span>
          </div>
        </div>
      )}
    </div>
  );
};
