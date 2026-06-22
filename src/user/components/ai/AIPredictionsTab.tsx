import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth-clerk';
import { AIChatTab } from '@/user/components/aichat/AIChatTab';
import {
    Brain,
    Loader2,
    Crown,
    Sparkles,
    Zap,
    Target,
    TrendingUp,
    Shield,
    ChevronRight,
    ArrowLeft,
    Swords,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface Fight {
    id: string;
    fighter1: { id: string; firstName: string; lastName: string };
    fighter2: { id: string; firstName: string; lastName: string };
    hasCachedPrediction: boolean;
    weightClass?: string;
    boutOrder?: number;
}

interface Event {
    id: string;
    name: string;
    date?: string;
    fights: Fight[];
}

interface SelectedFight {
    fightId: string;
    fighter1Id: string;
    fighter2Id: string;
    fighter1Name: string;
    fighter2Name: string;
    eventName: string;
}

export const AIPredictionsTab: React.FC = () => {
    const { user } = useAuth();
    const [selectedFight, setSelectedFight] = useState<SelectedFight | null>(null);

    const isPremium = user?.tier === 'premium' || user?.role === 'admin';

    const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['/api/ai/events'],
        queryFn: async () => {
            const [eventsResponse, fightersResponse] = await Promise.all([
                fetch('/api/events'),
                fetch('/api/fighters'),
            ]);
            if (!eventsResponse.ok || !fightersResponse.ok) {
                throw new Error('Failed to load AI fight selection data');
            }
            const eventSummaries = await eventsResponse.json() as Array<{
                id: string;
                name: string;
                date?: string;
                status: string;
            }>;
            const fighters = await fightersResponse.json() as Array<{
                id: string;
                firstName: string;
                lastName: string;
            }>;
            const fighterById = new Map(fighters.map((fighter) => [fighter.id, fighter]));
            const selectableEvents = eventSummaries.filter((event) =>
                event.status === 'Upcoming' || event.status === 'Live'
            );

            return Promise.all(selectableEvents.map(async (event) => {
                const response = await fetch(`/api/events/${event.id}`);
                if (!response.ok) throw new Error(`Failed to load ${event.name}`);
                const detail = await response.json() as {
                    fights?: Array<{
                        id: string;
                        fighter1Id: string;
                        fighter2Id: string;
                        weightClass?: string;
                        boutOrder?: number;
                    }>;
                };
                return {
                    id: event.id,
                    name: event.name,
                    date: event.date,
                    fights: (detail.fights ?? []).flatMap((fight) => {
                        const fighter1 = fighterById.get(fight.fighter1Id);
                        const fighter2 = fighterById.get(fight.fighter2Id);
                        return fighter1 && fighter2 ? [{ ...fight, fighter1, fighter2, hasCachedPrediction: false }] : [];
                    }),
                };
            }));
        },
        enabled: !!user && isPremium,
    });

    if (!isPremium) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 p-8 border border-yellow-500/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shine" />
                    <div className="absolute top-4 right-8 w-2 h-2 bg-yellow-400/40 rounded-full animate-pulse" />
                    <div className="absolute top-12 right-24 w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-8 right-16 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

                    <div className="relative text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-600/30 mb-6 shadow-lg shadow-yellow-500/20">
                            <Crown className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h1 className="text-4xl font-display tracking-wide text-foreground uppercase mb-2">
                            <span className="text-gradient-brand">AI Fight Analyst</span>
                        </h1>
                        <p className="text-lg text-yellow-200/80 mb-2">Powered by Claude</p>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Select any fight and talk directly with an AI analyst focused entirely on that matchup — styles, stats, analysis, keys to victory.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { icon: Brain, label: 'Matchup Analysis', description: 'Deep fighter stats & style breakdowns' },
                        { icon: Target, label: 'Keys to Victory', description: 'What each fighter needs to win' },
                        { icon: Zap, label: 'Upset Detection', description: 'Identify underdog opportunities' },
                        { icon: TrendingUp, label: 'Fight Analysis', description: 'Method, round & outcome analysis' },
                    ].map((feature, idx) => (
                        <div
                            key={feature.label}
                            className={cn(
                                'p-5 rounded-xl border border-yellow-500/20 bg-card/50 backdrop-blur-sm',
                                'hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all duration-300',
                                'animate-slide-up'
                            )}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-yellow-500/10">
                                    <feature.icon className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground mb-1">{feature.label}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Button
                        size="lg"
                        className={cn(
                            'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500',
                            'hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400',
                            'text-black font-bold px-8 py-6 text-lg',
                            'shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50',
                            'transition-all duration-300 hover:scale-105 button-press-scale'
                        )}
                    >
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                        <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                        Unlimited fight-by-fight analysis sessions, included with Premium.
                    </p>
                </div>
            </div>
        );
    }

    // Chat view — fight has been selected
    if (selectedFight) {
        return (
            <div className="space-y-4 animate-fade-in">
                {/* Back button + fight context header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedFight(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        All fights
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedFight.eventName}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                            {selectedFight.fighter1Name.split(' ').pop()} vs {selectedFight.fighter2Name.split(' ').pop()}
                        </span>
                    </div>
                </div>

                {/* The unified AI chat component in fight-context mode */}
                <AIChatTab
                    fighterIds={[selectedFight.fighter1Id, selectedFight.fighter2Id]}
                    fightContext={{
                        fighter1Name: selectedFight.fighter1Name,
                        fighter2Name: selectedFight.fighter2Name,
                        fightId: selectedFight.fightId,
                    }}
                />
            </div>
        );
    }

    // Fight selector view
    if (eventsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Brain className="w-16 h-16 text-primary animate-pulse relative" />
                </div>
                <p className="text-muted-foreground mt-4">Loading fights...</p>
                <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
            </div>
        );
    }

    const allFights = events?.flatMap(e => e.fights) ?? [];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-cyan-500/10 p-6 border border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shine" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                            <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display tracking-wide text-foreground uppercase">
                                AI Fight Analyst
                            </h1>
                            <p className="text-sm text-muted-foreground">Select a fight to start your analysis session</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400">PREMIUM</span>
                    </div>
                </div>
            </div>

            {/* Events & fights list */}
            {!events || events.length === 0 ? (
                <div className="text-center py-16">
                    <Brain className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">No Upcoming Fights</h3>
                    <p className="text-muted-foreground">Check back soon — fight data will appear here once events are loaded.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
                        >
                            {/* Event header */}
                            <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-border">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <h2 className="font-bold text-lg text-foreground">{event.name}</h2>
                                    {event.date && (
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Fight rows */}
                            <div className="divide-y divide-border">
                                {event.fights.map((fight) => (
                                    <button
                                        key={fight.id}
                                        onClick={() =>
                                            setSelectedFight({
                                                fightId: fight.id,
                                                fighter1Id: fight.fighter1.id,
                                                fighter2Id: fight.fighter2.id,
                                                fighter1Name: `${fight.fighter1.firstName} ${fight.fighter1.lastName}`,
                                                fighter2Name: `${fight.fighter2.firstName} ${fight.fighter2.lastName}`,
                                                eventName: event.name,
                                            })
                                        }
                                        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left group button-press-scale"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Swords className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">
                                                        {fight.fighter1.lastName}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">vs</span>
                                                    <span className="font-bold text-foreground">
                                                        {fight.fighter2.lastName}
                                                    </span>
                                                </div>
                                                {fight.weightClass && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{fight.weightClass}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MessageSquare className="w-3 h-3" />
                                                Analyze
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
