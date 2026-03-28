import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
    Gift, Search, Loader2, User, Ticket, Send
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

interface UserResult {
    id: string;
    username: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    tier: string;
}

interface RafflePool {
    totalTickets: number;
    uniqueParticipants: number;
    lastDraw: { id: string; winnerId: string; drawnAt: string } | null;
}

export const AdminRaffleManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [ticketQty, setTicketQty] = useState(1);
    const [ticketSource, setTicketSource] = useState('admin');

    // Raffle pool info
    const { data: pool } = useQuery<RafflePool>({
        queryKey: ['/api/raffle/pool'],
    });

    // Search users
    const { data: users = [], isLoading } = useQuery<UserResult[]>({
        queryKey: ['/api/admin/users/search', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const res = await fetchWithAuth(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: searchQuery.length > 1,
    });

    // Allocate tickets
    const allocateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth('/api/admin/raffle/allocate', {
                method: 'POST',
                body: JSON.stringify({ userId: selectedUser!.id, quantity: ticketQty, source: ticketSource }),
            });
            if (!res.ok) throw new Error('Failed to allocate tickets');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/raffle'] });
            setTicketQty(1);
        },
    });

    // Execute draw
    const drawMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth('/api/admin/raffle/draw', { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to execute draw');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/raffle'] });
        },
    });

    const displayName = (u: UserResult) =>
        u.username || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || 'Unknown';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Pool Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Ticket className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{pool?.totalTickets ?? '–'}</p>
                        <p className="text-xs text-muted-foreground">Total Tickets</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <User className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{pool?.uniqueParticipants ?? '–'}</p>
                        <p className="text-xs text-muted-foreground">Participants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Gift className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">
                            {pool?.lastDraw ? new Date(pool.lastDraw.drawnAt).toLocaleDateString() : 'No draws yet'}
                        </p>
                        <p className="text-xs text-muted-foreground">Last Draw</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Allocate Tickets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            Allocate Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* User search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search user..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {selectedUser ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                                    <span className="font-semibold text-sm">{displayName(selectedUser)}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={ticketQty}
                                        onChange={(e) => setTicketQty(Number(e.target.value))}
                                        className="w-24"
                                    />
                                    <Select value={ticketSource} onValueChange={setTicketSource}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin Grant</SelectItem>
                                            <SelectItem value="event">Event Reward</SelectItem>
                                            <SelectItem value="promotion">Promotion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        disabled={allocateMutation.isPending}
                                        onClick={() => allocateMutation.mutate()}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                {allocateMutation.isSuccess && (
                                    <p className="text-xs text-green-500">Tickets allocated successfully!</p>
                                )}
                            </div>
                        ) : (
                            <ScrollArea className="h-[200px]">
                                {isLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {users.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => setSelectedUser(u)}
                                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left text-sm transition-colors"
                                            >
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{displayName(u)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Draw */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" />
                            Execute Draw
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Execute a weighted random draw from the current ticket pool. Users with more tickets have higher chances.
                        </p>
                        <Button
                            className="w-full"
                            disabled={drawMutation.isPending || (pool?.totalTickets ?? 0) === 0}
                            onClick={() => drawMutation.mutate()}
                        >
                            {drawMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Gift className="h-4 w-4 mr-2" />
                            )}
                            Draw Winner
                        </Button>
                        {drawMutation.isSuccess && drawMutation.data && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                                <p className="text-sm font-medium text-green-600">🎉 Winner drawn!</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Winner ID: {(drawMutation.data as any).winnerId}
                                </p>
                            </div>
                        )}
                        {drawMutation.isError && (
                            <p className="text-xs text-destructive">{(drawMutation.error as Error).message}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminRaffleManager;
