import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RankingRow, RankingUser } from './RankingRow';
import { Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { ErrorState } from '@/shared/components/ui/error-state';
import { useAuth } from '@/shared/hooks/use-auth';
import { RankTier } from './RankBadge';
import { cn } from '@/shared/lib/utils';

// Rank-based tier badge. Rank is real data; the badge is a purely positional
// gamification visual (no fabricated win/loss counts feed into it).
const determineTier = (rank: number): RankTier => {
    if (rank === 1) return 'ULTIMATE GOLD';
    if (rank <= 5) return 'GRANDMASTER';
    if (rank <= 15) return 'MASTER';
    if (rank <= 50) return 'SAMURAI';
    return 'NINJA';
};

// Snapshot ranking entry shape (from leaderboardService) — monthly/yearly tabs
interface SnapshotRankingEntry {
    rank: number;
    userId: string;
    username: string;
    netUnits: number;
    currentStreak?: number;
}

// Global leaderboard entry shape (totalPoints-based) — Global All-Time tab
interface GlobalLeaderboardEntry {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    rank: number;
    totalPoints: number;
    country?: string;
    hasGoldBadge?: boolean;
}

/**
 * Maps snapshot ranking entries (netUnits-based) to RankingUser shape.
 * Used for monthly and yearly tabs. Only real fields — no derived stats.
 */
const mapSnapshotRankings = (entries: SnapshotRankingEntry[]): RankingUser[] => {
    if (!entries || entries.length === 0) return [];

    return entries.map((entry) => ({
        id: entry.userId,
        username: entry.username || 'Anonymous',
        rank: entry.rank,
        tier: determineTier(entry.rank),
        score: entry.netUnits,
        scoreLabel: 'Net Units',
        scoreIsUnits: true,
        currentStreak: entry.currentStreak || 0,
    }));
};

/**
 * Maps global leaderboard entries (totalPoints-based) to RankingUser shape.
 * Used for the Global All-Time tab. Only real fields — no derived stats.
 */
const mapGlobalRankings = (entries: GlobalLeaderboardEntry[]): RankingUser[] => {
    if (!entries || entries.length === 0) return [];

    return entries.map((entry) => ({
        id: entry.id,
        username: entry.displayName || entry.username || 'Anonymous',
        avatarUrl: entry.avatarUrl || undefined,
        rank: entry.rank,
        tier: determineTier(entry.rank),
        // totalPoints is legacy storage for net-unit hundredths.
        score: entry.totalPoints / 100,
        scoreLabel: 'Net Units',
        scoreIsUnits: true,
        country: entry.country,
    }));
};

export type LeaderboardType = 'global' | 'monthly' | 'yearly';

export const MMAMetricsRankings: React.FC = () => {
    const { user: authUser } = useAuth();
    const [leaderboardType, setLeaderboardType] = React.useState<LeaderboardType>('global');

    // Fetch Leaderboard
    const { data: rawData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['/api/leaderboard', leaderboardType],
        queryFn: async () => {
            const endpoint = leaderboardType === 'global' 
                ? `/api/leaderboard` 
                : `/api/leaderboard/latest/${leaderboardType}`;
            const res = await fetch(endpoint, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        },
    });

    // Global tab uses totalPoints shape; monthly/yearly tabs use snapshot netUnits shape
    const rankings = leaderboardType === 'global'
        ? mapGlobalRankings(rawData?.leaderboard || [])
        : mapSnapshotRankings(rawData?.rankings || []);
    const currentUserRanking = rankings.find((entry) => entry.id === authUser?.id);
    const leaderboardRankings = rankings.filter((entry) => entry.id !== authUser?.id);

    const tabs: { id: LeaderboardType; label: string }[] = [
        { id: 'global', label: 'Global All-Time' },
        { id: 'monthly', label: 'Monthly Champions' },
        { id: 'yearly', label: 'Yearly Legends' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-[#E8A020]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-32 px-8">
                <ErrorState
                    title="Couldn't load rankings"
                    description="We couldn't reach the leaderboard. Check your connection and try again."
                    onRetry={() => refetch()}
                    isRetrying={isFetching}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-[#080808] text-white p-8">
            {/* Header */}
            <div className="text-center mb-12 flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#E8A020] mb-2 display-font italic" style={{ textShadow: '0 0 30px rgba(232, 160, 32, 0.4)' }}>
                    GLOBAL RANKINGS
                </h1>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/40 font-black">
                    COMPETE FOR GLORY. TRACK YOUR PERFORMANCE.
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex justify-center mb-12">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setLeaderboardType(tab.id)}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-xs uppercase font-black tracking-widest transition-all duration-200 border",
                                leaderboardType === tab.id
                                    ? "bg-[#E8A020]/20 border-[#E8A020] text-[#E8A020] shadow-[0_0_15px_rgba(232,160,32,0.3)]"
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div className="max-w-7xl mx-auto w-full flex flex-col">
                
                {/* Responsive Wrapper for Horizontal Scroll on Mobile */}
                <div className="overflow-x-auto">
                    <div className="min-w-[560px]">

                        {/* Table Header Row */}
                        <div className="flex items-center gap-6 px-10 py-5 border-b border-white/5 text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-6">
                            <div className="w-12 text-center">RANK</div>
                            <div className="flex-1 min-w-[250px]">USER</div>
                            <div className="w-[120px] text-center">TIER</div>
                            <div className="w-[140px] text-center">
                                NET UNITS
                            </div>
                        </div>

                        {currentUserRanking && (
                            <section className="mb-8" aria-label="Your leaderboard position">
                                <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#E8A020]">
                                    Your Position
                                </p>
                                <RankingRow user={currentUserRanking} isSelf disableAnimation />
                            </section>
                        )}

                        {/* Rows */}
                        <div className="flex flex-col space-y-3">
                    {/* Rankings stay in canonical rank order; the current user is highlighted in place. */}
                    <AnimatePresence mode="popLayout">
                        {leaderboardRankings.map((user, index) => (
                            <motion.div
                                key={user.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ 
                                    type: 'spring', 
                                    stiffness: 400, 
                                    damping: 40,
                                    opacity: { duration: 0.2 },
                                    layout: { duration: 0.4 }
                                }}
                            >
                                <RankingRow
                                    user={user}
                                    animationIndex={index}
                                    isSelf={user.id === authUser?.id}
                                    currentStreak={user.currentStreak}
                                    disableAnimation={true} // We use motion.div for animation now
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {rankings.length === 0 && (
                        <EmptyState
                            icon={Trophy}
                            variant="card"
                            title="No rankings yet"
                            description="Be the first to lock picks this period — the leaderboard fills as fights resolve."
                        />
                    )}
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
