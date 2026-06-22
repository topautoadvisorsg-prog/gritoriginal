import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Loader2, Ticket, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface EventSummary {
    id: string;
    name: string;
    date: string;
    status: string;
}

interface PoolEntry {
    id: string;
    userId: string;
    contributionAmount: number;
    createdAt: string;
}

interface EventPool {
    eventId: string;
    totalEntries: number;
    totalAmount: string;
    entries: PoolEntry[];
}

interface DrawResult {
    id: string;
    winnerId: string;
    poolTotal: string;
    totalTickets: number;
    notified: boolean;
    drawnAt: string;
}

async function adminFetch<T>(url: string): Promise<T> {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

export const AdminRaffleManager = () => {
    const [eventId, setEventId] = useState('');
    const { data: events = [], isLoading: eventsLoading } = useQuery<EventSummary[]>({
        queryKey: ['/api/events'],
    });
    const { data: pool, isLoading: poolLoading, error: poolError } = useQuery<EventPool>({
        queryKey: ['/api/admin/raffle/pool', eventId],
        queryFn: () => adminFetch(`/api/admin/raffle/pool/${eventId}`),
        enabled: !!eventId,
    });
    const { data: draw, isLoading: drawLoading } = useQuery<DrawResult | null>({
        queryKey: ['/api/admin/raffle/draw', eventId],
        queryFn: async () => {
            const response = await fetch(`/api/admin/raffle/draw/${eventId}`, { credentials: 'include' });
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`Request failed (${response.status})`);
            return response.json();
        },
        enabled: !!eventId,
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                    <div>
                        <h2 className="font-bold text-amber-200">Reward operations are read-only</h2>
                        <p className="mt-1 text-sm text-amber-100/70">
                            Draw execution and payouts remain disabled until funding, reconciliation, official rules, and legal approval are complete.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Event Pool Audit</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={eventId} onValueChange={setEventId} disabled={eventsLoading}>
                        <SelectTrigger><SelectValue placeholder={eventsLoading ? 'Loading events...' : 'Select an event'} /></SelectTrigger>
                        <SelectContent>
                            {events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.name} - {event.status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {eventId && (poolLoading || drawLoading) && (
                <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            )}

            {eventId && !poolLoading && !drawLoading && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <Users className="mb-2 h-5 w-5 text-primary" />
                            <p className="text-2xl font-black">{pool?.totalEntries ?? 0}</p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Eligible entries</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Ticket className="mb-2 h-5 w-5 text-primary" />
                            <p className="text-2xl font-black">${pool?.totalAmount ?? '0.00'}</p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recorded pool</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm font-bold">{draw ? `Winner: ${draw.winnerId}` : 'No draw recorded'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {draw ? new Date(draw.drawnAt).toLocaleString() : 'No draw action is available from this screen.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {poolError && <p className="text-sm text-destructive">Unable to load the selected event pool.</p>}
        </div>
    );
};

export default AdminRaffleManager;
