import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/shared/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
    MessageSquare,
    Settings,
    Shield,
    Star,
    Activity,
    Trash2,
    Check,
    X,
    VolumeX,
    Volume2,
    Clock,
    Loader2,
    Image,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/shared/hooks/use-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatConfig {
    id: number;
    isOpen: boolean;
    cooldownMinutes: number;
    updatedAt?: string;
}

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    chatType: string;
    message: string;
    type: string;
    createdAt: string;
    slipId?: string | null;
}

interface Slip {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string | null;
    imageUrl: string;
    caption?: string | null;
    status: string;
    isFeatured: boolean;
    featuredAt?: string | null;
    approvedAt?: string | null;
    createdAt: string;
    rejectionMessage?: string | null;
}

interface MuteRecord {
    id: string;
    userId: string;
    username: string;
    reason?: string | null;
    expiresAt?: string | null;
    createdAt: string;
}

interface BanRecord {
    id: string;
    userId: string;
    username: string;
    reason?: string | null;
    expiresAt?: string | null;
    createdAt: string;
}

interface ActivityLog {
    id: string;
    adminId: string;
    adminUsername: string;
    action: string;
    targetType: string;
    targetId: string;
    details: Record<string, unknown>;
    createdAt: string;
}

interface UserSearchResult {
    id: string;
    username?: string;
    email?: string;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'control', label: 'Chat Control', icon: Settings },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'slips', label: 'Slip Queue', icon: Image },
    { key: 'wall', label: 'Featured Wall', icon: Star },
    { key: 'moderation', label: 'Mutes & Bans', icon: Shield },
    { key: 'activity', label: 'Activity Log', icon: Activity },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        // Surface real HTTP errors so mutations route to onError (no false success toasts)
        let message = `Request failed (${res.status})`;
        try {
            const body = await res.clone().json();
            if (body?.error || body?.message) message = body.error || body.message;
        } catch {
            // non-JSON error body — keep the status-based message
        }
        throw new Error(message);
    }
    return res;
}

function formatExpiry(expiresAt?: string | null): string {
    if (!expiresAt) return 'Permanent';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'Expired';
    return `Expires ${formatDistanceToNow(d, { addSuffix: true })}`;
}

function actionBadgeVariant(action: string): 'destructive' | 'default' | 'secondary' | 'outline' {
    if (action.includes('BAN') || action.includes('REJECT')) return 'destructive';
    if (action.includes('FEATURE') || action.includes('APPROVE')) return 'default';
    if (action.includes('MUTE') || action.includes('DELETE')) return 'secondary';
    return 'outline';
}

// ── Duration picker helper ────────────────────────────────────────────────────

type DurationUnit = 'permanent' | 'hours' | 'days';

interface DurationPickerProps {
    value: string;
    unit: DurationUnit;
    onValueChange: (v: string) => void;
    onUnitChange: (u: DurationUnit) => void;
}

function DurationPicker({ value, unit, onValueChange, onUnitChange }: DurationPickerProps) {
    return (
        <div className="flex gap-2 items-center">
            <Select value={unit} onValueChange={v => onUnitChange(v as DurationUnit)}>
                <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                </SelectContent>
            </Select>
            {unit !== 'permanent' && (
                <Input
                    type="number"
                    min={1}
                    max={unit === 'hours' ? 8760 : 365}
                    placeholder={unit === 'hours' ? '24' : '7'}
                    value={value}
                    onChange={e => onValueChange(e.target.value)}
                    className="w-20 h-8 text-sm"
                />
            )}
        </div>
    );
}

function durationToHours(value: string, unit: DurationUnit): number | undefined {
    if (unit === 'permanent') return undefined;
    const n = Number(value);
    if (!n || n <= 0) return undefined;
    return unit === 'days' ? n * 24 : n;
}

// ── User search helper ────────────────────────────────────────────────────────

interface UserSearchFieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

function UserSearchField({ label, value, onChange, placeholder }: UserSearchFieldProps) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const { data: results = [], isFetching } = useQuery<UserSearchResult[]>({
        queryKey: ['/api/admin/users/search', search],
        queryFn: () =>
            search.length >= 2
                ? apiFetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=8`).then(r => r.json())
                : Promise.resolve([]),
        enabled: search.length >= 2,
    });

    const displayName = (u: UserSearchResult) => u.username || u.email || u.id;

    const handleSelect = (u: UserSearchResult) => {
        onChange(u.id);
        setSearch(displayName(u));
        setOpen(false);
    };

    return (
        <div className="space-y-1 relative">
            <Label className="text-xs">{label}</Label>
            <Input
                placeholder={placeholder ?? 'Search username…'}
                value={search}
                onChange={e => {
                    setSearch(e.target.value);
                    onChange('');
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="w-52 h-8 text-sm"
            />
            {open && (search.length >= 2) && (
                <div className="absolute z-50 top-full left-0 w-52 bg-popover border rounded-md shadow-lg mt-1 overflow-hidden">
                    {isFetching ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-3 py-2">No users found</p>
                    ) : (
                        results.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                onMouseDown={() => handleSelect(u)}
                            >
                                <span className="font-medium">{displayName(u)}</span>
                                <span className="text-xs text-muted-foreground ml-2">{u.id.slice(0, 8)}…</span>
                            </button>
                        ))
                    )}
                </div>
            )}
            {value && (
                <p className="text-xs text-muted-foreground">ID: {value.slice(0, 16)}…</p>
            )}
        </div>
    );
}

// ── Chat Control ──────────────────────────────────────────────────────────────

function ChatControlPanel() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: config, isLoading } = useQuery<ChatConfig>({
        queryKey: ['/api/admin/chat/config'],
        queryFn: () => apiFetch('/api/admin/chat/config').then(r => r.json()),
    });

    const [cooldown, setCooldown] = useState<string>('');

    React.useEffect(() => {
        if (config) setCooldown(String(config.cooldownMinutes));
    }, [config]);

    const toggleMutation = useMutation({
        mutationFn: (isOpen: boolean) =>
            apiFetch('/api/admin/chat/config', { method: 'PATCH', body: JSON.stringify({ isOpen }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/config'] });
            toast({ title: 'Chat status updated' });
        },
        onError: () => toast({ title: 'Failed to update config', variant: 'destructive' }),
    });

    const cooldownMutation = useMutation({
        mutationFn: (cooldownMinutes: number) =>
            apiFetch('/api/admin/chat/config', { method: 'PATCH', body: JSON.stringify({ cooldownMinutes }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/config'] });
            toast({ title: 'Cooldown updated' });
        },
        onError: () => toast({ title: 'Failed to update cooldown', variant: 'destructive' }),
    });

    if (isLoading) {
        return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-base">Chat Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Community Chat</p>
                            <p className="text-sm text-muted-foreground">
                                {config?.isOpen ? 'Open — users can send messages' : 'Closed — users can only read'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={config?.isOpen ? 'default' : 'destructive'}>
                                {config?.isOpen ? 'OPEN' : 'CLOSED'}
                            </Badge>
                            <Button
                                variant={config?.isOpen ? 'destructive' : 'default'}
                                size="sm"
                                disabled={toggleMutation.isPending}
                                onClick={() => toggleMutation.mutate(!config?.isOpen)}
                            >
                                {toggleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                {config?.isOpen ? 'Close Chat' : 'Open Chat'}
                            </Button>
                        </div>
                    </div>
                    {config?.updatedAt && (
                        <p className="text-xs text-muted-foreground">
                            Last updated {formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Slip Post Cooldown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Minimum time a Challenger must wait between slip posts. Set to 0 to disable.
                    </p>
                    <div className="flex items-end gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                            <Input
                                id="cooldown"
                                type="number"
                                min={0}
                                max={10080}
                                value={cooldown}
                                onChange={e => setCooldown(e.target.value)}
                                className="w-32"
                            />
                        </div>
                        <Button
                            disabled={cooldownMutation.isPending}
                            onClick={() => cooldownMutation.mutate(Number(cooldown))}
                        >
                            {cooldownMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Save
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Current: <strong>{config?.cooldownMinutes ?? 30} min</strong>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Message Feed ──────────────────────────────────────────────────────────────

function MessageFeed() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [chatType, setChatType] = useState<string>('global');
    const [countryCode, setCountryCode] = useState<string>('US');
    const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null);

    const effectiveChatType = chatType === 'country' ? countryCode.toUpperCase() || 'US' : chatType;

    const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey: ['/api/admin/chat/messages', effectiveChatType],
        queryFn: () => apiFetch(`/api/admin/chat/messages?chatType=${encodeURIComponent(effectiveChatType)}&limit=50`).then(r => r.json()),
        refetchInterval: 15000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiFetch(`/api/admin/chat/messages/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/messages', effectiveChatType] });
            toast({ title: 'Message deleted' });
            setConfirmDelete(null);
        },
        onError: () => toast({ title: 'Failed to delete message', variant: 'destructive' }),
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-base mr-auto">Recent Messages</CardTitle>
                        <div className="flex gap-2">
                            {['global', 'country'].map(ct => (
                                <Button key={ct} size="sm" variant={chatType === ct ? 'default' : 'outline'} onClick={() => setChatType(ct)}>
                                    {ct === 'global' ? 'Global' : 'Country'}
                                </Button>
                            ))}
                        </div>
                        {chatType === 'country' && (
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="country-code" className="text-xs whitespace-nowrap">Country code</Label>
                                <Input
                                    id="country-code"
                                    placeholder="US"
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value.toUpperCase().slice(0, 4))}
                                    className="w-20 h-8 text-sm uppercase"
                                    maxLength={4}
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No messages</p>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {messages.map(msg => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="font-medium text-sm">{msg.username}</TableCell>
                                            <TableCell className="max-w-xs truncate text-sm">{msg.message}</TableCell>
                                            <TableCell>
                                                <Badge variant={msg.type === 'slip' ? 'default' : 'secondary'} className="text-xs">
                                                    {msg.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => setConfirmDelete(msg)}
                                                    aria-label="Delete message"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Message?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove the message from <strong>@{confirmDelete?.username}</strong>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {confirmDelete && (
                        <div className="rounded-md bg-muted px-3 py-2 text-sm italic text-muted-foreground line-clamp-3">
                            "{confirmDelete.message}"
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Slip Queue ────────────────────────────────────────────────────────────────

function SlipQueue() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rejectDialog, setRejectDialog] = useState<{ slipId: string; username: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [featureDialog, setFeatureDialog] = useState<{ slipId: string; username: string } | null>(null);
    const [featureCaption, setFeatureCaption] = useState('');

    const { data: pending = [], isLoading } = useQuery<Slip[]>({
        queryKey: ['/api/admin/slips/pending'],
        queryFn: () => apiFetch('/api/admin/slips/pending').then(r => r.json()),
        refetchInterval: 30000,
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action, caption, rejectionMessage }: {
            id: string; action: string; caption?: string; rejectionMessage?: string;
        }) =>
            apiFetch(`/api/admin/slips/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ action, caption, rejectionMessage }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/slips/pending'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/slips/featured'] });
        },
        onError: () => toast({ title: 'Action failed', variant: 'destructive' }),
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        Pending Slips
                        {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : pending.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No pending slips — queue is clear</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pending.map(slip => (
                                <div key={slip.id} className="border rounded-lg overflow-hidden bg-muted/10">
                                    <div className="aspect-[4/3] bg-muted">
                                        <img src={slip.imageUrl} alt="Pending slip" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <p className="font-medium text-sm">@{slip.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(slip.createdAt), { addSuffix: true })}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-green-500 border-green-500/40 hover:bg-green-500/10"
                                                disabled={actionMutation.isPending}
                                                onClick={() => actionMutation.mutate(
                                                    { id: slip.id, action: 'approve' },
                                                    { onSuccess: () => toast({ title: `Approved @${slip.username}'s slip` }) }
                                                )}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/10"
                                                disabled={actionMutation.isPending}
                                                onClick={() => { setFeatureDialog({ slipId: slip.id, username: slip.username }); setFeatureCaption(''); }}
                                            >
                                                <Star className="h-3.5 w-3.5 mr-1" />
                                                Feature
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                                                disabled={actionMutation.isPending}
                                                onClick={() => { setRejectDialog({ slipId: slip.id, username: slip.username }); setRejectReason(''); }}
                                            >
                                                <X className="h-3.5 w-3.5 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!featureDialog} onOpenChange={open => !open && setFeatureDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Feature Slip — @{featureDialog?.username}</DialogTitle>
                        <DialogDescription>
                            This slip will appear on the public Slip Wall. Add an optional caption that will show with it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5 py-2">
                        <Label>Caption (optional)</Label>
                        <Input
                            placeholder="e.g. Insane parlay lock 🔥"
                            value={featureCaption}
                            onChange={e => setFeatureCaption(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFeatureDialog(null)}>Cancel</Button>
                        <Button
                            onClick={() => featureDialog && actionMutation.mutate(
                                { id: featureDialog.slipId, action: 'feature', caption: featureCaption || undefined },
                                {
                                    onSuccess: () => {
                                        toast({ title: `Featured @${featureDialog.username}'s slip` });
                                        setFeatureDialog(null);
                                    }
                                }
                            )}
                            disabled={actionMutation.isPending}
                        >
                            {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                            Feature Slip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejectDialog} onOpenChange={open => !open && setRejectDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Slip — @{rejectDialog?.username}</DialogTitle>
                        <DialogDescription>
                            The user will receive an in-app notification. Provide an optional reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5 py-2">
                        <Label>Reason (optional)</Label>
                        <Input
                            placeholder="e.g. Image unclear or unreadable"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectDialog && actionMutation.mutate(
                                { id: rejectDialog.slipId, action: 'reject', rejectionMessage: rejectReason || undefined },
                                {
                                    onSuccess: () => {
                                        toast({ title: `Rejected @${rejectDialog.username}'s slip` });
                                        setRejectDialog(null);
                                    }
                                }
                            )}
                            disabled={actionMutation.isPending}
                        >
                            {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                            Reject Slip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Featured Wall ─────────────────────────────────────────────────────────────

function FeaturedWall() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: featured = [], isLoading } = useQuery<Slip[]>({
        queryKey: ['/api/admin/slips/featured'],
        queryFn: () => apiFetch('/api/admin/slips/featured').then(r => r.json()),
    });

    const unfeatureMutation = useMutation({
        mutationFn: (id: string) =>
            apiFetch(`/api/admin/slips/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'unfeature' }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/slips/featured'] });
            toast({ title: 'Slip removed from wall' });
        },
        onError: () => toast({ title: 'Failed to unfeature slip', variant: 'destructive' }),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    Featured Slip Wall
                    <Badge variant="secondary">{featured.length} featured</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : featured.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No featured slips — go to Slip Queue to feature some</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {featured.map(slip => (
                            <div key={slip.id} className="border rounded-lg overflow-hidden bg-muted/10">
                                <div className="aspect-[4/3] bg-muted relative">
                                    <img src={slip.imageUrl} alt="Featured slip" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2">
                                        <Badge className="bg-yellow-500 text-black text-xs">FEATURED</Badge>
                                    </div>
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="font-medium text-sm">@{slip.username}</p>
                                    {slip.caption && <p className="text-xs text-muted-foreground italic">{slip.caption}</p>}
                                    {slip.featuredAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Featured {formatDistanceToNow(new Date(slip.featuredAt), { addSuffix: true })}
                                        </p>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-muted-foreground hover:text-destructive mt-1"
                                        disabled={unfeatureMutation.isPending}
                                        onClick={() => unfeatureMutation.mutate(slip.id)}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Remove from Wall
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Moderation Panel (Mutes & Bans) ───────────────────────────────────────────

function ModerationPanel() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [muteUserId, setMuteUserId] = useState('');
    const [muteReason, setMuteReason] = useState('');
    const [muteDurationValue, setMuteDurationValue] = useState('');
    const [muteDurationUnit, setMuteDurationUnit] = useState<DurationUnit>('hours');

    const [banUserId, setBanUserId] = useState('');
    const [banReason, setBanReason] = useState('');
    const [banDurationValue, setBanDurationValue] = useState('');
    const [banDurationUnit, setBanDurationUnit] = useState<DurationUnit>('permanent');

    const { data: mutes = [], isLoading: mutesLoading } = useQuery<MuteRecord[]>({
        queryKey: ['/api/admin/chat/mutes'],
        queryFn: () => apiFetch('/api/admin/chat/mutes').then(r => r.json()),
    });

    const { data: bans = [], isLoading: bansLoading } = useQuery<BanRecord[]>({
        queryKey: ['/api/admin/chat/bans'],
        queryFn: () => apiFetch('/api/admin/chat/bans').then(r => r.json()),
    });

    const muteMutation = useMutation({
        mutationFn: (body: object) => apiFetch('/api/admin/chat/mute', { method: 'POST', body: JSON.stringify(body) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/mutes'] });
            setMuteUserId(''); setMuteReason(''); setMuteDurationValue(''); setMuteDurationUnit('hours');
            toast({ title: 'User muted' });
        },
        onError: () => toast({ title: 'Failed to mute user', variant: 'destructive' }),
    });

    const unmuteM = useMutation({
        mutationFn: (id: string) => apiFetch(`/api/admin/chat/mutes/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/mutes'] });
            toast({ title: 'Mute removed' });
        },
        onError: () => toast({ title: 'Failed to remove mute', variant: 'destructive' }),
    });

    const banMutation = useMutation({
        mutationFn: (body: object) => apiFetch('/api/admin/chat/ban', { method: 'POST', body: JSON.stringify(body) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/bans'] });
            setBanUserId(''); setBanReason(''); setBanDurationValue(''); setBanDurationUnit('permanent');
            toast({ title: 'User banned from chat' });
        },
        onError: () => toast({ title: 'Failed to ban user', variant: 'destructive' }),
    });

    const unbanM = useMutation({
        mutationFn: (id: string) => apiFetch(`/api/admin/chat/bans/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/bans'] });
            toast({ title: 'Ban removed' });
        },
        onError: () => toast({ title: 'Failed to remove ban', variant: 'destructive' }),
    });

    const handleMute = () => {
        if (!muteUserId.trim()) return;
        const durationHours = durationToHours(muteDurationValue, muteDurationUnit);
        muteMutation.mutate({ userId: muteUserId.trim(), reason: muteReason || undefined, durationHours });
    };

    const handleBan = () => {
        if (!banUserId.trim()) return;
        const durationHours = durationToHours(banDurationValue, banDurationUnit);
        banMutation.mutate({ userId: banUserId.trim(), reason: banReason || undefined, durationHours });
    };

    return (
        <div className="space-y-6">
            {/* Mutes */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <VolumeX className="h-4 w-4" />
                        Mutes
                        <Badge variant="secondary">{mutes.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-end border rounded-lg p-3 bg-muted/10">
                        <UserSearchField
                            label="Search user"
                            value={muteUserId}
                            onChange={setMuteUserId}
                        />
                        <div className="space-y-1">
                            <Label className="text-xs">Reason</Label>
                            <Input
                                placeholder="Optional"
                                value={muteReason}
                                onChange={e => setMuteReason(e.target.value)}
                                className="w-40 h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Duration</Label>
                            <DurationPicker
                                value={muteDurationValue}
                                unit={muteDurationUnit}
                                onValueChange={setMuteDurationValue}
                                onUnitChange={setMuteDurationUnit}
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleMute}
                            disabled={muteMutation.isPending || !muteUserId.trim()}
                        >
                            {muteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Mute'}
                        </Button>
                    </div>

                    {mutesLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : mutes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">No active mutes</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mutes.map(m => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-sm font-medium">{m.username}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{m.reason ?? '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{formatExpiry(m.expiresAt)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                title="Remove mute"
                                                onClick={() => unmuteM.mutate(m.id)}
                                                disabled={unmuteM.isPending}
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Bans */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Chat Bans
                        <Badge variant="secondary">{bans.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-end border rounded-lg p-3 bg-muted/10">
                        <UserSearchField
                            label="Search user"
                            value={banUserId}
                            onChange={setBanUserId}
                        />
                        <div className="space-y-1">
                            <Label className="text-xs">Reason</Label>
                            <Input
                                placeholder="Optional"
                                value={banReason}
                                onChange={e => setBanReason(e.target.value)}
                                className="w-40 h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Duration</Label>
                            <DurationPicker
                                value={banDurationValue}
                                unit={banDurationUnit}
                                onValueChange={setBanDurationValue}
                                onUnitChange={setBanDurationUnit}
                            />
                        </div>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBan}
                            disabled={banMutation.isPending || !banUserId.trim()}
                        >
                            {banMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ban'}
                        </Button>
                    </div>

                    {bansLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : bans.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">No active bans</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bans.map(b => (
                                    <TableRow key={b.id}>
                                        <TableCell className="text-sm font-medium">{b.username}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{b.reason ?? '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{formatExpiry(b.expiresAt)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                title="Remove ban"
                                                onClick={() => unbanM.mutate(b.id)}
                                                disabled={unbanM.isPending}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Activity Log ──────────────────────────────────────────────────────────────

function ActivityLogPanel() {
    const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
        queryKey: ['/api/admin/chat/activity'],
        queryFn: () => apiFetch('/api/admin/chat/activity').then(r => r.json()),
        refetchInterval: 30000,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Moderation Activity Log
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : logs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No activity logged yet</p>
                ) : (
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>When</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm font-medium">{log.adminUsername}</TableCell>
                                        <TableCell>
                                            <Badge variant={actionBadgeVariant(log.action)} className="text-xs">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                                            {log.targetId}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminChatManagement() {
    const [activeTab, setActiveTab] = useState<TabKey>('control');

    const { data: pending = [] } = useQuery<Slip[]>({
        queryKey: ['/api/admin/slips/pending'],
        queryFn: () => apiFetch('/api/admin/slips/pending').then(r => r.json()),
        refetchInterval: 30000,
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Chat & Slip Management</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Control chat settings, moderate messages, manage the slip wall, and handle mutes and bans.
                </p>
            </div>

            <div className="flex flex-wrap gap-0 border-b">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isPending = tab.key === 'slips' && pending.length > 0;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                                ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                            {isPending && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                                    {pending.length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div>
                {activeTab === 'control' && <ChatControlPanel />}
                {activeTab === 'messages' && <MessageFeed />}
                {activeTab === 'slips' && <SlipQueue />}
                {activeTab === 'wall' && <FeaturedWall />}
                {activeTab === 'moderation' && <ModerationPanel />}
                {activeTab === 'activity' && <ActivityLogPanel />}
            </div>
        </div>
    );
}
