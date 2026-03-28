import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, TrendingUp, TrendingDown, Loader2, DollarSign, Activity } from 'lucide-react';

export const BettingTrackerWidget: React.FC<{ stats?: any }> = ({ stats: propStats }) => {
    const { data: queryStats, isLoading: queryLoading } = useQuery<any>({
        queryKey: ['/api/me/stats'],
        enabled: !propStats,
    });

    const stats = propStats || queryStats;
    const isLoading = !propStats && queryLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 bg-[#111] border border-white/10 rounded-3xl">
                <Loader2 className="h-6 w-6 animate-spin text-[#E8A020]" />
            </div>
        );
    }

    if (!stats?.bettingTracker?.enabled) {
        return null;
    }

    const tracker = stats.bettingTracker;
    const unitSize = tracker.unitSize;
    if (unitSize <= 0) return null; // No active betting if unit is 0

    // Get latest active event stats
    const latestEvent = stats.perEventStats && stats.perEventStats.length > 0 
        ? stats.perEventStats[0] 
        : null;

    const latestEventWagered = latestEvent ? latestEvent.picks * unitSize : 0;
    const latestEventProfit = latestEvent ? latestEvent.profit * unitSize : 0;

    const formatMoney = (val: number) => {
        const isNegative = val < 0;
        const absVal = Math.abs(val).toFixed(2);
        return `${isNegative ? '-' : ''}$${absVal}`;
    };

    const profitColor = tracker.totalProfit >= 0 ? 'text-green-500' : 'text-red-500';
    const latestProfitColor = latestEventProfit >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex flex-col bg-[#111]/80 backdrop-blur-md border border-green-500/20 rounded-3xl p-6 hover-glow animate-fade-in relative overflow-hidden group">
            {/* Subtle backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent z-0 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <LineChart className="w-5 h-5 text-green-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-green-500">Real Betting Tracker</h3>
                    </div>
                    <div className="px-2 py-1 bg-green-500/10 rounded border border-green-500/20 text-[9px] font-black tracking-widest text-green-400">
                        1 UNIT = ${unitSize}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Latest Event Wagered</span>
                        <span className="block text-2xl font-black text-white">{formatMoney(latestEventWagered)}</span>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Latest Event P/L</span>
                        <span className={`block text-2xl font-black ${latestProfitColor}`}>
                            {latestEventProfit > 0 ? '+' : ''}{formatMoney(latestEventProfit)}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-white/60" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">All-Time Profit / Loss</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Running Balance</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`block text-xl font-black ${profitColor}`}>
                                {tracker.totalProfit > 0 ? '+' : ''}{formatMoney(tracker.totalProfit)}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${tracker.roi >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                {tracker.roi >= 0 ? '+' : ''}{tracker.roi.toFixed(1)}% ROI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex justify-between w-full">
                            <div>
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-white/40">Best Event</span>
                                <span className="text-sm font-bold text-green-500">+{formatMoney(tracker.bestEventProfit)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-white/40">Worst Event</span>
                                <span className="text-sm font-bold text-red-500">{formatMoney(tracker.worstEventProfit)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute right-0 bottom-0 text-[8px] uppercase tracking-widest text-white/20 p-3">Private Widget</div>
        </div>
    );
};
