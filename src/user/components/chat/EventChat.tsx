import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface ChatMessage {
    id: string;
    userId: string;
    eventId?: string;
    message: string;
    createdAt: string;
    user?: {
        username?: string;
        displayName?: string;
        avatarUrl?: string;
    };
    superChat?: {
        tier: 'blue' | 'green' | 'gold' | 'magenta';
        amount: number;
    };
}

const getTierStyles = (tier?: string) => {
    switch (tier) {
        case 'magenta': return 'bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-100 shadow-[0_0_15px_rgba(192,38,211,0.2)]';
        case 'gold': return 'bg-amber-500/20 border-amber-400/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
        case 'green': return 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
        case 'blue': return 'bg-blue-500/20 border-blue-400/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
        default: return 'bg-transparent';
    }
};

interface EventChatProps {
    eventId?: string;
}

export const EventChat: React.FC<EventChatProps> = ({ eventId }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch messages with polling (every 5 seconds) - CHAT ONLY: This is necessary for near real-time conversation
    const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
        queryKey: ['/api/chat', eventId],
        queryFn: async () => {
            const url = eventId ? `/api/chat?event_id=${eventId}` : '/api/chat';
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        refetchInterval: 5000, // Poll every 5 seconds - acceptable for chat UX
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message, eventId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to send message');
            }
            return res.json();
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['/api/chat', eventId] });
        },
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            sendMutation.mutate(newMessage.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-card rounded-lg border border-border">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                    {eventId ? 'Event Chat' : 'General Chat'}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                    {messages.length} messages
                </span>
            </div>

            {/* Pinned Super Chats Area */}
            {messages.some(m => m.superChat) && (
                <div className="flex flex-col gap-2 p-2 max-h-[120px] overflow-y-auto border-b border-border bg-background/50 backdrop-blur-sm z-10 transition-all duration-500">
                    {messages.filter(m => m.superChat).slice(0, 3).map(msg => (
                        <div key={`pinned-${msg.id}`} className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium animate-in slide-in-from-top-2 fade-in duration-300 ${getTierStyles(msg.superChat?.tier)}`}>
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background/50 flex items-center justify-center">
                                ★
                            </div>
                            <div className="flex-1 min-w-0 truncate">
                                <span className="opacity-80 font-bold mr-1">${msg.superChat?.amount.toFixed(2)}</span>
                                <span className="opacity-90">{msg.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                        <p>No messages yet</p>
                        <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSuperChat = !!msg.superChat;
                        return (
                            <div key={msg.id} className={`flex gap-3 p-2 rounded-lg transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in ${isSuperChat ? `border ${getTierStyles(msg.superChat?.tier)}` : ''}`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isSuperChat ? 'bg-background/40' : 'bg-primary/20'}`}>
                                    {(msg.user?.displayName || msg.user?.username || 'U')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-medium text-sm">
                                            {msg.user?.displayName || msg.user?.username || 'Anonymous'}
                                        </span>
                                        {isSuperChat && (
                                            <span className="text-xs font-bold opacity-90 px-1.5 py-0.5 rounded bg-background/30">
                                                ★ ${msg.superChat?.amount.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-xs opacity-60 ml-auto">
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-90 break-words mt-1 leading-relaxed">
                                        {msg.message}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border">
                {error && (
                    <p className="text-xs text-red-400 mb-2">
                        Failed to load messages. Using cached data.
                    </p>
                )}
                {sendMutation.error && (
                    <p className="text-xs text-red-400 mb-2">
                        {(sendMutation.error as Error).message || 'Failed to send message'}
                    </p>
                )}
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sendMutation.isPending}
                        data-testid="chat-input"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        size="icon"
                        data-testid="chat-send"
                    >
                        {sendMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
