import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
    Target, TrendingUp, Flame, Trophy, BarChart3,
    Loader2, CheckCircle2, XCircle, Clock, ArrowUp, ArrowDown
} from 'lucide-react';

interface UserStats {
    totalPicks: number;
    wins: number;
    losses: number;
    pending: number;
    accuracy: number;
    totalUnits: number;
    totalProfit: number;
    roi: number;
    currentStreak: number;
    bestStreak: number;
    picks: {
        id: string;
        fightId: string;
        pickedFighterId: string;
        pickedMethod: string;
        pickedRound: number | null;
        pointsAwarded: number;
        status: 'win' | 'loss' | 'pending';
        profit: number;
        eventName: string;
        eventDate: string;
        createdAt: string;
    }[];
    perEventStats: {
        eventId: string;
        eventName: string;
        eventDate: string;
        picks: number;
        wins: number;
        profit: number;
    }[];
}

export function MyStatsTab() {
    const { data: stats, isLoading, error } = useQuery<UserStats>({
        queryKey: ['/api/me/stats'],
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (error || !stats) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Unable to load stats. Make some picks to get started!
                </CardContent>
            </Card>
        );
    }

    if (stats.totalPicks === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        My Stats
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No picks yet. Head to an event and make your first pick!</p>
                </CardContent>
            </Card>
        );
    }

    const profitColor = stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400';
    const roiColor = stats.roi >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={Target}
                    label="Total Picks"
                    value={String(stats.totalPicks)}
                    sub={`${stats.pending} pending`}
                    iconColor="text-cyan-400"
                />
                <StatCard
                    icon={Trophy}
                    label="Win Rate"
                    value={`${stats.accuracy}%`}
                    sub={`${stats.wins}W / ${stats.losses}L`}
                    iconColor="text-yellow-400"
                />
                <StatCard
                    icon={TrendingUp}
                    label="ROI"
                    value={`${stats.roi >= 0 ? '+' : ''}${stats.roi}%`}
                    sub={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}u`}
                    iconColor={roiColor}
                    valueColor={roiColor}
                />
                <StatCard
                    icon={Flame}
                    label="Streak"
                    value={`🔥 ${stats.currentStreak}`}
                    sub={`Best: ${stats.bestStreak}`}
                    iconColor="text-orange-400"
                />
            </div>

            {/* Per-Event Breakdown */}
            {stats.perEventStats.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                            Event Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.perEventStats.map(event => {
                                const eventProfit = event.profit;
                                return (
                                    <div key={event.eventId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div>
                                            <p className="text-sm font-medium">{event.eventName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.wins}/{event.picks} correct
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${eventProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {eventProfit >= 0 ? '+' : ''}{eventProfit.toFixed(2)}u
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pick History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                        Recent Picks
                    </CardTitle>
                    <CardDescription>Last {stats.picks.length} picks</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {stats.picks.map(pick => (
                                <div key={pick.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                                    <div className="flex items-center gap-2">
                                        {pick.status === 'win' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                        {pick.status === 'loss' && <XCircle className="w-4 h-4 text-red-400" />}
                                        {pick.status === 'pending' && <Clock className="w-4 h-4 text-amber-400" />}
                                        <div>
                                            <p className="text-sm font-medium">{pick.eventName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {pick.pickedMethod}{pick.pickedRound ? ` R${pick.pickedRound}` : ''}
                                                {' • '}{pick.pointsAwarded}pts
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {pick.status !== 'pending' && (
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${pick.profit >= 0 ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}
                                            >
                                                {pick.profit >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                                {pick.profit >= 0 ? '+' : ''}{pick.profit.toFixed(2)}u
                                            </Badge>
                                        )}
                                        {pick.status === 'pending' && (
                                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                                                Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

// Stat summary card sub-component
function StatCard({ icon: Icon, label, value, sub, iconColor, valueColor }: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub: string;
    iconColor: string;
    valueColor?: string;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${valueColor || ''}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
        </Card>
    );
}

export default MyStatsTab;
