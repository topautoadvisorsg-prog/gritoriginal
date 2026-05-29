import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
    Zap, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Edit2, Check, X
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface IntelFeedItem {
    id: string;
    content: string;
    emoji: string;
    isActive: boolean;
    sortOrder: number;
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

export const AdminIntelFeed: React.FC = () => {
    const queryClient = useQueryClient();
    const [newContent, setNewContent] = useState('');
    const [newEmoji, setNewEmoji] = useState('⚡');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editEmoji, setEditEmoji] = useState('');

    const { data: items = [], isLoading } = useQuery<IntelFeedItem[]>({
        queryKey: ['admin-intel-feed'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/admin/intel-feed');
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async ({ content, emoji }: { content: string; emoji: string }) => {
            const maxSort = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) : 0;
            const res = await fetchWithAuth('/api/admin/intel-feed', {
                method: 'POST',
                body: JSON.stringify({ content, emoji, sortOrder: maxSort + 1 }),
            });
            if (!res.ok) throw new Error('Failed to create');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-intel-feed'] });
            setNewContent('');
            setNewEmoji('⚡');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; isActive?: boolean; sortOrder?: number; content?: string; emoji?: string }) => {
            const res = await fetchWithAuth(`/api/admin/intel-feed/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-intel-feed'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetchWithAuth(`/api/admin/intel-feed/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-intel-feed'] });
        },
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) return;
        createMutation.mutate({ content: newContent.trim(), emoji: newEmoji.trim() || '⚡' });
    };

    const handleSwapOrder = (index: number, direction: 'up' | 'down') => {
        const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= sorted.length) return;
        const current = sorted[index];
        const target = sorted[targetIdx];
        updateMutation.mutate({ id: current.id, sortOrder: target.sortOrder });
        updateMutation.mutate({ id: target.id, sortOrder: current.sortOrder });
    };

    const startEdit = (item: IntelFeedItem) => {
        setEditingId(item.id);
        setEditContent(item.content);
        setEditEmoji(item.emoji);
    };

    const confirmEdit = (id: string) => {
        if (!editContent.trim()) return;
        updateMutation.mutate({ id, content: editContent.trim(), emoji: editEmoji.trim() || '⚡' });
        setEditingId(null);
    };

    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

    const EMOJI_OPTIONS = ['⚡', '🏕️', '📊', '📉', '📈', '🔴', '🧠', '🏆', '🎯', '💥', '🔥', '⚠️'];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Zap className="h-5 w-5 text-primary" />
                        Intel Feed Manager
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Manage the live intel ticker on the landing page. Active items scroll in real time for all visitors.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleAdd} className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                            {EMOJI_OPTIONS.map((em) => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => setNewEmoji(em)}
                                    className={cn(
                                        'text-lg px-2 py-1 rounded-md border transition-colors',
                                        newEmoji === em
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-muted/20 hover:bg-muted/50'
                                    )}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Type an intel signal to publish to the ticker..."
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={!newContent.trim() || createMutation.isPending}
                                size="sm"
                                className="gap-1 whitespace-nowrap"
                            >
                                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Publish
                            </Button>
                        </div>
                    </form>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No intel feed items yet. Add one above and it will appear on the landing page immediately.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {sorted.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                        item.isActive
                                            ? 'bg-muted/30 border-border'
                                            : 'bg-muted/10 border-border/50 opacity-50'
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <button type="button" onClick={() => handleSwapOrder(idx, 'up')} disabled={idx === 0 || updateMutation.isPending} className="p-0.5 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed">
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button type="button" onClick={() => handleSwapOrder(idx, 'down')} disabled={idx === sorted.length - 1 || updateMutation.isPending} className="p-0.5 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed">
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                    </div>

                                    {editingId === item.id ? (
                                        <>
                                            <div className="flex gap-1 flex-wrap">
                                                {EMOJI_OPTIONS.map((em) => (
                                                    <button key={em} type="button" onClick={() => setEditEmoji(em)} className={cn('text-base px-1 rounded border', editEmoji === em ? 'border-primary bg-primary/10' : 'border-border bg-transparent')}>
                                                        {em}
                                                    </button>
                                                ))}
                                            </div>
                                            <Input
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="flex-1"
                                                autoFocus
                                                onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                                            />
                                            <button type="button" onClick={() => confirmEdit(item.id)} aria-label="Save" className="p-1 text-green-500 hover:text-green-400">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel edit" className="p-1 text-muted-foreground hover:text-foreground">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl shrink-0">{item.emoji}</span>
                                            <p className="flex-1 text-sm text-foreground">{item.content}</p>
                                            <button type="button" onClick={() => startEdit(item)} className="p-1 hover:text-primary transition-colors" title="Edit">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button type="button" onClick={() => updateMutation.mutate({ id: item.id, isActive: !item.isActive })} disabled={updateMutation.isPending} className="p-1 hover:text-primary transition-colors" title={item.isActive ? 'Deactivate' : 'Activate'}>
                                                {item.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                            </button>
                                            <button type="button" onClick={() => { if (window.confirm('Delete this intel item?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending} className="p-1 hover:text-destructive transition-colors" title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
