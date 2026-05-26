import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFighters } from '@/shared/hooks/useFighters';
import { Loader2, ChevronLeft, ChevronRight, Calendar, MapPin, Flame, Users } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { cn } from '@/shared/lib/utils';
import SEO from '@/shared/components/SEO';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbFight {
  id: string;
  fighter1Id: string;
  fighter2Id: string;
  cardPlacement: string;
  boutOrder: number;
}

interface DbEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  state: string | null;
  country: string;
  organization: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
}

interface DbEventWithFights extends DbEvent {
  fights: DbFight[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_W = 300;
const CARD_H = 380;
const GOLD = '#E8A020';
const SILHOUETTE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Cellipse cx='50' cy='28' rx='22' ry='25' fill='%23333'/%3E%3Cpath d='M12 150 Q12 72 50 65 Q88 72 88 150Z' fill='%23333'/%3E%3C/svg%3E";

// Seeded "players entered" for gamification feel (always deterministic per event id)
const seedPlayerCount = (id: string) => {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return 15000 + (n % 20000);
};

const formatPlayerCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseLocalDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  if (dateStr.includes('T') || dateStr.includes(' ')) return new Date(dateStr);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatShortDate = (dateStr: string) =>
  parseLocalDate(dateStr)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();

// ─── Countdown Hook ───────────────────────────────────────────────────────────

const useCountdown = (dateStr: string) => {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = parseLocalDate(dateStr).getTime();
    const tick = () => setDiff(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    isPast: diff === 0,
  };
};

// ─── FighterHalf ──────────────────────────────────────────────────────────────

const FighterHalf: React.FC<{
  imageUrl?: string | null;
  name: string;
  side: 'left' | 'right';
}> = ({ imageUrl, name, side }) => {
  const [err, setErr] = useState(false);
  return (
    <div className="relative flex-1 overflow-hidden h-full">
      {imageUrl && !err ? (
        <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.05]">
          <img
            src={imageUrl}
            alt={name}
            onError={() => setErr(true)}
            className={cn(
              'w-full h-full object-cover object-top',
              side === 'right' && 'scale-x-[-1]',
            )}
          />
        </div>
      ) : (
        <div
          className="w-full h-full flex items-end justify-center"
          style={{
            background: side === 'left'
              ? 'linear-gradient(135deg, rgba(20,15,5,0.9), rgba(10,8,3,0.95))'
              : 'linear-gradient(225deg, rgba(5,10,20,0.9), rgba(3,6,15,0.95))',
          }}
        >
          <img src={SILHOUETTE} alt="Fighter" className="h-full w-full object-contain opacity-20" />
        </div>
      )}
      {/* Inner edge gradient toward center */}
      <div className={cn(
        'absolute inset-0 pointer-events-none',
        side === 'left'
          ? 'bg-gradient-to-r from-transparent via-transparent to-black/80'
          : 'bg-gradient-to-l from-transparent via-transparent to-black/80',
      )} />
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

// ─── CarouselCard ─────────────────────────────────────────────────────────────

const CarouselCard: React.FC<{
  event: DbEvent;
  detail: DbEventWithFights | undefined;
  fighters: Map<string, any>;
  isCenter: boolean;
  onClick: () => void;
}> = ({ event, detail, fighters, isCenter, onClick }) => {

  const mainFight: DbFight | undefined = useMemo(() => {
    if (!detail?.fights?.length) return undefined;
    return detail.fights.find(f => f.cardPlacement === 'Main Event')
      ?? detail.fights.reduce<DbFight>((p, c) => c.boutOrder < p.boutOrder ? c : p, detail.fights[0]);
  }, [detail]);

  const f1 = mainFight ? fighters.get(mainFight.fighter1Id) : undefined;
  const f2 = mainFight ? fighters.get(mainFight.fighter2Id) : undefined;

  const hasMatchup = f1 || f2;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border select-none',
        'transition-all duration-300',
        isCenter
          ? 'border-yellow-500/30 shadow-[0_8px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(201,168,76,0.12)]'
          : 'border-white/5',
      )}
      style={{ width: CARD_W, height: CARD_H, background: '#080808', cursor: 'pointer' }}
    >
      {/* Background image (if uploaded) */}
      {event.imageUrl && (
        <div className="absolute inset-0">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover object-center opacity-25" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Fighter photos - Adjusted to take full height */}
      <div className="absolute inset-0 flex">
        <FighterHalf imageUrl={f1?.imageUrl} name={f1 ? `${f1.firstName} ${f1.lastName}` : 'TBD'} side="left" />
        <FighterHalf imageUrl={f2?.imageUrl} name={f2 ? `${f2.firstName} ${f2.lastName}` : 'TBD'} side="right" />
      </div>

      {/* Overlaid Matchup Text */}
      <div className="absolute bottom-6 left-0 right-0 z-30 text-center px-4">
        {hasMatchup ? (
          <h3
            className="font-black uppercase tracking-tight text-white leading-none whitespace-nowrap"
            style={{
              fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
              textShadow: "0 2px 20px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.7)",
            }}
          >
            {f1?.lastName ?? 'TBD'} <span style={{ color: GOLD }}>VS</span> {f2?.lastName ?? 'TBD'}
          </h3>
        ) : (
          <p className="font-black uppercase text-white/50 text-xs tracking-widest mb-1">TBD vs TBD</p>
        )}
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Gold inner glow on center active card */}
      {isCenter && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(232,160,32,0.18)' }}
        />
      )}
    </div>
  );
};

// ─── EventListPage ────────────────────────────────────────────────────────────

export const EventListPage = () => {
  const navigate = useNavigate();
  const { fighterMap } = useFighters();

  const { data: events = [], isLoading } = useQuery<DbEvent[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });

  const sortedEvents = useMemo(() => {
    const upcoming = events.filter(e => e.status === 'Upcoming' || e.status === 'Live');
    const past = events.filter(e => !['Upcoming', 'Live'].includes(e.status));
    return [...upcoming, ...past];
  }, [events]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prefetchIds = useMemo(() => {
    const ids: string[] = [];
    if (sortedEvents[currentIndex - 1]) ids.push(sortedEvents[currentIndex - 1].id);
    if (sortedEvents[currentIndex]) ids.push(sortedEvents[currentIndex].id);
    if (sortedEvents[currentIndex + 1]) ids.push(sortedEvents[currentIndex + 1].id);
    return ids;
  }, [sortedEvents, currentIndex]);

  const detailQuery = useQuery<Record<string, DbEventWithFights>>({
    queryKey: ['/api/events/details/multi', ...prefetchIds],
    queryFn: async () => {
      const results = await Promise.all(
        prefetchIds.map(id => fetch(`/api/events/${id}`).then(r => r.ok ? r.json() : null))
      );
      const map: Record<string, DbEventWithFights> = {};
      prefetchIds.forEach((id, i) => { if (results[i]) map[id] = results[i]; });
      return map;
    },
    enabled: prefetchIds.length > 0,
    staleTime: 0, // Always refetch to ensure fresh event data
  });
  const detailMap = detailQuery.data ?? {};

  const goTo = useCallback((idx: number) => {
    if (animating || idx === currentIndex || idx < 0 || idx >= sortedEvents.length) return;
    setAnimating(true);
    setCurrentIndex(idx);
    setTimeout(() => setAnimating(false), 320);
  }, [animating, currentIndex, sortedEvents.length]);

  const prev = () => goTo(currentIndex - 1);
  const next = () => goTo(currentIndex + 1);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const currEvent = sortedEvents[currentIndex];
  const countdown = useCountdown(currEvent?.date ?? '2099-01-01');
  const currDetail = currEvent ? detailMap[currEvent.id] : undefined;
  const fightCount = currDetail?.fights?.length ?? 0;
  const playerCount = currEvent ? formatPlayerCount(seedPlayerCount(currEvent.id)) : '—';
  const isLive = currEvent?.status === 'Live';

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6 py-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-2/3 max-w-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="pt-3 border-t border-white/5">
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events yet"
        description="The arena is quiet for now. Check back soon for the next card."
      />
    );
  }

  return (
    <div
      className="relative flex flex-col items-center w-full select-none pb-12 overflow-hidden arena-backdrop"
      style={{ minHeight: '100vh', background: '#0a0a0a' }}
    >
      <SEO
        title="Events"
        description="Browse upcoming MMA events on GRIT Global MMA Fantasy League."
        keywords="MMA events, UFC, fight card, fantasy MMA"
      />

      {/* Bokeh spotlight orbs */}
      <div className="bokeh-spot bokeh-spot-left" />
      <div className="bokeh-spot bokeh-spot-right" />

      {/* ── Fixed Header ─────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center w-full pt-8 px-6 text-center flex-shrink-0">
        <span
          className="text-4xl md:text-5xl font-black tracking-[0.35em] uppercase mb-0.5"
          style={{ color: GOLD, textShadow: `0 0 40px ${GOLD}55, 0 2px 6px rgba(0,0,0,0.9)` }}
        >
          GRIT
        </span>
        <span className="text-[10px] tracking-[0.2em] text-white/25 uppercase font-semibold mb-4">
          Global MMA Fantasy League
        </span>
      </div>

      {/* ── Carousel Track (Fighters Only) ─────────────── */}
      <div
        className="relative w-full z-10 flex flex-col justify-center flex-1 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full overflow-hidden" style={{ height: CARD_H + 32 }}>
          <div
            className="absolute top-4 flex items-center will-change-transform"
            style={{
              left: 0,
              transform: `translateX(calc(50% - ${currentIndex * CARD_W + CARD_W / 2 + currentIndex * 16}px))`,
              transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              gap: 16,
            }}
          >
            {sortedEvents.map((event, i) => {
              const isCenter = i === currentIndex;
              const distance = Math.abs(i - currentIndex);
              const isAdjacent = distance === 1;
              const isVisible = distance <= 1;

              const rotateY = i < currentIndex ? 25 : i > currentIndex ? -25 : 0;
              const scale = isCenter ? 1 : 0.85;
              const opacity = isCenter ? 1 : isAdjacent ? 0.4 : 0;

              return (
                <div
                  key={event.id}
                  style={{
                    flexShrink: 0,
                    transform: `perspective(1000px) rotateY(${rotateY}deg) scale(${scale})`,
                    transformOrigin: i < currentIndex ? 'right center' : i > currentIndex ? 'left center' : 'center center',
                    opacity,
                    transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    filter: isCenter ? 'none' : 'brightness(0.4) saturate(0.5)',
                    pointerEvents: isVisible ? 'auto' : 'none',
                  }}
                  onClick={() => isCenter ? navigate(`/event/${event.id}`) : goTo(i)}
                >
                  <CarouselCard
                    event={event}
                    detail={detailMap[event.id]}
                    fighters={fighterMap}
                    isCenter={isCenter}
                    onClick={() => isCenter ? navigate(`/event/${event.id}`) : goTo(i)}
                  />
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          {currentIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6 text-white/70" />
            </button>
          )}
          {currentIndex < sortedEvents.length - 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6 text-white/70" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-2">
          {sortedEvents.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentIndex ? 'w-6 h-1.5' : 'w-1.5 h-1.5 bg-white/10'
              )}
              style={i === currentIndex ? { background: GOLD } : {}}
            />
          ))}
        </div>
      </div>

      {/* ── Event Info Section (Bottom) ────────────────── */}
      <div className="relative z-10 flex-shrink-0 w-full pt-4 pb-8 px-6 text-center space-y-3">
        {/* Live badge */}
        {isLive && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 mx-auto">
            <Flame className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Live Now</span>
          </div>
        )}

        {/* Event details block */}
        <div
          className="max-w-md mx-auto p-5 rounded-2xl border border-white/5 space-y-2.5"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}
        >
          {currEvent && (
            <h2 className="font-black uppercase tracking-tight text-white m-0" style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}>
              {currEvent.name}
            </h2>
          )}

          {currEvent && (
            <div className="flex flex-col gap-1 text-[11px] text-white/50 uppercase tracking-[0.15em] font-bold">
              <span className="flex items-center justify-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/30" />
                {formatShortDate(currEvent.date)}
              </span>
              {currEvent.venue && (
                <span className="flex items-center justify-center gap-1.5">
                  <MapPin className="w-3 h-3 text-white/30" />
                  {currEvent.venue}{currEvent.city ? `, ${currEvent.city}` : ''}
                </span>
              )}
            </div>
          )}

          {/* Countdown */}
          {currEvent && !isLive && !countdown.isPast && (
            <div className="flex items-center justify-center gap-3 font-black text-white pt-1">
              <div className="text-center">
                <span className="text-xl">{countdown.days}</span>
                <span className="text-[10px] text-white/40 block -mt-1">D</span>
              </div>
              <span className="text-white/20">:</span>
              <div className="text-center">
                <span className="text-xl">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="text-[10px] text-white/40 block -mt-1">H</span>
              </div>
              <span className="text-white/20">:</span>
              <div className="text-center">
                <span className="text-xl">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] text-white/40 block -mt-1">M</span>
              </div>
            </div>
          )}

          {/* Stats divider line */}
          <div className="flex items-center justify-center gap-6 py-1 border-t border-white/5">
            <div className="text-center">
              <span className="text-sm font-black text-white">{fightCount}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-widest block font-bold">Fights</span>
            </div>
            <div className="w-px h-6 bg-white/5" />
            <div className="text-center">
              <span className="text-sm font-black text-white">{playerCount}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-widest block font-bold">Players</span>
            </div>
          </div>

          {/* Button */}
          {currEvent && (
            <div className="pt-2 relative overflow-hidden rounded-2xl group/btn">
              {isLive && (
                <div className="absolute inset-0 bg-[#E8A020]/20 animate-pulse-slow pointer-events-none" />
              )}
              <button
                onClick={() => navigate(`/event/${currEvent.id}`)}
                className="gold-btn button-press-scale w-full py-4 text-[11px] font-black tracking-[0.2em] uppercase relative z-10"
                style={{ borderRadius: '1rem' }}
              >
                ENTER DRAFT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventListPage;
