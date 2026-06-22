import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Calendar, Save, Loader2, Swords, Trash2, AlertTriangle,
    CheckCircle2, Radio, Archive, Clock, XCircle, Edit3
} from 'lucide-react';
import { useFighters } from '@/shared/hooks/useFighters';
import { ComboInput } from '@/shared/components/ui/combo-input';
import {
    EVENT_STATUSES,
    allowedEventStatusTransitions,
    type EventStatus,
} from '@shared/models/eventLifecycle';

const PRESET_CITIES = ['Las Vegas', 'Miami', 'Los Angeles', 'Houston', 'New York', 'Abu Dhabi', 'London', 'Singapore', 'Jacksonville', 'Dallas'];
const PRESET_STATES = ['Nevada', 'Florida', 'California', 'Texas', 'New York', 'Arizona', 'Georgia', 'New Jersey'];
const PRESET_COUNTRIES = ['USA', 'Mexico', 'UAE', 'UK', 'Singapore', 'Brazil', 'Canada', 'Australia', 'Saudi Arabia'];

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

interface EventData {
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
}

interface FightData {
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

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    Upcoming: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
    Live: { icon: Radio, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
    Completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
    Closed: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
    Archived: { icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted border-border' },
    Postponed: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
    Cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/20 border-destructive/30' },
    draft: { icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
    ready: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
};

export const AdminEventEditor: React.FC = () => {
    const queryClient = useQueryClient();
    const { fighterMap } = useFighters();
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [editMode, setEditMode] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '', date: '', venue: '', city: '', state: '', country: '',
        organization: '', description: '',
    });

    // Fetch all events
    const { data: events = [], isLoading: eventsLoading } = useQuery<EventData[]>({
        queryKey: ['/api/events'],
    });

    // Fetch event detail with fights
    const { data: eventDetail, isLoading: detailLoading } = useQuery<EventData & { fights: FightData[] }>({
        queryKey: [`/api/events/${selectedEventId}`],
        enabled: !!selectedEventId,
    });

    // When event loads, populate form
    React.useEffect(() => {
        if (eventDetail) {
            setFormData({
                name: eventDetail.name,
                date: eventDetail.date,
                venue: eventDetail.venue,
                city: eventDetail.city,
                state: eventDetail.state || '',
                country: eventDetail.country,
                organization: eventDetail.organization,
                description: eventDetail.description || '',
            });
        }
    }, [eventDetail]);

    // Update event details mutation
    const updateEventMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const res = await fetchWithAuth(`/api/admin/events/${selectedEventId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update event');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            queryClient.invalidateQueries({ queryKey: [`/api/events/${selectedEventId}`] });
            setEditMode(false);
        },
    });

    // Update event status mutation
    const statusMutation = useMutation({
        mutationFn: async (status: EventStatus) => {
            const res = await fetchWithAuth(`/api/admin/events/${selectedEventId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update status');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            queryClient.invalidateQueries({ queryKey: [`/api/events/${selectedEventId}`] });
        },
    });

    // Cancel fight mutation
    const cancelFightMutation = useMutation({
        mutationFn: async (fightId: string) => {
            const res = await fetchWithAuth(`/api/admin/events/${selectedEventId}/fights/${fightId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Cancelled' }),
            });
            if (!res.ok) throw new Error('Failed to cancel fight');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/events/${selectedEventId}`] });
        },
    });

    // Remove fight mutation
    const removeFightMutation = useMutation({
        mutationFn: async (fightId: string) => {
            const res = await fetchWithAuth(`/api/admin/events/${selectedEventId}/fights/${fightId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove fight');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/events/${selectedEventId}`] });
        },
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth(`/api/admin/events/${selectedEventId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete event');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            setSelectedEventId('');
            setConfirmDelete(false);
        },
    });

    const getFighterName = (id: string) => {
        const f = fighterMap.get(id);
        return f ? `${f.firstName} ${f.lastName}` : id.slice(0, 8);
    };

    const allowedStatuses = eventDetail
        ? allowedEventStatusTransitions(eventDetail.status)
        : [];

    const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Event Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Event Lifecycle Manager
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {eventsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : (
                        <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setEditMode(false); setConfirmDelete(false); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an event to manage..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedEvents.map((event) => (
                                    <SelectItem key={event.id} value={event.id}>
                                        <span className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_CONFIG[event.status]?.bg || 'bg-gray-500/20'}`} />
                                            {event.name} — {event.status}
                                        </span>
                                    </SelectItem>
                                ))}
                                {sortedEvents.length === 0 && (
                                    <SelectItem value="none" disabled>No events created yet</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* Event Detail */}
            {selectedEventId && detailLoading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}

            {eventDetail && (
                <>
                    {/* Status Flow */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                                Event Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 flex-wrap">
                                {EVENT_STATUSES.map((status) => {
                                    const config = STATUS_CONFIG[status];
                                    const Icon = config.icon;
                                    const isCurrent = eventDetail.status === status;
                                    const isAllowed = allowedStatuses.includes(status);

                                    return (
                                        <React.Fragment key={status}>
                                            <Button
                                                variant={isCurrent ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={!isAllowed || statusMutation.isPending}
                                                onClick={() => statusMutation.mutate(status)}
                                                className={`gap-1.5 ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {status}
                                                {statusMutation.isPending && isAllowed && (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                )}
                                            </Button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {eventDetail.status === 'draft' && (
                                <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Legacy draft detected. Move it to Upcoming before continuing.
                                </p>
                            )}

                            {eventDetail.status === 'ready' && (
                                <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Legacy ready status requires reviewed database classification; lifecycle actions are disabled.
                                </p>
                            )}

                            {statusMutation.error && (
                                <p className="text-xs text-destructive mt-3">
                                    {statusMutation.error.message}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Event Details (View / Edit) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Edit3 className="h-5 w-5 text-primary" />
                                Event Details
                            </CardTitle>
                            <Button
                                variant={editMode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setEditMode(!editMode)}
                            >
                                {editMode ? 'Cancel' : 'Edit'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {editMode ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Event Name</Label>
                                            <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Date</Label>
                                            <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Venue</Label>
                                            <Input value={formData.venue} onChange={e => setFormData(p => ({ ...p, venue: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Organization</Label>
                                            <Input value={formData.organization} onChange={e => setFormData(p => ({ ...p, organization: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">City</Label>
                                            <ComboInput value={formData.city} onChange={v => setFormData(p => ({ ...p, city: v }))} options={PRESET_CITIES} placeholder="Las Vegas" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">State</Label>
                                            <ComboInput value={formData.state} onChange={v => setFormData(p => ({ ...p, state: v }))} options={PRESET_STATES} placeholder="Nevada" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Country</Label>
                                            <ComboInput value={formData.country} onChange={v => setFormData(p => ({ ...p, country: v }))} options={PRESET_COUNTRIES} placeholder="USA" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Description</Label>
                                        <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            disabled={updateEventMutation.isPending}
                                            onClick={() => updateEventMutation.mutate(formData)}
                                        >
                                            <Save className="h-3 w-3 mr-1" />
                                            {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-muted-foreground text-xs block">Date</span>{eventDetail.date}</div>
                                    <div><span className="text-muted-foreground text-xs block">Venue</span>{eventDetail.venue}</div>
                                    <div><span className="text-muted-foreground text-xs block">Location</span>{eventDetail.city}{eventDetail.state ? `, ${eventDetail.state}` : ''}, {eventDetail.country}</div>
                                    <div><span className="text-muted-foreground text-xs block">Organization</span>{eventDetail.organization}</div>
                                    {eventDetail.description && (
                                        <div className="col-span-full"><span className="text-muted-foreground text-xs block">Description</span>{eventDetail.description}</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fight Card Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Swords className="h-5 w-5 text-primary" />
                                Fight Card ({eventDetail.fights?.length || 0} fights)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!eventDetail.fights || eventDetail.fights.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No fights on this card</p>
                            ) : (
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {[...eventDetail.fights]
                                            .sort((a, b) => a.boutOrder - b.boutOrder)
                                            .map(fight => (
                                                <FightRow
                                                    key={fight.id}
                                                    fight={fight}
                                                    fighter1Name={getFighterName(fight.fighter1Id)}
                                                    fighter2Name={getFighterName(fight.fighter2Id)}
                                                    onCancel={() => cancelFightMutation.mutate(fight.id)}
                                                    onRemove={() => removeFightMutation.mutate(fight.id)}
                                                    isUpdating={cancelFightMutation.isPending || removeFightMutation.isPending}
                                                    eventStatus={eventDetail.status}
                                                />
                                            ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {confirmDelete ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-destructive">
                                        This will permanently delete "{eventDetail.name}" and all its fights. This cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={deleteEventMutation.isPending}
                                            onClick={() => deleteEventMutation.mutate()}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            {deleteEventMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="text-destructive border-destructive/30">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete Event
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

// Fight row sub-component
interface FightRowProps {
    fight: FightData;
    fighter1Name: string;
    fighter2Name: string;
    onCancel: () => void;
    onRemove: () => void;
    isUpdating: boolean;
    eventStatus: string;
}

const FightRow: React.FC<FightRowProps> = ({ fight, fighter1Name, fighter2Name, onCancel, onRemove, isUpdating, eventStatus }) => {
    const isCancelled = fight.status === 'Cancelled';
    const canModify = eventStatus === 'Upcoming';
    const statusConfig = STATUS_CONFIG[fight.status] || STATUS_CONFIG['Upcoming'];

    return (
        <div className={`p-4 rounded-lg border border-border space-y-2 ${isCancelled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <Swords className="h-4 w-4 text-primary" />
                    <span className={`font-semibold ${isCancelled ? 'line-through' : ''}`}>
                        {fighter1Name}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={`font-semibold ${isCancelled ? 'line-through' : ''}`}>
                        {fighter2Name}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${statusConfig.bg}`}>
                        {fight.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {fight.cardPlacement}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{fight.weightClass} • {fight.rounds} rounds{fight.isTitleFight ? ' • 🏆 Title Fight' : ''}</span>

                {canModify && !isCancelled && (
                    <div className="flex gap-1.5">
                        <Button
                            variant="outline" size="sm"
                            className="h-6 text-xs text-amber-400 border-amber-500/30"
                            disabled={isUpdating}
                            onClick={onCancel}
                        >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel Fight
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="h-6 text-xs text-destructive border-destructive/30"
                            disabled={isUpdating}
                            onClick={onRemove}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminEventEditor;
