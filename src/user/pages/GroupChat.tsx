import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';

interface GroupMember {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
}

interface ChatMessage {
    id: string;
    groupId: string;
    userId: string;
    content: string;
    createdAt: string;
    username?: string;
}

export const GroupChat: React.FC<{ groupId: string; members: GroupMember[] }> = ({ groupId, members }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat messages with auto-refresh (polling every 3 seconds)
    const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
        queryKey: ['/api/groups', groupId, 'chat'],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/groups/${groupId}/chat`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch chat');
                return res.json();
            } catch (error) {
                console.error('Failed to fetch chat messages:', error);
                return [];
            }
        },
        refetchInterval: 3000, // Poll every 3 seconds
        retry: 2,
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(`/api/groups/${groupId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },
        onSuccess: () => {
            // Optimistic update - refetch will handle the rest
            queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'chat'] });
            setNewMessage('');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Send',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading || sendMessageMutation.isPending) return;

        setIsLoading(true);
        await sendMessageMutation.mutateAsync(newMessage);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[600px] bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            {/* Messages */}
            {isMessagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#E8A020]" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
                            <p className="text-sm text-white/40">No messages yet</p>
                            <p className="text-[10px] text-white/30 mt-1">Start the conversation about picks and fights!</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isOwn = message.userId === (window as any).currentUser?.id;
                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        isOwn ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8A020]/20 to-transparent flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-[#E8A020]">
                                            {(message.username || 'U').slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "max-w-[70%] rounded-lg px-3 py-2",
                                        isOwn ? "bg-[#E8A020]/20 border border-[#E8A020]/30" : "bg-white/5 border border-white/10"
                                    )}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] uppercase tracking-widest text-white/60">
                                                {message.username || 'Anonymous'}
                                            </span>
                                            <span className="text-[8px] text-white/30">
                                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white">{message.content}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-[#0a0a0a]">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share your picks or fight thoughts..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#E8A020]/50 placeholder:text-white/30"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim() || sendMessageMutation.isPending}
                        className="gold-btn px-6 py-3 text-xs uppercase font-black tracking-widest button-press-scale disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sendMessageMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                SENDING...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                SEND
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
