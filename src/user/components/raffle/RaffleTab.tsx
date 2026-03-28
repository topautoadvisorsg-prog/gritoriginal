import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import {
    Ticket, Trophy, Users, Gift, Loader2, Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface RaffleInfo {
    totalTickets: number;
    poolDescription: string;
    lastWinner: {
        id: string;
        totalTickets: number;
        poolDescription?: string;
        drawnAt: string;
        winner: {
            id: string;
            username: string;
            email: string;
        };
    } | null;
}

interface UserTickets {
    totalTickets: number;
    allocations: any[];
}

export const RaffleTab: React.FC = () => {
    const { user } = useAuth();

    const { data: raffleInfo, isLoading: loadingInfo } = useQuery<RaffleInfo>({
        queryKey: ['/api/raffle/current'],
    });

    const { data: userTickets, isLoading: loadingTickets } = useQuery<UserTickets>({
        queryKey: ['/api/raffle/my-tickets'],
        enabled: !!user,
    });

    if (loadingInfo) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                    <div className="relative p-4 bg-card border-2 border-primary/30 rounded-2xl">
                        <Gift className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-display tracking-wide text-foreground uppercase">
                    MMA Champions Raffle
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Win exclusive prizes! Tickets allocated by admin after subscription verification.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Pool */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            Total Tickets in Pool
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {raffleInfo?.totalTickets || 0}
                        </div>
                    </CardContent>
                </Card>

                {/* Your Tickets */}
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Your Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {user ? (loadingTickets ? '...' : (userTickets?.totalTickets || 0)) : '—'}
                        </div>
                        {!user && (
                            <p className="text-xs text-muted-foreground mt-1">Sign in to view</p>
                        )}
                    </CardContent>
                </Card>

                {/* Last Winner */}
                <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Last Winner
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {raffleInfo?.lastWinner ? (
                            <div>
                                <div className="flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                    <span className="text-lg font-bold text-foreground">
                                        {raffleInfo.lastWinner.winner?.username || 'Anonymous'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(raffleInfo.lastWinner.drawnAt).toLocaleDateString()}
                                    {' • '}
                                    {raffleInfo.lastWinner.totalTickets} tickets in pool
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No draws yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Ticket Allocations */}
            {user && userTickets && userTickets.allocations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary" />
                            Your Ticket History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {userTickets.allocations.map((allocation: any) => (
                                <div
                                    key={allocation.id}
                                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                                >
                                    <div>
                                        <span className="text-sm font-medium">+{allocation.quantity} ticket{allocation.quantity > 1 ? 's' : ''}</span>
                                        <span className="text-xs text-muted-foreground ml-2">via {allocation.source}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(allocation.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info */}
            <div className="text-center text-xs text-muted-foreground px-4 py-6 border-t border-border">
                <p>Raffle tickets are allocated by administrators after subscription verification.</p>
                <p className="mt-1">Winners are selected through weighted random draw.</p>
            </div>
        </div>
    );
};

export default RaffleTab;
