import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import { RankBadge, RankTier } from '@/user/components/rankings/RankBadge';
import { cn } from '@/shared/lib/utils';
import { Trophy, Target, TrendingUp, CalendarDays, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BettingTrackerWidget } from './BettingTrackerWidget';
import { EventCountdown } from './EventCountdown';
import { FriendsActivityFeed } from './FriendsActivityFeed';
import { DashboardSkeleton } from './DashboardSkeleton';

// Simple animated counter component
const AnimatedCounter = ({ value, label, suffix = '' }: { value: number, label: string, suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const incrementTime = 30;
        const steps = duration / incrementTime;
        const increment = value / steps;

        if (value === 0) return;

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-[#111] border border-white/5 rounded-2xl hover-glow">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</span>
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black text-white">{count}</span>
                {suffix && <span className="text-lg font-bold text-[#E8A020]">{suffix}</span>}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { data: dashboard, isLoading } = useQuery<any>({
        queryKey: ['/api/me/dashboard'],
    });
    // Real career stats (win %, total picks) — sourced from the same endpoint
    // that powers Settings > My Stats. Surfaced here as the headline metric.
    const { data: stats } = useQuery<any>({
        queryKey: ['/api/me/stats'],
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!dashboard) return null;

    const displayName = user?.username || user?.firstName || 'Fighter';
    const tier = dashboard.progression.badge.toUpperCase() as RankTier;
    const starLevel = dashboard.progression.starLevel;
    const rankProgress = (starLevel / 5) * 100;

    const upcoming = dashboard.upcomingEvent;
    const leaderboard = dashboard.leaderboardContext;
    const recent = dashboard.recentActivity;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as any }
        }
    };

    return (
        <motion.div 
            className="flex flex-col w-full max-w-5xl mx-auto space-y-8 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            
            {/* HERO SECTION */}
            <motion.div 
                className="flex flex-col md:flex-row items-center gap-8 bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
                variants={itemVariants}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E8A020]/5 to-transparent z-0 pointer-events-none" />
                
                <div className="relative z-10 flex-shrink-0">
                    <RankBadge tier={tier} size="lg" />
                </div>
                
                <div className="relative z-10 flex-1 text-center md:text-left min-w-0">
                    <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mb-3 drop-shadow-sm">Welcome Back, Fighter</h2>
                    <h1 className="text-5xl md:text-7xl font-black text-white truncate break-words mb-4 display-font italic tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                        {displayName}
                    </h1>
                    
                    {/* Rank Progress Bar */}
                    <div className="max-w-md w-full">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-[#E8A020]">{tier}</span>
                            <span className="text-white/40">{starLevel}/5 Stars</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <div 
                                className="h-full bg-gradient-to-r from-[#E8A020] to-[#F5C842] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(232,160,32,0.5)]"
                                style={{ width: `${rankProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
                
                {leaderboard && (
                    <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#E8A020] mb-1">Current Rank</span>
                        <span className="text-4xl font-black text-white">#{leaderboard.rank}</span>
                        <span className="text-[10px] font-bold text-white/40 mt-1">{leaderboard.netUnits > 0 ? '+' : ''}{leaderboard.netUnits} Units</span>
                    </div>
                )}
            </motion.div>

            {/* QUICK STATS ROW */}
            <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                variants={itemVariants}
            >
                <AnimatedCounter label="Keys" value={dashboard.progression.keys} suffix="◈" />
                <AnimatedCounter value={dashboard.currentStreak} label={dashboard.currentStreak >= 2 ? "W Streak 🔥" : "Streak"} />
                <div className="flex flex-col items-center justify-center p-4 bg-[#111] border border-white/5 rounded-2xl hover-glow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Raffle Status</span>
                    <span className={cn("text-xs font-black uppercase text-center", dashboard.raffleStatus.eligible ? "text-green-500" : "text-white/60")}>
                        {dashboard.raffleStatus.message}
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#111] border border-white/5 rounded-2xl hover-glow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Win %</span>
                    {stats && stats.totalPicks > 0 ? (
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl font-black text-white">{stats.accuracy}</span>
                            <span className="text-lg font-bold text-[#E8A020]">%</span>
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-white/40 text-center mt-2">No picks yet</span>
                    )}
                </div>
            </motion.div>

            {/* OPTIONAL BETTING TRACKER */}
            {dashboard.bettingStats && (
                <motion.div variants={itemVariants}>
                    <BettingTrackerWidget stats={dashboard.bettingStats} />
                </motion.div>
            )}

            <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={itemVariants}>
                
                {/* YOUR NEXT EVENT */}
                <div className="lg:col-span-2 flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover-glow relative group min-h-[300px]">
                    {upcoming ? (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
                            <div className="relative z-20 flex flex-col h-full justify-between p-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        {upcoming.status === 'OPEN' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="live-indicator" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-500 animate-pulse">Live Drafting</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-3 h-3 text-yellow-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Upcoming</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter display-font italic">
                                        {upcoming.name}
                                    </h3>
                                    <p className="text-[#E8A020] font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                                        {new Date(upcoming.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8">
                                    <div className="flex flex-col gap-3 w-full">
                                        {/* Qualification Progress */}
                                        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Qualification</span>
                                                <span className="text-[9px] font-black text-win">
                                                    {upcoming.picksMade}/{upcoming.picksRequired}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-700 ease-out",
                                                        upcoming.picksMade >= upcoming.picksRequired 
                                                            ? "bg-win shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                                            : "bg-[#E8A020]"
                                                    )}
                                                    style={{ width: `${Math.min((upcoming.picksMade / upcoming.picksRequired) * 100, 100)}%` }}
                                                />
                                            </div>
                                            {upcoming.picksMade < upcoming.picksRequired && (
                                                <p className="text-[8px] text-[#E8A020] mt-1.5 font-bold uppercase tracking-tight">
                                                    Need {upcoming.picksRequired - upcoming.picksMade} more to qualify
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        to={`/event/${upcoming.id}`}
                                        className="gold-btn button-press-scale w-full sm:w-auto text-center py-3.5 px-8 text-xs relative overflow-hidden group/btn"
                                    >
                                        <span className="relative z-10 flex items-center gap-2 justify-center">
                                            {upcoming.picksMade >= upcoming.picksRequired ? 'UPDATE PICKS' : 'ENTER DRAFT'}
                                            <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="relative z-10 flex flex-col h-full justify-center items-center p-8 text-center bg-gradient-to-b from-white/[0.02] to-transparent">
                            <CalendarDays className="w-12 h-12 text-[#E8A020]/20 mb-4" />
                            <h3 className="text-xl font-black text-white/60 uppercase display-font italic tracking-tight mb-2">No active cards found</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-6 max-w-[200px] leading-relaxed">The arena is quiet, but the next main event is brewing.</p>
                            <Link to="/event" className="gold-btn button-press-scale py-3 px-8 text-[10px] transition-all hover:bg-[#E8A020]/10">
                                EXPLORE EVENTS
                            </Link>
                        </div>
                    )}
                </div>

                {/* RECENT PERFORMANCE */}
                <div className="flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover-glow relative group">
                    {recent?.isNearPerfect ? (
                        <div className="bg-green-500/20 w-full py-2.5 px-4 text-center border-b border-green-500/30">
                            <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-green-400">
                                Almost Perfect Card • You hit {recent.correctPicks}/{recent.totalFights} Fights
                            </span>
                        </div>
                    ) : recent?.isNearTop ? (
                        <div className="bg-yellow-500/20 w-full py-2.5 px-4 text-center border-b border-yellow-500/30">
                            <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-[#E8A020]">
                                {recent.finalRank <= 8 
                                    ? `Close to Top 3 • Final Position: #${recent.finalRank}` 
                                    : `Top 10% Finish • Close to Top Tier`}
                            </span>
                        </div>
                    ) : null}

                    <div className="p-6 flex flex-col items-center flex-1">
                        <div className="flex items-center w-full justify-start gap-2 mb-6">
                            <Target className="w-5 h-5 text-white/40" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Recent Activity</h3>
                        </div>
                    
                    {recent ? (
                        <div className="flex-1 flex flex-col justify-center items-center py-4">
                            <div className="text-center mb-6">
                                <span className={cn("block text-4xl font-black mb-1", recent.netUnits >= 0 ? "text-green-500" : "text-red-500")}>
                                    {recent.netUnits >= 0 ? '+' : ''}{recent.netUnits}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Net Units ({recent.eventName})</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-xs font-bold text-white">{recent.picks} Picks Scored</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center py-4 text-center bg-white/[0.01] rounded-2xl w-full">
                            <Trophy className="w-10 h-10 mb-4 text-white/5" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">No results yet</h4>
                            <Link to="/competition" className="text-[9px] font-black uppercase tracking-widest text-[#E8A020] hover:underline transition-all">
                                VIEW WORLD RANKINGS
                            </Link>
                        </div>
                    )}

                    <div className="px-6 pb-6 w-full mt-auto">
                        <Link to="/competition" className="block w-full py-3 rounded-xl border border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-white/50 hover:bg-white/5 hover:text-white transition-colors button-press-scale">
                            View Full History
                        </Link>
                    </div>
                </div>     </div>
            </motion.div>

            {/* FRIENDS ACTIVITY FEED */}
            <motion.div 
                className="flex flex-col space-y-4"
                variants={itemVariants}
            >
                <FriendsActivityFeed />
            </motion.div>

            {/* INTELLIGENCE FEED TEASER */}
            <motion.div 
                className="flex flex-col space-y-4"
                variants={itemVariants}
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#E8A020]" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Intelligence Feed</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboard.intelligence.map((item: any) => (
                        <Link key={item.id} to={`/news/${item.id}`} className="p-4 bg-[#111] border border-white/5 rounded-2xl hover:border-[#E8A020]/30 transition-all group">
                            <h4 className="text-sm font-black text-white group-hover:text-[#E8A020] transition-colors line-clamp-2 uppercase leading-tight mb-2">
                                {item.title}
                            </h4>
                            <p className="text-[10px] text-white/40 line-clamp-2">{item.excerpt}</p>
                        </Link>
                    ))}
                </div>
            </motion.div>

        </motion.div>
    );
};
