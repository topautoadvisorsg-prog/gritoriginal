import React, { useState, useRef, useEffect } from 'react';
import { CountryFlag } from '@/shared/components/CountryFlag';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { Send, Loader2, Globe, Flag, Lock, Pin, Instagram, Twitter, Smile, ImageIcon, Trophy, X, MessageCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSocket } from '@/shared/hooks/use-socket';
import { SlipPicker } from './SlipPicker';
import { SlipWall } from './SlipWall';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatType = 'global' | 'country';
type ChatView = 'chat' | 'wall';

type Rank = 'ULTIMATE GOLD' | 'GRANDMASTER' | 'MASTER' | 'SAMURAI' | 'ROOKIE';

interface ChatMessage {
    id: string;
    userId: string;
    eventId: string | null;
    chatType: string;
    countryCode: string | null;
    message: string;
    messageType?: 'text' | 'slip';
    slipId?: string | null;
    slipImageUrl?: string | null;
    createdAt: string;
    isAdmin?: boolean;
    user?: {
        username?: string;
        displayName?: string;
        avatarUrl?: string;
        rank?: Rank;
    };
    superChat?: {
        tier: 'blue' | 'green' | 'gold' | 'magenta';
        amount: number;
    };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GOLD = '#E8A020';

const RANK_CONFIG: Record<Rank, { bg: string; text: string; border: string; msgBg: string; msgBorder: string }> = {
    'ULTIMATE GOLD': {
        bg: '#E8A020',
        text: '#1a0f00',
        border: '#F5C842',
        msgBg: 'rgba(232,160,32,0.08)',
        msgBorder: '#E8A020',
    },
    'GRANDMASTER': {
        bg: '#B8860B',
        text: '#1a0f00',
        border: '#D4A017',
        msgBg: 'rgba(184,134,11,0.06)',
        msgBorder: '#B8860B',
    },
    'MASTER': {
        bg: '#7C3AED',
        text: '#fff',
        border: '#9D5CF5',
        msgBg: 'rgba(124,58,237,0.08)',
        msgBorder: '#7C3AED',
    },
    'SAMURAI': {
        bg: '#C0392B',
        text: '#fff',
        border: '#E74C3C',
        msgBg: 'rgba(192,57,43,0.07)',
        msgBorder: '#C0392B',
    },
    'ROOKIE': {
        bg: '#374151',
        text: '#d1d5db',
        border: '#4B5563',
        msgBg: 'transparent',
        msgBorder: 'transparent',
    },
};

// Emoji sets — basic for Contenders, expanded for Challengers
const BASIC_EMOJIS = ['🔥','💪','🏆','😤','👊','🥊','🎯','💥','😮','🎉','👏','⚡','😂','💯','🤜','🤛'];
const EXPANDED_EMOJIS = [
    ...BASIC_EMOJIS,
    '🌪️','👑','🚀','💫','⭐','🌟','✨','💎','🥷','⚔️','🛡️','🏋️','🥋','🧠','💣','🔱',
    '💰','💸','🍾','🥂','🫡','🤙','🤞','🫶','✊','🤟','🦾','🏅','💀','🤣','🫠','🤯',
];

interface DonorEntry {
    rank?: number;
    username: string;
    amount: number;
    tier: Rank;
    initials: string;
}


// ─── Sub-Components ──────────────────────────────────────────────────────────

const RankBadge: React.FC<{ rank: Rank; small?: boolean }> = ({ rank, small = false }) => {
    const cfg = RANK_CONFIG[rank] ?? RANK_CONFIG['ROOKIE'];
    return (
        <span
            className={cn('inline-block font-black uppercase tracking-wider rounded-sm px-1.5', small ? 'text-[8px] py-0.5' : 'text-[9px] py-0.5')}
            style={{ background: cfg.bg, color: cfg.text }}
        >
            {rank}
        </span>
    );
};

const Avatar: React.FC<{ initials?: string; src?: string; size?: number; rank?: Rank }> = ({ initials = 'U', src, size = 40, rank }) => {
    const cfg = rank ? RANK_CONFIG[rank] : null;
    return (
        <div
            className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-black text-sm"
            style={{
                width: size,
                height: size,
                background: cfg ? cfg.bg : '#1f2937',
                color: cfg ? cfg.text : '#9ca3af',
                border: cfg ? `2px solid ${cfg.border}` : '2px solid #374151',
                boxShadow: cfg && rank !== 'ROOKIE' ? `0 0 10px ${cfg.border}44` : 'none',
            }}
        >
            {src ? <img src={src} alt={initials} className="w-full h-full object-cover" /> : initials[0]}
        </div>
    );
};

const SlipBadge: React.FC = () => (
    <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest"
        style={{ background: GOLD, color: '#1a0f00' }}
    >
        <ImageIcon className="w-2.5 h-2.5" />
        SLIP
    </span>
);

const ProgressBadge: React.FC<{ badge: string }> = ({ badge }) => {
    const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
        ninja:   { bg: 'rgba(6,182,212,0.15)', color: '#06B6D4' },
        samurai: { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
        master:  { bg: 'rgba(124,58,237,0.15)', color: '#7C3AED' },
        goat:    { bg: 'rgba(232,160,32,0.15)', color: GOLD },
    };
    const cfg = BADGE_COLORS[badge] ?? { bg: 'rgba(255,255,255,0.07)', color: '#9CA3AF' };
    return (
        <span
            className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest"
            style={{ background: cfg.bg, color: cfg.color }}
        >
            {badge}
        </span>
    );
};

const ChatMessageRow: React.FC<{ msg: ChatMessage; isOwn: boolean }> = ({ msg, isOwn }) => {
    const rank = (msg.user as any)?.rank as Rank | undefined;
    const cfg = rank ? RANK_CONFIG[rank] : null;
    const isHighlighted = rank && rank !== 'ROOKIE' && rank !== 'SAMURAI';
    const initials = (msg.user?.displayName || msg.user?.username || 'U').substring(0, 2).toUpperCase();
    const name = msg.user?.displayName || msg.user?.username || 'Anonymous';
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const progressBadge = (msg.user as any)?.progressBadge;
    const isSlip = msg.messageType === 'slip';

    if (msg.isAdmin) {
        return (
            <div className="flex gap-3 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 mb-2 animate-slide-up" style={{ animationDuration: '0.4s' }}>
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400">
                    <Pin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400/70">PINNED ADMIN</span>
                        <span className="text-[10px] text-white/30">{time}</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{msg.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex gap-3 p-3 rounded-xl transition-all duration-200 group animate-slide-up',
                isHighlighted && cfg ? 'border-l-2' : ''
            )}
            style={{
                background: isHighlighted && cfg ? cfg.msgBg : 'transparent',
                borderLeftColor: isHighlighted && cfg ? cfg.msgBorder : 'transparent',
                animationDuration: '0.4s'
            }}
        >
            <Avatar initials={initials} src={msg.user?.avatarUrl} size={38} rank={rank} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-black text-white text-sm">{name}</span>
                    {msg.countryCode && (
                        <CountryFlag country={msg.countryCode} className="text-xs" />
                    )}
                    {rank && <RankBadge rank={rank} small />}
                    {progressBadge && progressBadge !== 'none' && <ProgressBadge badge={progressBadge} />}
                    {isSlip && <SlipBadge />}
                    <span className="text-[10px] text-white/30 ml-auto flex-shrink-0">{time}</span>
                </div>
                {msg.message && (
                    <p className="text-sm text-white/80 leading-relaxed break-words mb-2">{msg.message}</p>
                )}
                {isSlip && msg.slipImageUrl && (
                    <div className="mt-1 rounded-lg overflow-hidden border max-w-xs" style={{ borderColor: `${GOLD}33` }}>
                        <img
                            src={msg.slipImageUrl}
                            alt="Shared betting slip"
                            loading="lazy"
                            className="w-full object-contain max-h-64"
                            style={{ background: '#111' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const EmojiPicker: React.FC<{ isChallenger: boolean; onSelect: (emoji: string) => void; onClose: () => void }> = ({ isChallenger, onSelect, onClose }) => {
    const emojis = isChallenger ? EXPANDED_EMOJIS : BASIC_EMOJIS;
    return (
        <div
            className="absolute bottom-full left-0 mb-2 z-50 rounded-xl border p-3"
            style={{ background: 'rgba(10,10,10,0.97)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', minWidth: 240 }}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    {isChallenger ? 'Expanded Emoji Library' : 'Standard Emojis'}
                </span>
                <button onClick={onClose} aria-label="Close" className="text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
                {emojis.map((e, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(e)}
                        className="text-lg rounded-md hover:bg-white/10 transition-colors flex items-center justify-center"
                        style={{ height: 32, width: 32 }}
                    >
                        {e}
                    </button>
                ))}
            </div>
            {!isChallenger && (
                <div className="mt-2 pt-2 border-t flex items-center gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <Lock className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/30">Upgrade to Challenger for expanded emoji library</span>
                </div>
            )}
        </div>
    );
};

// ─── Right Panel ─────────────────────────────────────────────────────────────

const TopDonorCard: React.FC<{ donor: DonorEntry; isFirst?: boolean }> = ({ donor, isFirst }) => {
    const cfg = RANK_CONFIG[donor.tier];
    return (
        <div
            className={cn('rounded-xl p-4 border flex flex-col items-center text-center', isFirst ? 'mb-3' : 'flex-1')}
            style={{
                background: isFirst ? 'rgba(232,160,32,0.08)' : 'rgba(255,255,255,0.02)',
                borderColor: isFirst ? 'rgba(232,160,32,0.3)' : 'rgba(255,255,255,0.05)',
            }}
        >
            {isFirst && (
                <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: GOLD }}>
                    #1 TOP DONOR
                </span>
            )}
            {!isFirst && (
                <span className="text-[9px] font-black uppercase tracking-widest mb-2 text-white/40">
                    #{donor.rank}
                </span>
            )}
            <Avatar initials={donor.initials} rank={donor.tier} size={isFirst ? 48 : 36} />
            <span className={cn('font-black text-white mt-2', isFirst ? 'text-base' : 'text-sm')}>{donor.username}</span>
            {isFirst && (
                <div className="flex items-center gap-2 mt-1 mb-2">
                    <Instagram className="w-3 h-3 text-white/30" />
                    <Twitter className="w-3 h-3 text-white/30" />
                </div>
            )}
            <span className="font-black mt-1" style={{ color: GOLD, fontSize: isFirst ? '1.5rem' : '1rem' }}>
                ${donor.amount.toLocaleString()}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-white/30 block mt-0.5">DONATED</span>
        </div>
    );
};

const RecentDonationRow: React.FC<{ donor: DonorEntry; index: number }> = ({ donor, index }) => (
    <div
        className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg"
        style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
    >
        <Avatar initials={donor.initials} rank={donor.tier} size={30} />
        <div className="flex-1 min-w-0">
            <span className="font-bold text-white text-xs block truncate">{donor.username}</span>
            <RankBadge rank={donor.tier} small />
        </div>
        <span className="font-black text-sm flex-shrink-0" style={{ color: GOLD }}>${donor.amount.toLocaleString()}</span>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: { ...options.headers, 'Content-Type': 'application/json' },
    });
}

export const ChatHub: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeChatType, setActiveChatType] = useState<ChatType>('global');
    const [chatView, setChatView] = useState<ChatView>('chat');
    const [input, setInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSlipPicker, setShowSlipPicker] = useState(false);
    const [slipCooldownMsg, setSlipCooldownMsg] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const userCountry = (user as any)?.country;

    // Tier check: Challenger = premium tier or active subscription
    const isChallenger = (user as any)?.tier === 'premium' || (user as any)?.subscriptionStatus === 'active';

    // Chat config: open/closed state and cooldown minutes
    const { data: chatConfig } = useQuery({
        queryKey: ['/api/chat/config'],
        queryFn: () => fetch('/api/chat/config').then(r => r.json()),
        staleTime: 0, // Always refetch - admin can toggle chat open/closed
    });
    const isChatOpen = chatConfig?.isOpen ?? true;

    const queryUrl = activeChatType === 'country' && userCountry
        ? `/api/chat?chat_type=country&country_code=${encodeURIComponent(userCountry)}`
        : `/api/chat?chat_type=global`;

    const queryKey = [`/api/chat`, activeChatType, userCountry];

    const { data: apiMessages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey,
        queryFn: () => fetch(queryUrl).then(r => r.json()),
        enabled: chatView === 'chat',
    });

    const messages = apiMessages;

    // Donations are not yet wired to a backend feed — render empty until the
    // donations API lands. No mock/seed data is shown to users.
    const topDonors: DonorEntry[] = [];
    const recentDonations: DonorEntry[] = [];

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;
        if (activeChatType === 'country' && userCountry) socket.emit('join_country_chat', userCountry);

        const handleNewMessage = (newMessage: ChatMessage) => {
            const isMatch = (activeChatType === 'global' && newMessage.chatType === 'global') ||
                (activeChatType === 'country' && newMessage.chatType === 'country' && newMessage.countryCode === userCountry);
            if (isMatch) {
                queryClient.setQueryData(queryKey, (old: ChatMessage[] = []) => {
                    if (old.find(m => m.id === newMessage.id)) return old;
                    return [newMessage, ...old];
                });
            }
        };

        socket.on('new_message', handleNewMessage);
        return () => {
            if (activeChatType === 'country' && userCountry) socket.emit('leave_room', `country_${userCountry}`);
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, activeChatType, userCountry, queryClient, queryKey]);

    const sendMutation = useMutation({
        mutationFn: async ({ message, messageType, slipId }: { message: string; messageType?: string; slipId?: string }) => {
            const body: any = { message, chatType: activeChatType };
            if (activeChatType === 'country') body.countryCode = userCountry;
            if (messageType) body.messageType = messageType;
            if (slipId) body.slipId = slipId;
            const response = await fetchWithAuth('/api/chat', { method: 'POST', body: JSON.stringify(body) });
            if (!response.ok) {
                const err = await response.json();
                const error: any = new Error(err.error || 'Failed to send message');
                error.remainingMinutes = err.remainingMinutes;
                throw error;
            }
            return response.json();
        },
        onSuccess: (_, vars) => {
            if (!vars.messageType || vars.messageType === 'text') setInput('');
            setShowSlipPicker(false);
            setSlipCooldownMsg(undefined);
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (err: any) => {
            if (err.remainingMinutes) {
                const mins = err.remainingMinutes;
                setSlipCooldownMsg(`You can share another slip in ${mins} minute${mins > 1 ? 's' : ''}`);
                setShowSlipPicker(true);
            }
        },
    });

    useEffect(() => {
        if (chatView === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, chatView]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sendMutation.isPending || !user) return;
        sendMutation.mutate({ message: input.trim() });
    };

    const handleSlipPost = (slipId: string) => {
        if (!user) return;
        setShowSlipPicker(false);
        setSlipCooldownMsg(undefined);
        sendMutation.mutate({ message: '', messageType: 'slip', slipId });
    };

    const handleEmojiSelect = (emoji: string) => {
        setInput(prev => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!socket) return;
        const currentRoom = activeChatType === 'global' ? 'global' : `country_${userCountry}`;
        const handleTyping = (d: { username: string; room: string }) => {
            if (d.room === currentRoom) setTypingUsers(p => p.includes(d.username) ? p : [...p, d.username]);
        };
        const handleStopTyping = (d: { username: string; room: string }) => {
            if (d.room === currentRoom) setTypingUsers(p => p.filter(u => u !== d.username));
        };
        socket.on('user_typing', handleTyping);
        socket.on('user_stop_typing', handleStopTyping);
        return () => { socket.off('user_typing', handleTyping); socket.off('user_stop_typing', handleStopTyping); };
    }, [socket, activeChatType, userCountry]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!socket) return;
        const currentRoom = activeChatType === 'global' ? 'global' : `country_${userCountry}`;
        socket.emit('typing', { room: currentRoom });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { room: currentRoom }), 2000);
    };

    // Close pickers when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-emoji-picker]') && !target.closest('[data-emoji-trigger]')) {
                setShowEmojiPicker(false);
            }
            if (!target.closest('[data-slip-picker]') && !target.closest('[data-slip-trigger]')) {
                if (showSlipPicker) setShowSlipPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showSlipPicker]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            className="flex flex-col w-full select-none"
            style={{ background: '#080808', minHeight: '100vh' }}
        >
            {/* ── Full-Width Header ─────────────────────────── */}
            <div
                className="w-full px-6 py-4 flex flex-col items-center text-center border-b flex-shrink-0"
                style={{ borderColor: 'rgba(232,160,32,0.15)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            >
                <h1
                    className="font-black uppercase tracking-tight leading-none"
                    style={{ fontSize: 'clamp(18px, 4vw, 28px)', color: GOLD, textShadow: `0 0 30px ${GOLD}55` }}
                >
                    GRIT Live Chat
                </h1>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap justify-center">
                    <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', isChatOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
                        <span className={cn('text-[11px] font-black uppercase tracking-widest', isChatOpen ? 'text-green-400' : 'text-red-400')}>
                            {isChatOpen ? 'LIVE' : 'CLOSED'}
                        </span>
                    </div>
                    <span className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">
                        {isChatOpen ? 'Global & country rooms' : 'Opens during live events'}
                    </span>
                </div>

                {/* View Toggle: Chat / Slip Wall */}
                <div className="flex gap-1.5 mt-3">
                    {(['chat', 'wall'] as ChatView[]).map(view => {
                        const isActive = chatView === view;
                        return (
                            <button
                                key={view}
                                onClick={() => setChatView(view)}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all',
                                    isActive
                                        ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                                        : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                )}
                            >
                                {view === 'chat' ? <Globe className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                                {view === 'chat' ? 'Chat' : 'Slip Wall'}
                            </button>
                        );
                    })}
                </div>

                {/* Chat Type Tabs (only visible in chat view) */}
                {chatView === 'chat' && (
                    <div className="flex gap-2 mt-2">
                        {(['global', 'country'] as ChatType[]).map(tab => {
                            const isActive = activeChatType === tab;
                            const isDisabled = tab === 'country' && !userCountry;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => !isDisabled && setActiveChatType(tab)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all',
                                        isActive
                                            ? 'border-yellow-500/30 text-yellow-400/80 bg-yellow-500/05'
                                            : isDisabled
                                                ? 'border-white/5 text-white/20 cursor-not-allowed'
                                                : 'border-white/08 text-white/30 hover:border-white/15 hover:text-white/50'
                                    )}
                                >
                                    {tab === 'global' ? <Globe className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
                                    {tab}
                                    {isDisabled && <Lock className="w-2.5 h-2.5" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Body: Two Panel Split ─────────────────────── */}
            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>

                {/* ── Left Panel (70%): Chat Feed or Slip Wall ─ */}
                <div className="flex flex-col flex-[7] border-r overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

                    {chatView === 'wall' ? (
                        <SlipWall />
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500 mr-2" />
                                        <span className="text-white/30 text-sm">Loading chat…</span>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <MessageCircle className="h-8 w-8 text-white/15 mb-3" />
                                        <p className="text-white/40 text-sm font-semibold">No messages yet</p>
                                        <p className="text-white/25 text-xs mt-1">Be the first to start the conversation.</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.filter(m => m.isAdmin || (m as any).isAdmin).map(msg => (
                                            <ChatMessageRow key={msg.id} msg={msg} isOwn={msg.userId === (user as any)?.id} />
                                        ))}
                                        {[...messages].filter(m => !m.isAdmin && !(m as any).isAdmin).reverse().map(msg => (
                                            <ChatMessageRow key={msg.id} msg={msg} isOwn={msg.userId === (user as any)?.id} />
                                        ))}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Typing indicator */}
                            {typingUsers.length > 0 && (
                                <div className="px-4 pb-1 text-[10px] text-white/30 animate-pulse">
                                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                </div>
                            )}

                            {/* ── Input Bar ────────────────────────── */}
                            <div className="p-3 border-t flex-shrink-0 relative" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)' }}>
                                {/* Chat closed banner */}
                                {!isChatOpen ? (
                                    <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <Lock className="w-4 h-4 text-white/40" />
                                        <span className="text-sm text-white/40 font-semibold">Chat opens during live events</span>
                                    </div>
                                ) : user ? (
                                    <div className="relative">
                                        {/* Slip Picker */}
                                        {showSlipPicker && (
                                            <div data-slip-picker>
                                                <SlipPicker
                                                    onSelect={handleSlipPost}
                                                    onClose={() => { setShowSlipPicker(false); setSlipCooldownMsg(undefined); }}
                                                    cooldownMessage={slipCooldownMsg}
                                                />
                                            </div>
                                        )}

                                        {/* Emoji Picker */}
                                        {showEmojiPicker && (
                                            <div data-emoji-picker>
                                                <EmojiPicker
                                                    isChallenger={isChallenger}
                                                    onSelect={handleEmojiSelect}
                                                    onClose={() => setShowEmojiPicker(false)}
                                                />
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                            <div
                                                className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                            >
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={input}
                                                    onChange={handleInputChange}
                                                    placeholder="Drop your prediction..."
                                                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none min-w-0"
                                                    maxLength={500}
                                                    disabled={sendMutation.isPending}
                                                />
                                                <div className="flex items-center gap-1.5 text-white/25 flex-shrink-0">
                                                    {/* Emoji button */}
                                                    <button
                                                        type="button"
                                                        data-emoji-trigger
                                                        onClick={() => { setShowEmojiPicker(p => !p); setShowSlipPicker(false); }}
                                                        className="hover:text-yellow-400 transition-colors"
                                                        title="Emoji"
                                                    >
                                                        <Smile className="w-4 h-4" />
                                                    </button>

                                                    {/* Slip button — Challenger only; hidden for Contenders */}
                                                    {isChallenger && (
                                                        <button
                                                            type="button"
                                                            data-slip-trigger
                                                            onClick={() => { setShowSlipPicker(p => !p); setShowEmojiPicker(false); }}
                                                            className="hover:text-yellow-400 transition-colors"
                                                            title="Share a Slip"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || sendMutation.isPending}
                                                className="gold-btn px-5 py-2.5 text-[11px] font-black tracking-widest flex-shrink-0 rounded-xl disabled:opacity-40"
                                            >
                                                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEND'}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-white/30 py-1">Sign in to start chatting</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Right Panel (30%): Leaderboard ───────── */}
                <div className="flex-[3] flex flex-col overflow-hidden min-w-[200px] max-w-[280px]">

                    {/* Top Support */}
                    <div className="flex-shrink-0 p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: GOLD }}>TOP SUPPORT</h3>

                        {topDonors.length > 0 ? (
                            <>
                                <TopDonorCard donor={topDonors[0]} isFirst />
                                <div className="flex gap-2">
                                    {topDonors.slice(1).map(d => (
                                        <TopDonorCard key={d.rank ?? d.username} donor={d} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-[11px] text-white/30 py-4">No supporters yet — be the first.</p>
                        )}
                    </div>

                    {/* Recent Donations */}
                    <div className="flex flex-col flex-1 overflow-hidden p-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex-shrink-0" style={{ color: GOLD }}>RECENT DONATIONS</h3>
                        <div className="flex-1 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                            {recentDonations.length > 0 ? (
                                recentDonations.map((d, i) => (
                                    <RecentDonationRow key={i} donor={d} index={i} />
                                ))
                            ) : (
                                <p className="text-center text-[11px] text-white/30 py-4">No donations yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatHub;
