import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Search, MoreVertical, Shield, Ban, CheckCircle, BrainCircuit, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface User {
    id: string;
    username: string | null;
    email: string | null;
    role: string; // 'user', 'admin', 'moderator'
    isActive: boolean;
    isVerified: boolean;
    aiPreferences: { enabled: boolean };
    totalPoints: number;
    createdAt: string;
}

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

export const AdminUserManager = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

    // Fetch Users (Reusing the existing admin/users endpoint or search)
    // For now we use the search endpoint as it returns a list, or the generic /admin/users if implemented
    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ['/api/admin/users'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/admin/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        }
    });

    // Filter locally for now if search endpoint isn't robust enough or for speed
    const filteredUsers = users.filter(u =>
    (u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Mutations
    const toggleBanMutation = useMutation({
        mutationFn: async ({ userId, ban }: { userId: string, ban: boolean }) => {
            const res = await fetchWithAuth(`/api/admin/users/${userId}/ban`, {
                method: 'POST',
                body: JSON.stringify({ ban, reason: "Admin Action" })
            });
            if (!res.ok) throw new Error('Failed to update ban status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            toast({ title: "Success", description: "User ban status updated" });
            setIsBanDialogOpen(false);
        },
        onError: () => toast({ title: "Error", description: "Failed to update ban status", variant: "destructive" })
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            const res = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
                method: 'POST',
                body: JSON.stringify({ role })
            });
            if (!res.ok) throw new Error('Failed to update role');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            toast({ title: "Success", description: "User role updated" });
        }
    });

    const toggleAiMutation = useMutation({
        mutationFn: async ({ userId, enabled }: { userId: string, enabled: boolean }) => {
            const res = await fetchWithAuth(`/api/admin/users/${userId}/ai-access`, {
                method: 'POST',
                body: JSON.stringify({ enabled })
            });
            if (!res.ok) throw new Error('Failed to update AI access');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            toast({ title: "Success", description: "AI access updated" });
        }
    });

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        User Management
                    </CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>AI Access</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.username || 'No Username'}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">Active</Badge>
                                            ) : (
                                                <Badge variant="destructive">Banned</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.aiPreferences?.enabled ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Ban className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                        Copy User ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />

                                                    {/* Role Management */}
                                                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'user' })}>
                                                        Set as User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'moderator' })}>
                                                        Set as Moderator
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: 'admin' })} className="text-red-500">
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        Set as Admin
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* AI Toggle */}
                                                    <DropdownMenuItem onClick={() => toggleAiMutation.mutate({ userId: user.id, enabled: !user.aiPreferences?.enabled })}>
                                                        <BrainCircuit className="mr-2 h-4 w-4" />
                                                        {user.aiPreferences?.enabled ? 'Disable AI' : 'Enable AI'}
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Ban Toggle */}
                                                    <DropdownMenuItem
                                                        className={user.isActive ? "text-red-500" : "text-green-500"}
                                                        onClick={() => toggleBanMutation.mutate({ userId: user.id, ban: user.isActive })}
                                                    >
                                                        {user.isActive ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                        {user.isActive ? 'Ban User' : 'Unban User'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
