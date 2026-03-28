import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Fighter } from '@/shared/types/fighter';
import { HistoryFightCard } from './HistoryFightCard';
import { useFighters } from '@/shared/hooks/useFighters';
import { cn } from '@/shared/lib/utils';
import { AlertCircle, Calendar, History, Database, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';

interface CompletedEvent {
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
  createdAt: string;
  fights: {
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
  }[];
}

interface FightResult {
  id: string;
  fightId: string;
  winnerId: string;
  method: string;
  methodDetail: string | null;
  round: number;
  time: string;
  referee: string | null;
}

interface UserPick {
  id: string;
  fightId: string;
  pickedFighterId: string;
  pickedMethod: string;
  pickedRound: number | null;
  pointsAwarded: number | null;
}

interface EventHistoryPageProps {
  onNavigateToImport?: () => void;
}

export const EventHistoryPage: React.FC<EventHistoryPageProps> = ({ onNavigateToImport }) => {
  const { fighters, fighterMap, isLoaded } = useFighters();
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const { data: completedEvents = [], isLoading: eventsLoading } = useQuery<CompletedEvent[]>({
    queryKey: ['/api/events/completed'],
  });

  const { data: fightResults = [] } = useQuery<FightResult[]>({
    queryKey: ['/api/fights/results'],
  });

  const { data: userPicks = [] } = useQuery<UserPick[]>({
    queryKey: ['/api/picks'],
  });

  const selectedEvent = useMemo(() => {
    if (completedEvents.length === 0) return null;
    if (!selectedEventId) return completedEvents[0];
    return completedEvents.find(e => e.id === selectedEventId) || completedEvents[0];
  }, [completedEvents, selectedEventId]);

  const getFighter = (id: string): Fighter | undefined => fighterMap.get(id);

  const getResult = (fightId: string) => {
    return fightResults.find(r => r.fightId === fightId);
  };

  const getUserPick = (fightId: string) => {
    return userPicks.find(p => p.fightId === fightId);
  };

  const eventPerformance = useMemo(() => {
    if (!selectedEvent) return { correct: 0, total: 0, percentage: 0, totalPoints: 0 };
    
    let correct = 0;
    let total = 0;
    let totalPoints = 0;
    
    selectedEvent.fights.forEach(fight => {
      const result = getResult(fight.id);
      const pick = getUserPick(fight.id);
      
      if (result && pick) {
        total++;
        if (pick.pickedFighterId === result.winnerId) {
          correct++;
        }
        if (pick.pointsAwarded) {
          totalPoints += pick.pointsAwarded;
        }
      }
    });
    
    return { 
      correct, 
      total, 
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      totalPoints
    };
  }, [selectedEvent, fightResults, userPicks]);

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoaded && fighters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Fighter Data</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Import fighter data to view event history with full fighter details.
        </p>
        {onNavigateToImport && (
          <Button onClick={onNavigateToImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Go to Import
          </Button>
        )}
      </div>
    );
  }

  if (completedEvents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display tracking-wide text-foreground uppercase">
              Event History
            </h1>
          </div>
          <p className="text-muted-foreground">
            Review your picks and performance from past events
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Calendar className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Completed Events</h2>
          <p className="text-muted-foreground max-w-md">
            Once events are completed and finalized by administrators, your pick history will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-display tracking-wide text-foreground uppercase">
            Event History
          </h1>
        </div>
        <p className="text-muted-foreground">
          Review your picks and performance from past events
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Select 
          value={selectedEventId || (selectedEvent?.id || '')} 
          onValueChange={setSelectedEventId}
        >
          <SelectTrigger className="w-64 bg-card border-border">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {completedEvents.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name} - {new Date(event.date).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className={cn(
          "px-6 py-3 rounded-xl border",
          eventPerformance.percentage >= 70 && "bg-green-500/10 border-green-500/30",
          eventPerformance.percentage >= 40 && eventPerformance.percentage < 70 && "bg-yellow-500/10 border-yellow-500/30",
          eventPerformance.percentage < 40 && "bg-red-500/10 border-red-500/30"
        )}>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Event Performance
            </span>
            <div className={cn(
              "text-2xl font-bold mt-1",
              eventPerformance.percentage >= 70 && "text-green-400",
              eventPerformance.percentage >= 40 && eventPerformance.percentage < 70 && "text-yellow-400",
              eventPerformance.percentage < 40 && "text-red-400"
            )}>
              {eventPerformance.correct} / {eventPerformance.total}
              <span className="text-lg ml-2">({eventPerformance.percentage}%)</span>
            </div>
            {eventPerformance.totalPoints > 0 && (
              <div className="text-sm text-primary mt-1">
                {eventPerformance.totalPoints} points earned
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <>
          <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
            <h2 className="text-xl font-display tracking-wide text-foreground uppercase">
              {selectedEvent.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} {selectedEvent.venue && `• ${selectedEvent.venue}, ${selectedEvent.city}`}
            </p>
          </div>

          <div className="space-y-4">
            {selectedEvent.fights.map((fight) => {
              const result = getResult(fight.id);
              const pick = getUserPick(fight.id);
              
              if (!result) return null;

              const picks = [];
              if (pick) {
                const fighter = getFighter(pick.pickedFighterId);
                picks.push({
                  type: 'moneyline' as const,
                  label: 'Winner',
                  userPick: fighter ? `${fighter.firstName} ${fighter.lastName}` : 'Unknown',
                  actualResult: getFighter(result.winnerId)?.lastName || 'Unknown',
                  isCorrect: pick.pickedFighterId === result.winnerId,
                });
                picks.push({
                  type: 'method' as const,
                  label: 'Method',
                  userPick: pick.pickedMethod,
                  actualResult: result.method,
                  isCorrect: pick.pickedMethod.toLowerCase() === result.method.toLowerCase(),
                });
                if (pick.pickedRound) {
                  picks.push({
                    type: 'round' as const,
                    label: 'Round',
                    userPick: `R${pick.pickedRound}`,
                    actualResult: `R${result.round}`,
                    isCorrect: pick.pickedRound === result.round,
                  });
                }
              }

              return (
                <HistoryFightCard
                  key={fight.id}
                  fight={{
                    id: fight.id,
                    eventId: fight.eventId,
                    fighter1Id: fight.fighter1Id,
                    fighter2Id: fight.fighter2Id,
                    weightClass: fight.weightClass,
                    boutOrder: fight.boutOrder,
                    isTitleFight: fight.isTitleFight,
                    fightType: fight.cardPlacement,
                    status: fight.status,
                  }}
                  fighter1={getFighter(fight.fighter1Id)}
                  fighter2={getFighter(fight.fighter2Id)}
                  picks={picks}
                  result={{
                    winnerId: result.winnerId,
                    method: result.method,
                    round: result.round,
                  }}
                />
              );
            })}
          </div>

          {selectedEvent.fights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Fights</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This event doesn't have any fights recorded.
              </p>
            </div>
          )}
        </>
      )}

      <div className="text-center py-6 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Click any fight card to review your picks and notes
        </p>
      </div>
    </div>
  );
};
