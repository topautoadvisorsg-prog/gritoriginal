import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Fighter, EventFight } from '@/shared/types/fighter';
import { useFighters } from '@/shared/hooks/useFighters';
import { cn } from '@/shared/lib/utils';
import { EventHeader } from './EventHeader';
import { PickBoard } from './PickBoard';
import { QuickPickBoard } from './QuickPickBoard';
import { InlinePickModal } from './InlinePickModal';
import { MessageSquare, BarChart3, List, Grid } from 'lucide-react';
import { useSocket } from '@/shared/hooks/use-socket';

// Note: Ensure Chat, Analytics components are imported appropriately if real. 
// Used placeholders for Analytics/Chat per missing actual components.

interface EventCardPageProps {
  event?: Event;
  picks?: EventPick[];
  onViewFightDetails?: (fightId: string) => void;
}

interface EventPick {
  fightId: string;
  pickedFighterId: string;
  pickedMethod?: string | null;
}

interface CrowdData {
  percentages?: Record<string, number>;
  counts?: Record<string, number>;
}

interface PickUpdatePayload extends CrowdData {
  fightId: string;
}

const GOLD = '#E8A020';
const SILHOUETTE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Cellipse cx='50' cy='30' rx='22' ry='24' fill='%23444'/%3E%3Cpath d='M15 150 Q15 75 50 68 Q85 75 85 150Z' fill='%23444'/%3E%3C/svg%3E";

const CirclePhoto: React.FC<{ fighter: Fighter | undefined; side?: 'left' | 'right' }> = ({ fighter, side = 'left' }) => {
  const [err, setErr] = useState(false);
  return (
    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-white/5 shadow-inner shadow-black">
      {fighter?.imageUrl && !err ? (
        <img
          src={fighter.imageUrl}
          alt={fighter.firstName}
          onError={() => setErr(true)}
          className={cn('w-full h-full object-cover object-top filter contrast-125', side === 'right' && 'scale-x-[-1]')}
        />
      ) : (
        <img src={SILHOUETTE} alt="Fighter" className="w-full h-full object-cover opacity-25" />
      )}
    </div>
  );
};

const FightRow: React.FC<{
  fight: EventFight;
  fighters: Map<string, Fighter>;
  label?: string;
  onNavigate: () => void;
  onInlinePick?: (fight: EventFight, e?: React.MouseEvent) => void;
  pick?: EventPick;
  crowdData?: CrowdData | null;
}> = ({ fight, fighters, label, onNavigate, onInlinePick, pick, crowdData }) => {
  const f1 = fighters.get(fight.fighter1Id);
  const f2 = fighters.get(fight.fighter2Id);

  const rowLabel = label
    || (fight.cardPlacement === 'Co-Main Event' ? 'Co-Main Event' : '')
    || (fight.isTitleFight ? fight.weightClass + ' Title' : '')
    || fight.weightClass;

  return (
    <div
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group border relative",
        pick 
          ? "bg-win/10 border-win/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
      )}
    >
      {/* Quick Pick Button - Only show if no pick exists */}
      {!pick && onInlinePick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInlinePick(fight, e);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E8A020] hover:bg-[#d48f00] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          Pick
        </button>
      )}
      
      <CirclePhoto fighter={f1} side="left" />
      <div className="flex-1 text-center min-w-0">
        <p className="text-sm font-black text-white uppercase tracking-tight leading-tight shrink-0">
          <span className="opacity-90">{f1?.lastName || 'TBD'}</span>
          <span className="mx-2 font-bold text-[10px]" style={{ color: `${GOLD}80` }}>vs</span>
          <span className="opacity-90">{f2?.lastName || 'TBD'}</span>
        </p>
        {rowLabel && (
          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5 font-semibold">({rowLabel})</p>
        )}
        
        {/* Live Pick Distribution */}
        {crowdData?.percentages && (
          <div className="flex items-center justify-center gap-2 mt-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5 w-fit mx-auto">
            <span className={cn("text-[8px] font-black tracking-tighter", 
              (crowdData.percentages[fight.fighter1Id] || 0) >= 60 ? "text-[#E8A020]" : "text-white/40"
            )}>
              {crowdData.percentages[fight.fighter1Id] || 0}% {f1?.lastName || 'TBD'}
            </span>
            <span className="text-[8px] text-white/10">/</span>
            <span className={cn("text-[8px] font-black tracking-tighter", 
              (crowdData.percentages[fight.fighter2Id] || 0) >= 60 ? "text-[#E8A020]" : "text-white/40"
            )}>
              {crowdData.percentages[fight.fighter2Id] || 0}% {f2?.lastName || 'TBD'}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 min-w-[70px]">
        <CirclePhoto fighter={f2} side="right" />
        {pick && (
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-[#E8A020] uppercase tracking-tighter">
              {fighters.get(pick.pickedFighterId)?.lastName || 'PICKED'}
            </span>
            <span className="text-[7px] font-black text-win/80 uppercase tracking-widest">
              BY {pick.pickedMethod || 'PICKED'}
            </span>
          </div>
        )}
      </div>
      {pick && (
        <div className="absolute -left-1 -top-1">
          <div className="bg-win text-win-foreground p-0.5 rounded-full shadow-lg border border-black">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-none stroke-current stroke-[4]">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 mt-4 mb-2">
    <div className="flex-1 h-px" style={{ background: `${GOLD}20` }} />
    <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: `${GOLD}80` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: `${GOLD}20` }} />
  </div>
);

type TabView = 'card' | 'picks' | 'analytics' | 'chat';

export const EventCardPage: React.FC<EventCardPageProps> = ({ event, picks = [], onViewFightDetails }) => {
  const navigate = useNavigate();
  const { fighterMap } = useFighters();
  const [activeTab, setActiveTab] = useState<TabView>('card');
  const [crowdDataMap, setCrowdDataMap] = useState<Record<string, CrowdData>>({});
  const socket = useSocket();
  
  // Inline pick modal state
  const [selectedFightForPick, setSelectedFightForPick] = useState<EventFight | null>(null);
  const [existingPickForSelectedFight, setExistingPickForSelectedFight] = useState<EventPick | undefined>(undefined);
  
  // Pick board view mode (regular vs quick)
  const [pickBoardMode, setPickBoardMode] = useState<'regular' | 'quick'>('quick');

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data: PickUpdatePayload) => {
      setCrowdDataMap(prev => ({
        ...prev,
        [data.fightId]: {
          percentages: data.percentages,
          counts: data.counts
        }
      }));
    };
    socket.on('pick_update', handleUpdate);
    return () => { socket.off('pick_update', handleUpdate); };
  }, [socket]);

  const goToFight = (fightId: string) => {
    onViewFightDetails?.(fightId);
    navigate(`/event/fight/${fightId}`);
  };

  const handleInlinePick = (fight: EventFight, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const existingPick = picks.find(p => p.fightId === fight.id);
    setExistingPickForSelectedFight(existingPick);
    setSelectedFightForPick(fight);
  };

  // ─── Progress & Auto-Scroll Logic ───────────────────────────────────────────
  const totalFights = event.fights?.length || 0;
  const pickedFights = useMemo(() => {
    return event.fights?.filter(f => picks.some(p => p.fightId === f.id)).length || 0;
  }, [event.fights, picks]);
  const progressPercent = totalFights > 0 ? (pickedFights / totalFights) * 100 : 0;

  // Refs for auto-scroll
  const fightRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (activeTab === 'card' && event.fights?.length) {
      // Find the first fight without a pick
      const firstUnpicked = [...event.fights]
        .sort((a, b) => a.boutOrder - b.boutOrder)
        .find(f => !picks.some(p => p.fightId === f.id));
      
      if (firstUnpicked && fightRefs.current[firstUnpicked.id]) {
        setTimeout(() => {
          fightRefs.current[firstUnpicked.id]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 500);
      }
    }
  }, [activeTab, event.fights, picks]);

  const { mainEvent, coMain, mainCardRest, prelims, prePrelims } = useMemo(() => {
    if (!event?.fights?.length) return { mainEvent: null, coMain: null, mainCardRest: [], prelims: [], prePrelims: [] };

    const sorted = [...event.fights].sort((a, b) => a.boutOrder - b.boutOrder);
    
    // Extracted exactly as before
    const m = sorted.find(f => f.cardPlacement === 'Main Event')
      ?? sorted.find(f => f.cardPlacement === 'Main Card')
      ?? sorted[sorted.length - 1]
      ?? null;

    const co = m
      ? sorted.find(f => f !== m && f.cardPlacement === 'Co-Main Event')
      ?? sorted.find(f => f !== m && f.cardPlacement === 'Main Card')
      ?? null
      : null;

    const mcRest = sorted.filter(f =>
      f !== m && f !== co &&
      (f.cardPlacement === 'Main Card' || f.cardPlacement === 'Main Event' || f.cardPlacement === 'Co-Main Event')
    );

    const prelimMatches = sorted.filter(f =>
      f !== m && f !== co && !mcRest.includes(f) &&
      (f.cardPlacement === 'Preliminary' || f.cardPlacement === 'Prelim')
    );

    const earlyMatches = sorted.filter(f =>
      f !== m && f !== co && !mcRest.includes(f) && !prelimMatches.includes(f) &&
      (f.cardPlacement === 'Pre-Prelims' || f.cardPlacement === 'Early Prelim')
    );

    return { mainEvent: m, coMain: co, mainCardRest: mcRest, prelims: prelimMatches, prePrelims: earlyMatches };
  }, [event?.fights]);

  if (!event) return <div className="flex justify-center py-20 text-white/50">Loading event data...</div>;

  return (
    <div className="min-h-screen w-full relative sm:pb-32 bg-black">
      
      {/* 1. Hero Header Section - Always visible */}
      <EventHeader event={event} mainEvent={mainEvent} fighters={fighterMap} />

      <div className="w-full max-w-2xl mx-auto px-2 md:px-4">
        
        {/* 2. Sticky Navigation Sub-Nav */}
        <div className="sticky top-[60px] md:top-2 z-40 bg-black/90 backdrop-blur-xl border-b border-[#E8A020]/20 py-3 -mx-2 px-2 md:mx-0 md:px-0 mb-4 transition-all w-[calc(100%+16px)] md:w-full md:rounded-xl shadow-lg shadow-black">
          <div className="flex items-center justify-center sm:justify-between flex-wrap sm:flex-nowrap gap-2 sm:gap-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('card')}
              className={cn("flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", activeTab === 'card' ? "bg-[#E8A020] text-black shadow-md shadow-[#E8A020]/20" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
            >
              <List className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Fight </span>Card 
            </button>
            <button
              onClick={() => setActiveTab('picks')}
              className={cn("flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", activeTab === 'picks' ? "bg-[#E8A020] text-black shadow-md shadow-[#E8A020]/20" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
            >
              <Grid className="w-3.5 h-3.5" /> Picks
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn("flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", activeTab === 'analytics' ? "bg-white text-black shadow-md shadow-white/20" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={cn("flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", activeTab === 'chat' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
          </div>
        </div>

        {/* 3. Pick Progress Bar (only on card tab) */}
        {activeTab === 'card' && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 slide-up-fade">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Pick Progress</span>
              <span className="text-[11px] font-black text-win">{pickedFights} / {totalFights} Fights Picked</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-win transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4. Tab Content */}
        <div className="pb-16 pt-2 h-full min-h-[50vh]">
          {activeTab === 'card' && (
            <div className="flex flex-col gap-1.5">
              {/* Main Event is already in Hero, we omit it from list, displaying the rest under Main Card */}
              {(coMain || mainCardRest.length > 0) && (
                <>
                  <SectionDivider label="Main Card" />
                  {coMain && (
                    <div ref={el => fightRefs.current[coMain.id] = el}>
                      <FightRow 
                        fight={coMain} 
                        fighters={fighterMap} 
                        onNavigate={() => goToFight(coMain.id)} 
                        onInlinePick={handleInlinePick}
                        pick={picks.find(p => p.fightId === coMain.id)}
                        crowdData={crowdDataMap[coMain.id]}
                      />
                    </div>
                  )}
                  {mainCardRest.map(f => (
                    <div key={f.id} ref={el => fightRefs.current[f.id] = el}>
                      <FightRow 
                        fight={f} 
                        fighters={fighterMap} 
                        onNavigate={() => goToFight(f.id)} 
                        onInlinePick={handleInlinePick}
                        pick={picks.find(p => p.fightId === f.id)}
                        crowdData={crowdDataMap[f.id]}
                      />
                    </div>
                  ))}
                </>
              )}

              {prelims.length > 0 && (
                <>
                  <SectionDivider label="Preliminary Card" />
                  {prelims.map(f => (
                    <div key={f.id} ref={el => fightRefs.current[f.id] = el}>
                      <FightRow 
                        fight={f} 
                        fighters={fighterMap} 
                        onNavigate={() => goToFight(f.id)} 
                        onInlinePick={handleInlinePick}
                        pick={picks.find(p => p.fightId === f.id)}
                      />
                    </div>
                  ))}
                </>
              )}

              {prePrelims.length > 0 && (
                <>
                  <SectionDivider label="Early Prelims" />
                  {prePrelims.map(f => (
                    <div key={f.id} ref={el => fightRefs.current[f.id] = el}>
                      <FightRow 
                        fight={f} 
                        fighters={fighterMap} 
                        onNavigate={() => goToFight(f.id)} 
                        onInlinePick={handleInlinePick}
                        pick={picks.find(p => p.fightId === f.id)}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'picks' && (
            <div className="animate-in fade-in duration-300">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setPickBoardMode('quick')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                    pickBoardMode === 'quick'
                      ? "bg-win/20 border-win text-win"
                      : "bg-white/[0.02] border-white/10 text-white/60 hover:border-white/30"
                  )}
                >
                  Quick Pick
                </button>
                <button
                  onClick={() => setPickBoardMode('regular')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                    pickBoardMode === 'regular'
                      ? "bg-[#E8A020]/20 border-[#E8A020] text-[#E8A020]"
                      : "bg-white/[0.02] border-white/10 text-white/60 hover:border-white/30"
                  )}
                >
                  Share Board
                </button>
              </div>
              
              {/* Render Selected Board */}
              {pickBoardMode === 'quick' ? (
                <QuickPickBoard event={event} fights={event.fights || []} fighters={fighterMap} picks={picks} />
              ) : (
                <PickBoard event={event} fights={event.fights || []} fighters={fighterMap} picks={picks} />
              )}
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center py-24 text-center border border-white/10 rounded-xl bg-white/5 border-dashed">
               <BarChart3 className="w-12 h-12 text-[#E8A020]/40 mb-3" />
               <h3 className="text-lg font-black uppercase text-white tracking-widest">Card Analytics</h3>
               <p className="text-sm text-white/50 max-w-sm mt-2">Deep betting metrics, public pick consensus, and AI insights for this event.</p>
               <button className="mt-6 px-6 py-2 bg-[#E8A020]/20 text-[#E8A020] rounded-full text-xs font-bold uppercase tracking-widest border border-[#E8A020]/40">Unlock Analytics</button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center py-24 text-center border border-indigo-500/20 rounded-xl bg-indigo-500/5 border-dashed">
               <MessageSquare className="w-12 h-12 text-indigo-400 mb-3" />
               <h3 className="text-lg font-black uppercase text-white tracking-widest">Live Fight Thread</h3>
               <p className="text-sm text-white/50 max-w-sm mt-2">Join the community. Event chat opens exactly 2 hours before the first prelim.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inline Pick Modal */}
      {selectedFightForPick && (
        <InlinePickModal
          fight={selectedFightForPick}
          fighters={fighterMap}
          existingPick={existingPickForSelectedFight}
          onClose={() => {
            setSelectedFightForPick(null);
            setExistingPickForSelectedFight(undefined);
          }}
          onSuccess={() => {
            // Optional: Auto-advance to next unpicked fight
            const nextUnpicked = event.fights
              ?.sort((a, b) => a.boutOrder - b.boutOrder)
              .find(f => !picks.some(p => p.fightId === f.id && f.id !== selectedFightForPick.id));
            
            if (nextUnpicked) {
              handleInlinePick(nextUnpicked);
            } else {
              setSelectedFightForPick(null);
              setExistingPickForSelectedFight(undefined);
            }
          }}
        />
      )}
    </div>
  );
};

export default EventCardPage;
