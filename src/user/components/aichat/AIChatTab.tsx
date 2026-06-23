import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import {
    Send, Loader2, Bot, User, Trash2, Sparkles, AlertCircle, Lock, Swords
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface AiChatMessage {
    id: string;
    userId: string;
    role: 'user' | 'assistant';
    message: string;
    context: any;
    createdAt: string;
}

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        const timer = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, 10);
        return () => clearInterval(timer);
    }, [text]);
    return <p className="whitespace-pre-wrap leading-relaxed">{displayedText}</p>;
}

export interface FightChatContext {
    fighter1Name: string;
    fighter2Name: string;
    fightId?: string;
}

export interface AIChatTabProps {
    fighterIds?: string[];
    fightContext?: FightChatContext;
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

export const AIChatTab: React.FC<AIChatTabProps> = ({ fighterIds, fightContext }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isPremium = (user as any)?.tier === 'premium' || (user as any)?.role === 'admin';

    const isFightContext = !!fightContext;

    // Local messages for fight-context mode (ephemeral — fresh per visit)
    const [localMessages, setLocalMessages] = useState<AiChatMessage[]>([]);

    // Global history for general mode only
    const { data: historyMessages = [], isLoading } = useQuery<AiChatMessage[]>({
        queryKey: ['/api/ai/chat/history'],
        enabled: isPremium && !isFightContext,
    });

    const displayMessages = isFightContext ? localMessages : historyMessages;

    const [isStreaming, setIsStreaming] = useState(false);

    // Suggested questions for fight-context mode
    const { data: suggestedQuestionsData } = useQuery<{ questions: string[] }>({
        queryKey: ['/api/ai/fight', fightContext?.fightId, 'suggested-questions'],
        queryFn: () =>
            fetchWithAuth(`/api/ai/fight/${fightContext!.fightId}/suggested-questions`).then(r => r.json()),
        enabled: isPremium && isFightContext && !!fightContext?.fightId,
        staleTime: 0, // Always refetch for accuracy - AI context can change
    });
    const suggestedQuestions = suggestedQuestionsData?.questions ?? [];

    // Track chat open on mount (fight-context only)
    useEffect(() => {
        if (isFightContext && fightContext?.fightId && user) {
            fetchWithAuth(`/api/ai/fight/${fightContext.fightId}/open`, { method: 'POST' }).catch(() => {});
        }
    }, [isFightContext, fightContext?.fightId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }, [displayMessages, isStreaming]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isStreaming || !user || !isPremium) return;

        const userMessageText = text.trim();
        setInput('');
        setIsStreaming(true);

        const userId = (user as any).id;

        const newUserMessage: AiChatMessage = {
            id: `temp-user-${Date.now()}`,
            userId,
            role: 'user',
            message: userMessageText,
            context: null,
            createdAt: new Date().toISOString(),
        };

        const tempAiMessage: AiChatMessage = {
            id: `temp-ai-${Date.now()}`,
            userId,
            role: 'assistant',
            message: '',
            context: null,
            createdAt: new Date().toISOString(),
        };

        if (isFightContext) {
            setLocalMessages(prev => [...prev, newUserMessage, tempAiMessage]);
        } else {
            queryClient.setQueryData(['/api/ai/chat/history'], (old: AiChatMessage[] = []) => [
                ...(old || []),
                newUserMessage,
                tempAiMessage,
            ]);
        }

        const requestContext = isFightContext
            ? { fighterIds, fightId: fightContext?.fightId, isFightContext: true }
            : undefined;

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageText, context: requestContext }),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to start stream');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    accumulatedResponse += parsed.content;

                                    if (isFightContext) {
                                        setLocalMessages(prev =>
                                            prev.map(m =>
                                                m.id === tempAiMessage.id
                                                    ? { ...m, message: accumulatedResponse }
                                                    : m
                                            )
                                        );
                                    } else {
                                        queryClient.setQueryData(
                                            ['/api/ai/chat/history'],
                                            (old: AiChatMessage[] = []) =>
                                                old.map(m =>
                                                    m.id === tempAiMessage.id
                                                        ? { ...m, message: accumulatedResponse }
                                                        : m
                                                )
                                        );
                                    }
                                } else if (parsed.error) {
                                    throw new Error(parsed.error);
                                }
                            } catch (e) {
                                console.error('Error parsing SSE data:', e);
                            }
                        }
                    }
                }
            }

            if (!isFightContext) {
                queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
            }
        } catch (error: any) {
            console.error('Streaming error:', error);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    const handleSuggestedQuestion = async (q: string) => {
        if (isStreaming) return;
        await sendMessage(q);
    };

    const clearMutation = useMutation({
        mutationFn: async () => {
            if (isFightContext) {
                setLocalMessages([]);
                return;
            }
            const response = await fetchWithAuth('/api/ai/chat/history', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear history');
        },
        onSuccess: () => {
            if (!isFightContext) {
                queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
            }
        },
    });

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
                <p className="text-muted-foreground">Please sign in to access AI Chat.</p>
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                    <div className="relative p-6 bg-card border border-border rounded-2xl">
                        <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-display tracking-wide text-foreground uppercase mb-2">
                    Premium Feature
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                    AI Fight Analyst is available for Premium members. Upgrade to unlock fight-specific AI analysis.
                </p>
            </div>
        );
    }

    const chatHeight = isFightContext
        ? 'h-[520px]'
        : 'h-[calc(100vh-8rem)] max-h-[700px]';

    const emptyStateText = isFightContext
        ? `Ask me anything about ${fightContext!.fighter1Name} vs ${fightContext!.fighter2Name} — styles, stats, predictions, keys to victory.`
        : 'Ask about fighters, compare stats, get predictions, or discuss fight strategy.';

    const inputPlaceholder = isFightContext
        ? `Analyze ${fightContext!.fighter1Name} vs ${fightContext!.fighter2Name}...`
        : 'Ask about fighters, stats, predictions...';

    const showSuggestedQuestions = isFightContext && displayMessages.length === 0 && suggestedQuestions.length > 0 && !isStreaming;

    return (
        <div className={cn('flex flex-col bg-card rounded-xl border border-border overflow-hidden', chatHeight)}>
            {/* Header */}
            <div className="flex flex-col border-b border-border bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">
                            {isFightContext ? 'Fight Analyst AI' : 'MMA Analysis AI'}
                        </h3>
                        {!isFightContext && (
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                • Ask about fighters, stats &amp; predictions
                            </span>
                        )}
                    </div>
                    {displayMessages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearMutation.mutate()}
                            disabled={clearMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            title="Clear Chat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Context indicator */}
                <div className="px-4 py-1.5 bg-primary/5 border-t border-primary/10 flex items-center gap-2">
                    {isFightContext ? (
                        <>
                            <Swords className="h-3 w-3 text-primary" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                                Focused on: {fightContext!.fighter1Name} vs {fightContext!.fighter2Name}
                            </span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                                Context: Global Fight Database Connected
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {isLoading && !isFightContext ? (
                    <div className="flex flex-col gap-4 py-4 w-full">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse border border-primary/20" />
                            <div className="h-16 w-[70%] bg-muted rounded-xl animate-pulse" />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <div className="h-10 w-[40%] bg-primary/20 rounded-xl animate-pulse" />
                        </div>
                    </div>
                ) : displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-start pt-6 text-center">
                        {isFightContext ? (
                            <Swords className="h-10 w-10 text-primary/50 mb-3" />
                        ) : (
                            <Bot className="h-10 w-10 text-primary/50 mb-3" />
                        )}
                        <p className="text-sm text-muted-foreground mb-1">
                            {isFightContext ? 'Your fight analyst is ready' : 'No messages yet'}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mb-4">{emptyStateText}</p>
                        {/* Suggested question chips */}
                        {showSuggestedQuestions && (
                            <div className="w-full mt-2">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">
                                    Suggested questions
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {suggestedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSuggestedQuestion(q)}
                                            disabled={isStreaming}
                                            className="text-[11px] font-bold uppercase tracking-wider bg-[#111111] hover:bg-[#E8A020]/10 hover:border-[#E8A020]/50 border border-white/10 rounded-full px-4 py-2 text-white/70 hover:text-[#E8A020] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-[0_0_15px_rgba(232,160,32,0.15)]"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    displayMessages.map((msg) => {
                        const isTempAiMessage = isStreaming && msg.id.startsWith('temp-ai-');

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex gap-3 animate-fade-in w-full',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Bot className={cn('h-4 w-4 text-primary', isTempAiMessage && 'animate-pulse')} />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'rounded-xl px-4 py-3 text-sm transition-all duration-300',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground max-w-[85%]'
                                            : 'bg-muted border border-border text-foreground w-full max-w-[90%] min-h-[44px]'
                                    )}
                                >
                                    {isTempAiMessage && !msg.message ? (
                                        <div className="flex items-center gap-2 h-full opacity-60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                                        </div>
                                    ) : (
                                        msg.role === 'assistant' ? (
                                            <TypewriterText text={msg.message} />
                                        ) : (
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        )
                                    )}
                                    {!isTempAiMessage && (
                                        <span
                                            className={cn(
                                                'text-[10px] opacity-60 mt-1 block',
                                                msg.role === 'assistant' && 'text-right'
                                            )}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-border p-3 bg-muted/20 flex-shrink-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isStreaming}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!input.trim() || isStreaming}
                        className="px-4"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AIChatTab;
