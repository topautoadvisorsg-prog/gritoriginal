import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trophy, Flame, TrendingUp, ArrowUp, ArrowDown, Minus, MessageSquare, Crown, Lock, LogOut, Settings, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { DataFreshnessIndicator } from '@/shared/components/DataFreshnessIndicator';
import { GroupChat } from './GroupChat';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/shared/hooks/use-auth-clerk';
import { ErrorState } from '@/shared/components/ui/error-state';

interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
    username: string;
    avatarUrl?: string;
    netUnits: number;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    isPrivate: boolean;
    maxMembers: number;
    avatarUrl?: string;
    members: GroupMember[];
    memberCount: number;
}

export const GroupDetailPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat'>('leaderboard');

    // Fetch group details - no polling, use manual refresh via button
    const { data: group, isLoading, error, refetch } = useQuery<Group>({
        queryKey: ['/api/groups', groupId],
        queryFn: async () => {
            const res = await fetch(`/api/groups/${groupId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch group');
            return res.json();
        },
        staleTime: 0, // Always refetch on mount/focus for accuracy
    });

    // Leave group mutation
    const leaveGroupMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) throw new Error('User identity is unavailable');
            const res = await fetch(`/api/groups/${groupId}/members/${user.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to leave group');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/groups/my'] });
            toast({
                title: 'Left Group',
                description: 'You have successfully left the group',
            });
            navigate('/groups');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-[#E8A020]" />
                <p className="text-white/60 mt-4 text-sm uppercase tracking-widest">Loading Group...</p>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="py-20 px-4">
                <ErrorState
                    title="Group unavailable"
                    description="This group may be private, removed, or temporarily unavailable. Try again or return to Groups."
                    onRetry={() => void refetch()}
                    variant="card"
                />
                <button
                    onClick={() => navigate('/groups')}
                    className="mx-auto mt-4 block text-xs font-black uppercase tracking-widest text-[#E8A020] hover:underline"
                >
                    Back to Groups
                </button>
            </div>
        );
    }

    const isOwner = group.ownerId === user?.id;

    // Sort members by intelligence points for leaderboard
    const sortedMembers = [...group.members].sort((a, b) => 
        b.netUnits - a.netUnits
    );

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto p-8 bg-[#080808] text-white min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/groups')}
                    className="text-xs text-white/40 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                >
                    ← BACK TO GROUPS
                </button>
                
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#E8A020] display-font italic" style={{ textShadow: '0 0 30px rgba(232, 160, 32, 0.4)' }}>
                                {group.name}
                            </h1>
                            {group.isPrivate && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                    <Lock className="w-3 h-3 text-white/40" />
                                    <span className="text-[9px] uppercase tracking-widest text-white/40">PRIVATE</span>
                                </div>
                            )}
                        </div>
                        {group.description && (
                            <p className="text-sm text-white/60 max-w-2xl mb-4">{group.description}</p>
                        )}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-white/40" />
                                <span className="text-xs font-bold text-white">
                                    {group.memberCount} / {group.maxMembers} MEMBERS
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#E8A020]" />
                                <span className="text-xs font-bold text-[#E8A020]">
                                    TOP PERFORMER: {sortedMembers[0]?.username || 'N/A'}
                                </span>
                            </div>
                            {/* Data Freshness Indicator */}
                            <DataFreshnessIndicator 
                                dataUpdatedAt={group ? (group as any).updatedAt : 0}
                                isFetching={isLoading}
                            />
                        </div>
                    </div>

                    {/* Actions - Refresh + Other */}
                    <div className="flex gap-3">
                        {/* Manual Refresh Button */}
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            title="Refresh group data"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Refresh</span>
                        </button>
                        
                        {!isOwner ? (
                            <button
                                onClick={() => leaveGroupMutation.mutate()}
                                disabled={leaveGroupMutation.isPending}
                                className="ghost-btn flex items-center gap-2 px-4 py-2 text-xs uppercase font-black tracking-widest button-press-scale"
                            >
                                <LogOut className="w-4 h-4" />
                                LEAVE
                            </button>
                        ) : (
                            <button className="ghost-btn flex items-center gap-2 px-4 py-2 text-xs uppercase font-black tracking-widest">
                                <Settings className="w-4 h-4" />
                                MANAGE
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={cn(
                        "px-6 py-3 text-xs uppercase font-black tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'leaderboard'
                            ? "text-[#E8A020] border-b-2 border-[#E8A020]"
                            : "text-white/40 hover:text-white"
                    )}
                >
                    <Trophy className="w-4 h-4" />
                    LEADERBOARD
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                        "px-6 py-3 text-xs uppercase font-black tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'chat'
                            ? "text-[#E8A020] border-b-2 border-[#E8A020]"
                            : "text-white/40 hover:text-white"
                    )}
                >
                    <MessageSquare className="w-4 h-4" />
                    CHAT
                </button>
            </div>

            {/* Content */}
            <div className="transition-opacity duration-200">
                {activeTab === 'leaderboard' && (
                    <GroupLeaderboard members={sortedMembers} currentUserId={user?.id} />
                )}
                {activeTab === 'chat' && (
                    <GroupChat groupId={groupId!} />
                )}
            </div>
        </div>
    );
};

// Leaderboard Component
const GroupLeaderboard: React.FC<{ members: GroupMember[]; currentUserId?: string }> = ({ members, currentUserId }) => {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-6 px-6 py-4 border-b border-white/5 text-[9px] uppercase font-black tracking-[0.2em] text-white/30">
                <div className="w-12 text-center">RANK</div>
                <div className="flex-1">MEMBER</div>
                <div className="w-[120px] text-center">NET UNITS</div>
            </div>

            {/* Members */}
            {members.map((member, index) => {
                const isCurrentUser = member.userId === currentUserId;

                return (
                    <div
                        key={member.id}
                        className={cn(
                            "flex items-center gap-6 px-6 py-4 rounded-xl transition-all",
                            isCurrentUser
                                ? "bg-[#E8A020]/10 border border-[#E8A020]"
                                : "bg-[#111] border border-white/5 hover:border-white/20 hover:scale-[1.01]"
                        )}
                    >
                        {/* Rank */}
                        <div className="w-12 text-center">
                            <span className={cn(
                                "font-black text-2xl italic",
                                index === 0 ? "text-[#E8A020]" : "text-white/20"
                            )}>
                                #{index + 1}
                            </span>
                        </div>

                        {/* Member Info */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8A020] to-[#E8A020]/50 flex items-center justify-center text-black font-black text-sm">
                                    {member.username.slice(0, 2).toUpperCase()}
                                </div>
                                {member.role === 'owner' && (
                                    <div className="absolute -top-1 -right-1">
                                        <Crown className="w-4 h-4 text-[#E8A020] fill-[#E8A020]" />
                                    </div>
                                )}
                                {member.role === 'admin' && (
                                    <div className="absolute -top-1 -right-1 px-1 rounded bg-blue-500/20 border border-blue-500/50">
                                        <span className="text-[8px] font-black text-blue-400">A</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-white uppercase">{member.username}</span>
                                    {isCurrentUser && (
                                        <span className="text-[9px] uppercase tracking-widest text-[#E8A020] bg-[#E8A020]/10 px-2 py-0.5 rounded">YOU</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/40">
                                        {member.role === 'owner' ? 'OWNER' : member.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Points */}
                        <div className="w-[120px] text-center">
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-white">
                                    {member.netUnits > 0 ? '+' : ''}{member.netUnits.toFixed(2)}u
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
