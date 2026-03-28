import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
    BadgeCheck, Search, Loader2, User, Crown, ShieldCheck, ShieldOff, Star, StarOff
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
    isVerified: boolean;
    featuredInfluencer: boolean;
}

export const AdminUserVerification: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    // All verified users
    const { data: influencers = [], isLoading: infLoading } = useQuery<UserResult[]>({
        queryKey: ['/api/influencers'],
    });

    // Search users
    const { data: searchResults = [], isLoading: searchLoading } = useQuery<UserResult[]>({
        queryKey: ['/api/admin/users/search', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const res = await fetchWithAuth(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: searchQuery.length > 1,
    });

    // Toggle verification
    const verifyMutation = useMutation({
        mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
            const res = await fetchWithAuth(`/api/admin/users/${userId}/verify`, {
                method: 'POST',
                body: JSON.stringify({ verified }),
            });
            if (!res.ok) throw new Error('Failed to update verification');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/influencers'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users/search'] });
        },
    });

    // Toggle featured
    const featureMutation = useMutation({
        mutationFn: async ({ userId, featured }: { userId: string; featured: boolean }) => {
            const res = await fetchWithAuth(`/api/admin/users/${userId}/feature`, {
                method: 'POST',
                body: JSON.stringify({ featured }),
            });
            if (!res.ok) throw new Error('Failed to update featured status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/influencers'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users/search'] });
        },
    });

    const displayName = (u: UserResult) =>
        u.username || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || 'Unknown';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Search / Add Verified Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Find Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by username or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <ScrollArea className="h-[350px]">
                            {searchLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-sm font-medium">{displayName(u)}</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-xs text-muted-foreground capitalize">{u.tier}</span>
                                                        {u.isVerified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
                                                        {u.featuredInfluencer && <Crown className="h-3 w-3 text-amber-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant={u.isVerified ? 'destructive' : 'default'}
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => verifyMutation.mutate({ userId: u.id, verified: !u.isVerified })}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    {u.isVerified ? <ShieldOff className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                                                    {u.isVerified ? 'Unverify' : 'Verify'}
                                                </Button>
                                                {u.isVerified && (
                                                    <Button
                                                        variant={u.featuredInfluencer ? 'outline' : 'secondary'}
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => featureMutation.mutate({ userId: u.id, featured: !u.featuredInfluencer })}
                                                        disabled={featureMutation.isPending}
                                                    >
                                                        {u.featuredInfluencer ? <StarOff className="h-3 w-3 mr-1" /> : <Star className="h-3 w-3 mr-1" />}
                                                        {u.featuredInfluencer ? 'Unpin' : 'Feature'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {searchQuery.length > 1 && searchResults.length === 0 && !searchLoading && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                                    )}
                                    {searchQuery.length <= 1 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">Type to search users</p>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Current Verified Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BadgeCheck className="h-5 w-5 text-blue-500" />
                            Verified Users ({influencers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {infLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : influencers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No verified users yet</p>
                        ) : (
                            <ScrollArea className="h-[350px]">
                                <div className="space-y-2">
                                    {influencers.map((u) => (
                                        <div
                                            key={u.id}
                                            className={cn(
                                                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                                u.featuredInfluencer
                                                    ? 'border-amber-500/30 bg-amber-500/5'
                                                    : 'border-border'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {u.featuredInfluencer && <Crown className="h-4 w-4 text-amber-500" />}
                                                <BadgeCheck className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium">{displayName(u)}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant={u.featuredInfluencer ? 'outline' : 'secondary'}
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => featureMutation.mutate({ userId: u.id, featured: !u.featuredInfluencer })}
                                                    disabled={featureMutation.isPending}
                                                >
                                                    {u.featuredInfluencer ? 'Unpin' : 'Feature'}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => verifyMutation.mutate({ userId: u.id, verified: false })}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminUserVerification;
