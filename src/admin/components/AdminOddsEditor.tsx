import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
    TrendingUp, Save, Loader2, Calendar, Swords, ChevronRight
} from 'lucide-react';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

interface Event {
    id: string;
    name: string;
    date: string;
    status: string;
}

interface Fight {
    id: string;
    eventId: string;
    fighter1Id: string;
    fighter2Id: string;
    fighter1Name?: string;
    fighter2Name?: string;
    weightClass: string;
    odds: {
        fighter1Odds?: string;
        fighter2Odds?: string;
        overUnder?: string;
        source?: string;
    } | null;
}

export const AdminOddsEditor: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    // Fetch events
    const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['/api/events'],
    });

    // Fetch fights for selected event
    const { data: fights = [], isLoading: fightsLoading } = useQuery<Fight[]>({
        queryKey: [`/api/events/${selectedEventId}/fights`],
        enabled: !!selectedEventId,
    });

    // Save odds mutation
    const saveMutation = useMutation({
        mutationFn: async ({ fightId, odds }: { fightId: string; odds: Fight['odds'] }) => {
            const res = await fetchWithAuth(`/api/admin/fights/${fightId}/odds`, {
                method: 'PUT',
                body: JSON.stringify({ odds }),
            });
            if (!res.ok) throw new Error('Failed to save odds');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/events/${selectedEventId}/fights`] });
        },
    });

    const upcomingEvents = events
        .filter(e => e.status === 'Upcoming' || e.status === 'Live')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Event Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Select Event
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {eventsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : (
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an event..." />
                            </SelectTrigger>
                            <SelectContent>
                                {upcomingEvents.map((event) => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.name} — {new Date(event.date).toLocaleDateString()}
                                    </SelectItem>
                                ))}
                                {upcomingEvents.length === 0 && (
                                    <SelectItem value="none" disabled>No upcoming events</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* Fights & Odds */}
            {selectedEventId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Fight Odds
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {fightsLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : fights.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No fights for this event</p>
                        ) : (
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-4">
                                    {fights.map((fight) => (
                                        <FightOddsRow
                                            key={fight.id}
                                            fight={fight}
                                            onSave={(odds) => saveMutation.mutate({ fightId: fight.id, odds })}
                                            isSaving={saveMutation.isPending}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

interface FightOddsRowProps {
    fight: Fight;
    onSave: (odds: Fight['odds']) => void;
    isSaving: boolean;
}

const FightOddsRow: React.FC<FightOddsRowProps> = ({ fight, onSave, isSaving }) => {
    const [f1Odds, setF1Odds] = useState(fight.odds?.fighter1Odds || '');
    const [f2Odds, setF2Odds] = useState(fight.odds?.fighter2Odds || '');
    const [overUnder, setOverUnder] = useState(fight.odds?.overUnder || '');
    const [source, setSource] = useState(fight.odds?.source || '');

    const hasChanges = f1Odds !== (fight.odds?.fighter1Odds || '') ||
        f2Odds !== (fight.odds?.fighter2Odds || '') ||
        overUnder !== (fight.odds?.overUnder || '') ||
        source !== (fight.odds?.source || '');

    return (
        <div className="p-4 rounded-lg border border-border space-y-3">
            {/* Fight Header */}
            <div className="flex items-center gap-2 text-sm">
                <Swords className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                    {fight.fighter1Name || fight.fighter1Id.slice(0, 8)}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">vs</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">
                    {fight.fighter2Name || fight.fighter2Id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{fight.weightClass}</span>
            </div>

            {/* Odds Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Fighter 1 Odds</Label>
                    <Input
                        placeholder="-150"
                        value={f1Odds}
                        onChange={(e) => setF1Odds(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Fighter 2 Odds</Label>
                    <Input
                        placeholder="+200"
                        value={f2Odds}
                        onChange={(e) => setF2Odds(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Over/Under</Label>
                    <Input
                        placeholder="2.5"
                        value={overUnder}
                        onChange={(e) => setOverUnder(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Source</Label>
                    <Input
                        placeholder="DraftKings"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
                <Button
                    size="sm"
                    disabled={!hasChanges || isSaving}
                    onClick={() => onSave({
                        fighter1Odds: f1Odds || undefined,
                        fighter2Odds: f2Odds || undefined,
                        overUnder: overUnder || undefined,
                        source: source || undefined,
                    })}
                    className="h-7"
                >
                    <Save className="h-3 w-3 mr-1" />
                    Save Odds
                </Button>
            </div>
        </div>
    );
};

export default AdminOddsEditor;
