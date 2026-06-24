import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fighter, EventFight } from '@/shared/types/fighter';
import { useFighters } from '@/shared/hooks/useFighters';
import { useAuth } from '@/shared/hooks/use-auth';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Zap,
  Swords,
  Lock,
  Database,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { FighterComparisonCard } from '@/user/components/fightdetail/FighterComparisonCard';
import { StatsComparison } from '@/user/components/fightdetail/StatsComparison';
import { BettingOddsSection } from '@/user/components/fightdetail/BettingOddsSection';
import { FantasyPickSection } from '@/user/components/fightdetail/FantasyPickSection';
import { PostFightNotes } from '@/user/components/fightdetail/PostFightNotes';
import { RateFighterCard } from '@/user/components/fightdetail/RateFighterCard';
import { WarRoomAnalytics } from '@/user/components/fightdetail/WarRoomAnalytics';
import { AIChatTab } from '@/user/components/aichat/AIChatTab';
import { logClientError, trackMetric } from '@/shared/lib/logger';

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
  status: string;
  fights: DbEventFight[];
}

interface DbEventFight {
  id: string;
  eventId: string;
  fighter1Id: string;
  fighter2Id: string;
  cardPlacement: string;
  boutOrder: number;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
  status: string;
}

const FightDetail: React.FC = () => {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const { fighters, fighterMap, isLoaded } = useFighters();

  // Fetch all events to find the fight
  const { data: events = [], isLoading: eventsLoading } = useQuery<DbEvent[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const eventsRes = await fetch('/api/events');
      if (!eventsRes.ok) return [];
      const eventsList = await eventsRes.json();

      // Fetch fights for each event
      const eventsWithFights = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventsList.map(async (event: any) => {
          const res = await fetch(`/api/events/${event.id}`);
          if (!res.ok) return { ...event, fights: [] };
          return res.json();
        })
      );
      return eventsWithFights;
    },
  });

  // Find the fight and its event
  const { fight, event } = useMemo(() => {
    for (const evt of events) {
      const foundFight = evt.fights?.find((f: DbEventFight) => f.id === fightId);
      if (foundFight) {
        return {
          fight: {
            id: foundFight.id,
            eventId: foundFight.eventId,
            fighter1Id: foundFight.fighter1Id,
            fighter2Id: foundFight.fighter2Id,
            fightType: foundFight.cardPlacement === 'Preliminary' ? 'Prelim' as const : 'Main Card' as const,
            boutOrder: foundFight.boutOrder,
            weightClass: foundFight.weightClass,
            isTitleFight: foundFight.isTitleFight,
            rounds: foundFight.rounds,
            status: foundFight.status as 'Scheduled' | 'Completed' | 'Cancelled',
          } as EventFight,
          event: evt
        };
      }
    }
    return { fight: undefined, event: undefined };
  }, [events, fightId]);

  const fighter1 = fight ? fighterMap.get(fight.fighter1Id) : undefined;
  const fighter2 = fight ? fighterMap.get(fight.fighter2Id) : undefined;

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing pick for this fight
  const { data: existingPick } = useQuery({
    queryKey: ['/api/picks/fight', fightId],
    queryFn: async () => {
      if (!fightId) return null;
      const res = await fetch(`/api/picks/fight/${fightId}`, { credentials: 'include' });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!fightId && isAuthenticated,
  });

  // Fantasy pick state
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const selectedUnits = 1;
  const [selectedConfidenceFlag, setSelectedConfidenceFlag] = useState<'none' | 'yellow' | 'red' | 'green'>('none');
  const [isPickLocked, setIsPickLocked] = useState(false);

  // Sync state with existing pick from database
  useEffect(() => {
    if (existingPick) {
      setSelectedFighter(existingPick.pickedFighterId);
      setSelectedMethod(existingPick.pickedMethod);
      setSelectedRound(existingPick.pickedRound);
      setSelectedConfidenceFlag(existingPick.confidenceFlag || 'none');
      setIsPickLocked(existingPick.isLocked || false);
    }
  }, [existingPick]);

  // Check if fight is completed (for post-fight notes)
  const isFightCompleted = fight?.status === 'Completed' || fight?.status === 'CLOSED';

  // Fetch true completedAt from fight results if completed
  const { data: fightResult } = useQuery({
    queryKey: ['fight-result', fightId],
    queryFn: async () => {
      if (!fightId) return null;
      const res = await fetch(`/api/fights/${fightId}/result`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!fightId && isFightCompleted,
  });

  // Collapsible analytics — open by default
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  // Fetch real-time event qualification status
  const { data: qualificationStatus } = useQuery({
    queryKey: ['/api/picks/event', event?.id, 'qualification'],
    queryFn: async () => {
      if (!event?.id) return null;
      const res = await fetch(`/api/picks/event/${event.id}/qualification`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!event?.id && isAuthenticated,
  });

  // Ref for undo timeout so we can clear it if needed
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save pick mutation
  const savePick = useMutation({
    mutationFn: async (data: { fightId: string; pickedFighterId: string; pickedMethod: string; pickedRound: number | null; units: 1; confidenceFlag: 'none' | 'yellow' | 'red' | 'green' }) => {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save pick');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/picks/fight', fightId] });
      queryClient.invalidateQueries({ queryKey: ['/api/picks/event', event?.id, 'qualification'] });
      trackMetric('pick_submit_success', 1);
      toast({ title: 'Prediction locked!', description: 'Good luck!' });
    },
    onError: (error: Error) => {
      logClientError({ 
        location: 'FightDetail', 
        action: 'submit_pick', 
        error: error.message 
      });
      trackMetric('pick_submit_fail', 1);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete pick mutation — calls existing DELETE /api/picks/:fightId
  const deletePick = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/picks/${fightId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete pick');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/picks/fight', fightId] });
      queryClient.invalidateQueries({ queryKey: ['/api/picks/event', event?.id, 'qualification'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Cannot edit pick', description: error.message, variant: 'destructive' });
    },
  });

  // Reset local pick state and unlock for editing
  const handleEditPick = () => {
    deletePick.mutate();
    setSelectedFighter(null);
    setSelectedMethod(null);
    setSelectedRound(null);
    setIsPickLocked(false);
  };

  // Loading state
  if (eventsLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading fight details...</p>
        </div>
      </div>
    );
  }

  // Empty state - no fighter data
  if (isLoaded && fighters.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-muted-foreground/50 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Fight Details Unavailable</h2>
          <p className="text-muted-foreground">This fight isn't available yet. Check back when the card is finalized.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!fight || !fighter1 || !fighter2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Swords className="w-16 h-16 text-muted-foreground/50 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Fight Not Found</h2>
          <p className="text-muted-foreground">This matchup doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Return to Event Card
          </button>
        </div>
      </div>
    );
  }

  const handleLockPick = () => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please log in to save your prediction.', variant: 'destructive' });
      return;
    }

    const isFinishMethod = selectedMethod === 'ko' || selectedMethod === 'sub';
    const roundRequired = isFinishMethod ? selectedRound !== null : true;
    if (selectedFighter && selectedMethod && roundRequired && fightId) {
      // Capture snapshot for undo
      const snapFighter = selectedFighter;
      const snapMethod = selectedMethod;
      const snapRound = selectedRound;
      const snapConfidenceFlag = selectedConfidenceFlag;

      savePick.mutate({
        fightId,
        pickedFighterId: snapFighter,
        pickedMethod: snapMethod,
        pickedRound: snapRound,
        units: 1,
        confidenceFlag: snapConfidenceFlag,
      });
      setIsPickLocked(true);

      // 5-second undo window via toast action
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      toast({
        title: '✅ Pick locked in!',
        description: 'Changed your mind? You can undo within 5 seconds.',
        action: (
          <button
            onClick={() => {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              handleEditPick();
            }}
            className="shrink-0 rounded-md border border-muted-foreground/30 px-3 py-1.5 text-xs font-bold hover:bg-muted transition-colors"
          >
            Undo
          </button>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any,
      });
      // Auto-expire undo after 5s (toast dismisses naturally)
      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null;
      }, 5000);
    }
  };

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method);
    // Reset round when method changes to Decision (no round needed)
    if (method === 'dec') {
      setSelectedRound(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/event"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Event List</span>
          </Link>

          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {event?.name}
            </span>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero Section - Event & Fight Title */}
      <section className="relative overflow-hidden">
        {/* Background gradient - more dramatic */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14">
          {/* Event Name - THE ANCHOR */}
          <div className="text-center mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                {event?.name}
              </span>
            </h1>
            <div className="mt-2 flex items-center justify-center gap-3 text-muted-foreground">
              <span className="text-sm md:text-base">{event?.venue}, {event?.city}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-sm md:text-base">{event?.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
            </div>
          </div>

          {/* Fight Position Badge - Main/Co-Main */}
          <div className="flex justify-center mb-4">
            {fight.boutOrder === 1 && (
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-accent/30 to-accent/20 border border-accent/50 shadow-lg shadow-accent/10">
                <Crown className="w-5 h-5 text-accent" />
                <span className="text-sm md:text-base font-bold uppercase tracking-wider text-accent">
                  Main Event
                </span>
              </div>
            )}
            {fight.boutOrder === 2 && (
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 border border-primary/50 shadow-lg shadow-primary/10">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm md:text-base font-bold uppercase tracking-wider text-primary">
                  Co-Main Event
                </span>
              </div>
            )}
            {fight.boutOrder > 2 && (
              <div className="px-4 py-1.5 rounded-full bg-muted/50 border border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bout #{fight.boutOrder}
                </span>
              </div>
            )}
          </div>

          {/* Weight Class + Title Context */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm md:text-base uppercase tracking-widest text-foreground/80 font-medium">
              {fight.weightClass}
            </span>
            {fight.isTitleFight && (
              <>
                <span className="w-1 h-1 rounded-full bg-yellow-500" />
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm md:text-base font-bold uppercase tracking-wider text-yellow-500">
                    Title Fight
                  </span>
                </div>
              </>
            )}
          </div>

          {/* VS Title - Fighter Names */}
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-black">
              <span className="text-foreground">{fighter1.lastName.toUpperCase()}</span>
              <span className="mx-4 text-primary font-bold">VS</span>
              <span className="text-foreground">{fighter2.lastName.toUpperCase()}</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
        {/* Fighter Comparison Cards */}
        <section className="grid md:grid-cols-2 gap-6">
          <FighterComparisonCard
            fighter={fighter1}
            corner="red"
            isSelected={selectedFighter === fighter1.id}
            onSelect={() => !isPickLocked && setSelectedFighter(fighter1.id)}
            isPickLocked={isPickLocked}
          />
          <FighterComparisonCard
            fighter={fighter2}
            corner="blue"
            isSelected={selectedFighter === fighter2.id}
            onSelect={() => !isPickLocked && setSelectedFighter(fighter2.id)}
            isPickLocked={isPickLocked}
          />
        </section>

        {/* Fantasy Pick Section — immediately below fighter cards */}
        <section id="pick-section">
          {/* Real-time Qualification Banner */}
          {qualificationStatus && fight.status !== 'Completed' && fight.status !== 'Cancelled' && (
            <div className={cn(
              "mb-6 p-4 rounded-xl border-2 shadow-lg transition-all",
              qualificationStatus.isQualified 
                ? "bg-primary/10 border-primary text-primary"
                : "bg-muted/30 border-muted-foreground/30 text-foreground"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  qualificationStatus.isQualified ? "bg-primary/20" : "bg-muted-foreground/20"
                )}>
                  {qualificationStatus.isQualified ? <Trophy className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  {qualificationStatus.isQualified ? (
                    <>
                      <p className="font-bold text-lg">You are qualified for this event!</p>
                      <p className="text-sm opacity-90">Keep picking to improve your score and rank higher.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">Event Qualification</p>
                      <p className="text-sm opacity-80">
                        You have {qualificationStatus.currentPicks} {qualificationStatus.currentPicks === 1 ? 'pick' : 'picks'}. 
                        You need <span className="font-bold text-primary">{qualificationStatus.requiredPicks - qualificationStatus.currentPicks} more</span> to qualify for this event.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <FantasyPickSection
            fighter1={fighter1}
            fighter2={fighter2}
            selectedFighter={selectedFighter}
            selectedMethod={selectedMethod}
            selectedRound={selectedRound}
            onSelectMethod={handleSelectMethod}
            onSelectRound={setSelectedRound}
            isLocked={isPickLocked}
            onLock={handleLockPick}
            onEditPick={handleEditPick}
            isEditingPick={deletePick.isPending}
            totalRounds={fight.rounds}
            units={selectedUnits}
            confidenceFlag={selectedConfidenceFlag}
            onSelectConfidenceFlag={setSelectedConfidenceFlag}
            flagBudget={qualificationStatus?.flagBudget ?? 0}
            flagsUsed={qualificationStatus?.flagsUsed ?? 0}
          />
        </section>

        {/* War Room Analytics — collapsible, secondary */}
        <section className="glass-morphism border border-white/5 overflow-hidden">
          <button
            onClick={() => setAnalyticsOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">War Room Analytics</span>
            <ChevronDown
              className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', analyticsOpen && 'rotate-180')}
            />
          </button>
          {analyticsOpen && (
            <div className="px-6 pb-10 pt-2">
              <WarRoomAnalytics fighter1={fighter1} fighter2={fighter2} />
            </div>
          )}
        </section>

        {/* Secondary Details */}
        <section className="grid md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
          <StatsComparison fighter1={fighter1} fighter2={fighter2} />
          <BettingOddsSection fighter1={fighter1} fighter2={fighter2} />
        </section>

        {/* Post-Fight Notes (structure ready, conditional display) */}
        <PostFightNotes
          fighter1={fighter1}
          fighter2={fighter2}
          fightId={fightId!}
          isFightCompleted={isFightCompleted}
          completedAt={fightResult?.completedAt}
        />

        {/* Rate the Fighters — 5 dimensions, 1–10 stars (blueprint §9) */}
        <section className="grid md:grid-cols-2 gap-6">
          <RateFighterCard
            fighter={fighter1}
            fightId={fightId!}
            isFightCompleted={isFightCompleted}
            completedAt={fightResult?.completedAt}
          />
          <RateFighterCard
            fighter={fighter2}
            fightId={fightId!}
            isFightCompleted={isFightCompleted}
            completedAt={fightResult?.completedAt}
          />
        </section>

        {/* Fight Analyst AI */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Fight Analyst AI</h2>
            <span className="text-xs uppercase tracking-widest text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Premium
            </span>
          </div>
          <AIChatTab
            fighterIds={[fighter1.id, fighter2.id]}
            fightContext={{
              fighter1Name: `${fighter1.firstName} ${fighter1.lastName}`,
              fighter2Name: `${fighter2.firstName} ${fighter2.lastName}`,
              fightId: fightId,
            }}
          />
        </section>
      </main>
    </div>
  );
};

export default FightDetail;
