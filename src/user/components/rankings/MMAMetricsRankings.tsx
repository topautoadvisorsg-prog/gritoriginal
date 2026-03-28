import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RankingRow, RankingUser } from './RankingRow';
import { Loader2, Trophy, Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/shared/hooks/use-auth';
import { RankTier } from './RankBadge';
import { cn } from '@/shared/lib/utils';

// Helper to determine tier from total wins (example gamification logic)
const determineTier = (rank: number, wins: number): RankTier => {
    if (rank === 1) return 'ULTIMATE GOLD';
    if (rank <= 5) return 'GRANDMASTER';
    if (wins >= 50) return 'MASTER';
    if (wins >= 20) return 'SAMURAI';
    return 'NINJA';
};

// Snapshot ranking entry shape (from leaderboardService)
interface SnapshotRankingEntry {
    rank: number;
    userId: string;
    username: string;
    netUnits: number;
    currentStreak?: number;
}

// Legacy global leaderboard entry shape
interface GlobalLeaderboardEntry {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    rank: number;
    totalPoints: number;
    hasGoldBadge?: boolean;
}

const MOCK_RESULTS_WIN = [{ status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'pending' }, { status: 'pending' }] as const;
const MOCK_RESULTS_MID = [{ status: 'win' }, { status: 'win' }, { status: 'loss' }, { status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'loss' }] as const;

const mockupUsers: RankingUser[] = [
    { id: 'mock-1', username: 'ShadowWarrior', rank: 1, totalWins: 100, totalPicks: 133, tier: 'ULTIMATE GOLD', monthlyRankDelta: 3, yearlyRankDelta: 5, eventsParticipated: 50, results: [...MOCK_RESULTS_WIN], intelligencePoints: 12450 },
    { id: 'mock-2', username: 'FightKing', rank: 2, totalWins: 85, totalPicks: 113, tier: 'GRANDMASTER', monthlyRankDelta: 3, yearlyRankDelta: 5, eventsParticipated: 50, results: [{ status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'loss' }, { status: 'win' }, { status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'loss' }], intelligencePoints: 11200 },
    { id: 'mock-3', username: 'OctagonMaster', rank: 3, totalWins: 65, totalPicks: 86, tier: 'MASTER', monthlyRankDelta: -3, yearlyRankDelta: 5, eventsParticipated: 30, results: [{ status: 'win' }, { status: 'win' }, { status: 'win' }, { status: 'loss' }, { status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'loss' }], intelligencePoints: 10890 },
    { id: 'mock-4', username: 'StrikerElite', rank: 4, totalWins: 55, totalPicks: 73, tier: 'SAMURAI', monthlyRankDelta: 1, yearlyRankDelta: 5, eventsParticipated: 30, results: [...MOCK_RESULTS_MID], intelligencePoints: 9740 },
    { id: 'mock-5', username: 'GroundGameGuru', rank: 5, totalWins: 40, totalPicks: 53, tier: 'NINJA', monthlyRankDelta: -3, yearlyRankDelta: 5, eventsParticipated: 20, results: [{ status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'win' }, { status: 'loss' }, { status: 'loss' }, { status: 'loss' }, { status: 'loss' }], intelligencePoints: 9350 },
];

/**
 * Maps snapshot ranking entries (netUnits-based) to RankingUser shape.
 * Used for monthly and yearly tabs.
 */
const mapSnapshotRankings = (entries: SnapshotRankingEntry[]): RankingUser[] => {
    if (!entries || entries.length === 0) return mockupUsers;

    return entries.map((entry) => {
        const absUnits = Math.abs(entry.netUnits);
        // Derive win/loss count from net units for display purposes
        const estimatedWins = Math.max(0, Math.round(absUnits * 1.5));
        const estimatedPicks = estimatedWins + Math.round(absUnits * 0.5) + 2;
        const tier = determineTier(entry.rank, estimatedWins);
        // Build a deterministic result strip from netUnits
        const winRate = entry.netUnits > 0 ? Math.min(0.85, 0.5 + entry.netUnits / 20) : Math.max(0.15, 0.5 + entry.netUnits / 20);
        const results = Array.from({ length: 12 }, (_, i) => ({
            status: (i / 12) < winRate ? 'win' : (i / 12 < winRate + 0.1 ? 'pending' : 'loss') as 'win' | 'loss' | 'pending',
        }));

        return {
            id: entry.userId,
            username: entry.username || 'Unknown',
            rank: entry.rank,
            totalWins: estimatedWins,
            totalPicks: estimatedPicks,
            tier,
            monthlyRankDelta: 0,
            yearlyRankDelta: 0,
            eventsParticipated: Math.max(1, Math.round(absUnits / 3)),
            results,
            currentStreak: entry.currentStreak || 0,
            intelligencePoints: Math.max(0, Math.round(entry.netUnits * 10)), // Convert netUnits to points
        };
    });
};

/**
 * Maps global leaderboard entries (totalPoints-based) to RankingUser shape.
 * Used for the Global All-Time tab.
 */
const mapGlobalRankings = (entries: GlobalLeaderboardEntry[]): RankingUser[] => {
    if (!entries || entries.length === 0) return mockupUsers;

    return entries.map((entry) => ({
        id: entry.id,
        username: entry.displayName || entry.username || 'Anonymous',
        avatarUrl: entry.avatarUrl || undefined,
        rank: entry.hasGoldBadge ? 1 : entry.rank,
        totalWins: entry.totalPoints,
        totalPicks: entry.totalPoints > 0 ? Math.ceil(entry.totalPoints / 3) + 2 : 0,
        tier: determineTier(entry.rank, entry.totalPoints),
        monthlyRankDelta: 0,
        yearlyRankDelta: 0,
        eventsParticipated: Math.floor(entry.totalPoints / 5) || 1,
        results: Array.from({ length: 12 }, () => ({
            status: Math.random() > 0.3 ? 'win' : (Math.random() > 0.5 ? 'loss' : 'pending'),
        })) as any,
        intelligencePoints: entry.totalPoints * 10, // Convert totalPoints to intelligence points
    })).sort((a, b) => a.rank - b.rank);
};

export type LeaderboardType = 'global' | 'monthly' | 'yearly';

export const MMAMetricsRankings: React.FC = () => {
    const { user } = useAuth();
    const [leaderboardType, setLeaderboardType] = React.useState<LeaderboardType>('global');

    // Fetch Leaderboard
    const { data: rawData, isLoading, error } = useQuery({
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

    // Find current user's row for pinning
    const currentUserRow = rankings.find(r => r.id === user?.id);
    const filteredRankings = rankings.filter(r => r.id !== user?.id);

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
                    <div className="min-w-[900px]">
                        
                        {/* Table Header Row */}
                        <div className="flex items-center gap-6 px-10 py-5 border-b border-white/5 text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-6">
                            <div className="w-12 text-center">RANK</div>
                            <div className="w-[300px]">USER</div>
                            <div className="w-[140px] text-center">TIER</div>
                            <div className="flex-1 min-w-[200px]">PERFORMANCE</div>
                            <div className="w-[90px] text-center">WIN %</div>
                            <div className="w-[90px] text-center">EVENTS</div>
                            <div className="w-[120px] text-center flex items-center gap-1">
                                <Diamond className="w-3 h-3 text-[#E8A020]" />
                                INTELLIGENCE PTS
                            </div>
                            <div className="w-[120px] text-center">MONTHLY RANK</div>
                            <div className="w-[120px] text-center">YEARLY RANK</div>
                        </div>

                        {/* Rows */}
                        <div className="flex flex-col space-y-3">
                    {/* Pinned User Row (if exists) */}
                    {currentUserRow && (
                        <motion.div
                            key={`pinned-${currentUserRow.id}`}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="sticky top-0 z-10"
                        >
                            <RankingRow
                                user={currentUserRow}
                                animationIndex={0}
                                isSelf={true}
                                currentStreak={currentUserRow.currentStreak}
                                disableAnimation={false}
                            />
                        </motion.div>
                    )}
                    
                    {/* Other Rankings */}
                    <AnimatePresence mode="popLayout">
                        {filteredRankings.map((user, index) => (
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
                                    isSelf={user.id === (useAuth() as any).authUser?.id}
                                    currentStreak={user.currentStreak}
                                    disableAnimation={true} // We use motion.div for animation now
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {rankings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-white/10 bg-white/5">
                            <Trophy className="h-12 w-12 text-white/20 mb-4" />
                            <p className="text-white/60">No rankings available for this period yet.</p>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
};
