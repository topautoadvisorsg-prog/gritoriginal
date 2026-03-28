import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
    MessageSquare, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SuggestedQuestion {
    id: string;
    question: string;
    sortOrder: number;
    isActive: boolean;
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

export const AdminSuggestedQuestions: React.FC = () => {
    const queryClient = useQueryClient();
    const [newQuestion, setNewQuestion] = useState('');

    const { data: questions = [], isLoading } = useQuery<SuggestedQuestion[]>({
        queryKey: ['admin-suggested-questions'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/admin/ai/suggested-questions');
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (question: string) => {
            const maxSort = questions.length > 0 ? Math.max(...questions.map(q => q.sortOrder)) : 0;
            const res = await fetchWithAuth('/api/admin/ai/suggested-questions', {
                method: 'POST',
                body: JSON.stringify({ question, sortOrder: maxSort + 1 }),
            });
            if (!res.ok) throw new Error('Failed to create');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-suggested-questions'] });
            setNewQuestion('');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; isActive?: boolean; sortOrder?: number; question?: string }) => {
            const res = await fetchWithAuth(`/api/admin/ai/suggested-questions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-suggested-questions'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetchWithAuth(`/api/admin/ai/suggested-questions/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-suggested-questions'] });
        },
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        createMutation.mutate(newQuestion.trim());
    };

    const handleSwapOrder = (index: number, direction: 'up' | 'down') => {
        const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= sorted.length) return;

        const current = sorted[index];
        const target = sorted[targetIdx];

        updateMutation.mutate({ id: current.id, sortOrder: target.sortOrder });
        updateMutation.mutate({ id: target.id, sortOrder: current.sortOrder });
    };

    const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Suggested Questions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Manage the suggested question chips shown in the AI Fight Analyst chat. Active questions appear for all fights.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Enter a new suggested question..."
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={!newQuestion.trim() || createMutation.isPending}
                            size="sm"
                            className="gap-1"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Add
                        </Button>
                    </form>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No suggested questions yet. Add one above.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {sorted.map((q, idx) => (
                                <div
                                    key={q.id}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                        q.isActive
                                            ? 'bg-muted/30 border-border'
                                            : 'bg-muted/10 border-border/50 opacity-60'
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => handleSwapOrder(idx, 'up')}
                                            disabled={idx === 0 || updateMutation.isPending}
                                            className="p-0.5 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSwapOrder(idx, 'down')}
                                            disabled={idx === sorted.length - 1 || updateMutation.isPending}
                                            className="p-0.5 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                    </div>

                                    <span className="text-xs text-muted-foreground font-mono w-6 text-center">
                                        {q.sortOrder}
                                    </span>

                                    <p className="flex-1 text-sm text-foreground">{q.question}</p>

                                    <button
                                        type="button"
                                        onClick={() => updateMutation.mutate({ id: q.id, isActive: !q.isActive })}
                                        disabled={updateMutation.isPending}
                                        className="p-1 hover:text-primary transition-colors"
                                        title={q.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {q.isActive ? (
                                            <ToggleRight className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Delete this question?')) {
                                                deleteMutation.mutate(q.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="p-1 hover:text-destructive transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
