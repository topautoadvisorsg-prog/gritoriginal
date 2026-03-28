import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
    Award, Search, Loader2, User, Plus, Trash2
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

interface Badge {
    id: string;
    userId: string;
    badgeName: string;
    badgeIcon: string | null;
    awardedAt: string;
    reason: string | null;
}

export const AdminBadgeManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [badgeName, setBadgeName] = useState('');
    const [badgeIcon, setBadgeIcon] = useState('🏆');
    const [badgeReason, setBadgeReason] = useState('');

    // Search users
    const { data: users = [], isLoading: usersLoading } = useQuery<UserResult[]>({
        queryKey: ['/api/admin/users/search', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const res = await fetchWithAuth(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: searchQuery.length > 1,
    });

    // Fetch user badges
    const { data: userBadges = [] } = useQuery<Badge[]>({
        queryKey: [`/api/admin/users/${selectedUser?.id}/badges`],
        queryFn: async () => {
            const res = await fetchWithAuth(`/api/admin/users/${selectedUser!.id}/badges`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!selectedUser,
    });

    // Assign badge
    const assignMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth(`/api/admin/users/${selectedUser!.id}/badges`, {
                method: 'POST',
                body: JSON.stringify({ badgeName, badgeIcon, reason: badgeReason }),
            });
            if (!res.ok) throw new Error('Failed to assign badge');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${selectedUser?.id}/badges`] });
            setBadgeName('');
            setBadgeReason('');
        },
    });

    // Remove badge
    const removeMutation = useMutation({
        mutationFn: async (badgeId: string) => {
            const res = await fetchWithAuth(`/api/admin/users/${selectedUser!.id}/badges/${badgeId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove badge');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${selectedUser?.id}/badges`] }),
    });

    const displayName = (u: UserResult) =>
        u.username || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || 'Unknown';

    const BADGE_ICONS = ['🏆', '🥇', '🥈', '🥉', '⭐', '🔥', '💎', '👑', '🦅', '🎯'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: User Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Select User
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by username or email"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {selectedUser ? (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold">{displayName(selectedUser)}</span>
                                        <span className="text-xs text-muted-foreground ml-2 capitalize">{selectedUser.tier}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                        Change
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <ScrollArea className="h-[250px]">
                                {usersLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                                                <span className="text-xs text-muted-foreground ml-auto capitalize">{u.tier}</span>
                                            </button>
                                        ))}
                                        {searchQuery.length > 1 && users.length === 0 && !usersLoading && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                                        )}
                                    </div>
                                )}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Badge Assignment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Badges
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!selectedUser ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Select a user first</p>
                        ) : (
                            <>
                                {/* Assign new badge */}
                                <div className="space-y-3 p-3 rounded-lg border border-border">
                                    <Input
                                        placeholder="Badge name (e.g. Top Predictor)"
                                        value={badgeName}
                                        onChange={(e) => setBadgeName(e.target.value)}
                                    />
                                    <div className="flex gap-1 flex-wrap">
                                        {BADGE_ICONS.map((icon) => (
                                            <button
                                                key={icon}
                                                onClick={() => setBadgeIcon(icon)}
                                                className={`text-lg p-1 rounded ${badgeIcon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'}`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="Reason (optional)"
                                        value={badgeReason}
                                        onChange={(e) => setBadgeReason(e.target.value)}
                                    />
                                    <Button
                                        size="sm"
                                        disabled={!badgeName.trim() || assignMutation.isPending}
                                        onClick={() => assignMutation.mutate()}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Assign Badge
                                    </Button>
                                </div>

                                {/* Existing badges */}
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-2">
                                        {userBadges.map((badge) => (
                                            <div
                                                key={badge.id}
                                                className="flex items-center justify-between p-2 rounded-lg border border-border"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{badge.badgeIcon || '🏆'}</span>
                                                    <div>
                                                        <span className="text-sm font-medium">{badge.badgeName}</span>
                                                        {badge.reason && (
                                                            <p className="text-xs text-muted-foreground">{badge.reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMutation.mutate(badge.id)}
                                                    disabled={removeMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        {userBadges.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No badges assigned</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminBadgeManager;
