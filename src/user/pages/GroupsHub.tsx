import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, TrendingUp, Lock, Globe, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';
import { ErrorState } from '@/shared/components/ui/error-state';

interface Group {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    isPrivate: boolean;
    maxMembers: number;
    avatarUrl?: string;
    memberCount?: number;
    createdAt: string;
}

export const GroupsHub: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch user's groups
    const { data: myGroups, isLoading: loadingMyGroups, isError: myGroupsError, refetch: refetchMyGroups, isFetching: fetchingMyGroups } = useQuery<Group[]>({
        queryKey: ['/api/groups/my'],
        queryFn: async () => {
            const res = await fetch('/api/groups/my', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch groups');
            return res.json();
        },
    });

    // Fetch public groups
    const { data: discoverGroups, isLoading: loadingDiscover, isError: discoverError, refetch: refetchDiscover, isFetching: fetchingDiscover } = useQuery<Group[]>({
        queryKey: ['/api/groups/browse'],
        queryFn: async () => {
            const res = await fetch('/api/groups/browse?limit=20', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch public groups');
            return res.json();
        },
    });

    // Create group mutation
    const createGroupMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string; isPrivate: boolean }) => {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || body.error || 'Failed to create group');
            return body;
        },
        onSuccess: (newGroup) => {
            queryClient.invalidateQueries({ queryKey: ['/api/groups/my'] });
            toast({
                title: 'Group Created!',
                description: `Welcome to ${newGroup.name}`,
            });
            setShowCreateModal(false);
            navigate(`/groups/${newGroup.id}`);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const joinGroupMutation = useMutation({
        mutationFn: async (group: Group) => {
            const res = await fetch(`/api/groups/${group.id}/join`, {
                method: 'POST',
                credentials: 'include',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Failed to join group');
            return group;
        },
        onSuccess: (group) => {
            queryClient.invalidateQueries({ queryKey: ['/api/groups/my'] });
            queryClient.invalidateQueries({ queryKey: ['/api/groups/browse'] });
            toast({ title: 'Group Joined', description: `You joined ${group.name}` });
            navigate(`/groups/${group.id}`);
        },
        onError: (error: Error) => {
            toast({ title: 'Unable to Join', description: error.message, variant: 'destructive' });
        },
    });

    const filteredDiscover = discoverGroups?.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto p-4 md:p-8 bg-[#080808] text-white min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-[#E8A020] display-font italic" style={{ textShadow: '0 0 30px rgba(232, 160, 32, 0.4)' }}>
                        GROUPS
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black mt-2">
                        COMPETE WITH YOUR CREW
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="gold-btn flex items-center gap-2 px-6 py-3 text-xs uppercase font-black tracking-widest button-press-scale"
                >
                    <Plus className="w-4 h-4" />
                    CREATE GROUP
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('my-groups')}
                    className={cn(
                        "px-6 py-3 text-xs uppercase font-black tracking-widest transition-all",
                        activeTab === 'my-groups'
                            ? "text-[#E8A020] border-b-2 border-[#E8A020]"
                            : "text-white/40 hover:text-white"
                    )}
                >
                    MY GROUPS
                </button>
                <button
                    onClick={() => setActiveTab('discover')}
                    className={cn(
                        "px-6 py-3 text-xs uppercase font-black tracking-widest transition-all",
                        activeTab === 'discover'
                            ? "text-[#E8A020] border-b-2 border-[#E8A020]"
                            : "text-white/40 hover:text-white"
                    )}
                >
                    DISCOVER
                </button>
            </div>

            {/* Content */}
            {activeTab === 'my-groups' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingMyGroups ? (
                        <div className="col-span-full flex items-center justify-center py-32">
                            <Loader2 className="h-10 w-10 animate-spin text-[#E8A020]" />
                        </div>
                    ) : myGroupsError ? (
                        <ErrorState
                            title="Groups unavailable"
                            description="We couldn't load your groups. Check your connection and try again."
                            onRetry={() => void refetchMyGroups()}
                            isRetrying={fetchingMyGroups}
                            variant="card"
                            className="col-span-full"
                        />
                    ) : myGroups && myGroups.length > 0 ? (
                        myGroups.map(group => (
                            <GroupCard key={group.id} group={group} onClick={() => navigate(`/groups/${group.id}`)} />
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
                            <Users className="w-16 h-16 text-white/20 mb-4" />
                            <h3 className="text-xl font-bold text-white/60 mb-2">No Groups Yet</h3>
                            <p className="text-sm text-white/40 max-w-md mb-6">
                                Create your own group or join existing ones to start competing with friends
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="ghost-btn flex items-center gap-2 px-6 py-3 text-xs uppercase font-black tracking-widest"
                            >
                                <Plus className="w-4 h-4" />
                                CREATE Your First Group
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#E8A020]/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingDiscover ? (
                            <div className="col-span-full flex items-center justify-center py-32">
                                <Loader2 className="h-10 w-10 animate-spin text-[#E8A020]" />
                            </div>
                        ) : discoverError ? (
                            <ErrorState
                                title="Discovery unavailable"
                                description="We couldn't load public groups. Check your connection and try again."
                                onRetry={() => void refetchDiscover()}
                                isRetrying={fetchingDiscover}
                                variant="card"
                                className="col-span-full"
                            />
                        ) : filteredDiscover && filteredDiscover.length > 0 ? (
                            filteredDiscover.map(group => {
                                const isMember = myGroups?.some((candidate) => candidate.id === group.id) ?? false;
                                const isFull = (group.memberCount ?? 0) >= group.maxMembers;
                                return (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                        actionLabel={isMember ? 'OPEN' : isFull ? 'FULL' : 'JOIN'}
                                        actionDisabled={isFull || joinGroupMutation.isPending}
                                        actionPending={joinGroupMutation.isPending && joinGroupMutation.variables?.id === group.id}
                                        onAction={isMember
                                            ? () => navigate(`/groups/${group.id}`)
                                            : () => joinGroupMutation.mutate(group)}
                                    />
                                );
                            })
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
                                <Globe className="w-16 h-16 text-white/20 mb-4" />
                                <h3 className="text-xl font-bold text-white/60 mb-2">No Groups Found</h3>
                                <p className="text-sm text-white/40">Try a different search term</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">
                            Create New Group
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createGroupMutation.mutate({
                                name: formData.get('name') as string,
                                description: formData.get('description') as string || undefined,
                                isPrivate: formData.get('isPrivate') === 'true',
                            });
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        name="name"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#E8A020]/50"
                                        placeholder="e.g., Octagon Kings"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#E8A020]/50 resize-none"
                                        placeholder="What's your group about?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                                        Privacy
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPrivate"
                                                value="true"
                                                defaultChecked
                                                className="accent-[#E8A020]"
                                            />
                                            <span className="text-sm text-white flex items-center gap-2">
                                                <Lock className="w-4 h-4" />
                                                Private (Invite Only)
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPrivate"
                                                value="false"
                                                className="accent-[#E8A020]"
                                            />
                                            <span className="text-sm text-white flex items-center gap-2">
                                                <Globe className="w-4 h-4" />
                                                Public
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 ghost-btn py-3 text-xs uppercase font-black tracking-widest"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={createGroupMutation.isPending}
                                    className="flex-1 gold-btn py-3 text-xs uppercase font-black tracking-widest button-press-scale disabled:opacity-50"
                                >
                                    {createGroupMutation.isPending ? 'CREATING...' : 'CREATE GROUP'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Group Card Component
const GroupCard: React.FC<{
    group: Group;
    onClick: () => void;
    actionLabel?: string;
    actionDisabled?: boolean;
    actionPending?: boolean;
    onAction?: () => void;
}> = ({ group, onClick, actionLabel, actionDisabled, actionPending, onAction }) => {
    return (
        <div
            onClick={onClick}
            className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-[#E8A020]/30 transition-all cursor-pointer hover:scale-[1.02] overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#E8A020]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {group.isPrivate ? (
                                <Lock className="w-4 h-4 text-white/40" />
                            ) : (
                                <Globe className="w-4 h-4 text-white/40" />
                            )}
                            <span className="text-[9px] uppercase tracking-widest text-white/40">
                                {group.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                            {group.name}
                        </h3>
                        {group.description && (
                            <p className="text-xs text-white/40 line-clamp-2">
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/40" />
                        <span className="text-xs font-bold text-white">
                            {group.memberCount || 1} / {group.maxMembers} MEMBERS
                        </span>
                    </div>
                    {onAction && actionLabel && (
                        <button
                            type="button"
                            disabled={actionDisabled}
                            onClick={(event) => {
                                event.stopPropagation();
                                onAction();
                            }}
                            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#E8A020]/40 px-3 py-2 text-[10px] font-black tracking-widest text-[#E8A020] hover:bg-[#E8A020]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {actionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                            {actionPending ? 'JOINING' : actionLabel}
                        </button>
                    )}
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity empty:hidden">
                    {!onAction && (
                    <div className="w-10 h-10 rounded-full bg-[#E8A020] flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-black" />
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};
