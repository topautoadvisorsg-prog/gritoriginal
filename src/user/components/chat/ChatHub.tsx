import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CountryFlag } from '@/shared/components/CountryFlag';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { Send, Loader2, Globe, Flag, Lock, Pin, Instagram, Twitter, Smile, ImageIcon, Trophy, X, MessageCircle, Radio, Zap } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSocket } from '@/shared/hooks/use-socket';
import { SlipPicker } from './SlipPicker';
import { SlipWall } from './SlipWall';
import { useFighters } from '@/shared/hooks/useFighters';
import type { Event, EventFight, Fighter } from '@/shared/types/fighter';
import { FighterImage } from '@/shared/components/FighterImage';

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
        progressBadge?: string | null;
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

interface SendMessageInput {
    message: string;
    messageType?: ChatMessage['messageType'];
    slipId?: string;
}

interface SendMessageBody extends SendMessageInput {
    chatType: ChatType;
    countryCode?: string | null;
}

interface ChatErrorResponse {
    error?: string;
    remainingMinutes?: number;
}

class ChatSendError extends Error {
    remainingMinutes?: number;

    constructor(message: string, remainingMinutes?: number) {
        super(message);
        this.name = 'ChatSendError';
        this.remainingMinutes = remainingMinutes;
    }
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
    const rank = msg.user?.rank;
    const cfg = rank ? RANK_CONFIG[rank] : null;
    const isHighlighted = rank && rank !== 'ROOKIE' && rank !== 'SAMURAI';
    const initials = (msg.user?.displayName || msg.user?.username || 'U').substring(0, 2).toUpperCase();
    const name = msg.user?.displayName || msg.user?.username || 'Anonymous';
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const progressBadge = msg.user?.progressBadge;
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
                    #1 TOP SUPPORTER
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
            <span className="text-[8px] uppercase tracking-widest text-white/30 block mt-0.5">BOOSTED</span>
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

const FighterStage: React.FC<{ fighter?: Fighter; side: 'left' | 'right' }> = ({ fighter, side }) => {
    const record = fighter?.record;

    return (
        <div className={cn('relative flex-1 min-w-0 h-44 md:h-52 overflow-hidden', side === 'right' && 'text-right')}>
            <div className="absolute inset-0">
                <FighterImage
                    fighter={fighter}
                    variant="hero"
                    className={cn(
                        'object-contain object-bottom drop-shadow-[0_14px_20px_rgba(0,0,0,0.8)]',
                        side === 'right' && 'scale-x-[-1]'
                    )}
                />
            </div>
            <div className={cn(
                'absolute inset-0',
                side === 'left'
                    ? 'bg-gradient-to-r from-black/20 via-transparent to-black/80'
                    : 'bg-gradient-to-l from-black/20 via-transparent to-black/80'
            )} />
            <div className={cn('absolute bottom-4 z-10 max-w-[95%] md:max-w-[75%]', side === 'left' ? 'left-3 md:left-4' : 'right-3 md:right-4')}>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                    {record ? `${record.wins}-${record.losses}-${record.draws}` : 'Record unavailable'}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">{fighter?.firstName || 'TBD'}</p>
                <p className="truncate text-lg md:text-2xl font-black uppercase leading-none text-white">
                    {fighter?.lastName || ''}
                </p>
            </div>
        </div>
    );
};

const LiveBoutStage: React.FC<{
    event: Event;
    fight: EventFight;
    fighter1?: Fighter;
    fighter2?: Fighter;
}> = ({ event, fight, fighter1, fighter2 }) => (
    <section
        aria-label={`Live bout: ${fighter1?.lastName || 'TBD'} versus ${fighter2?.lastName || 'TBD'}`}
        className="relative overflow-hidden border-b border-red-500/25 bg-black"
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.22),transparent_55%)]" />
        <div className="relative flex items-center">
            <FighterStage fighter={fighter1} side="left" />
            <div className="relative z-20 -mx-6 flex w-28 flex-shrink-0 flex-col items-center text-center md:w-40">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-red-400">
                    <Radio className="h-3 w-3 animate-pulse" /> Live Bout
                </div>
                <p className="hidden max-w-40 line-clamp-2 text-[9px] font-bold uppercase leading-tight tracking-wider text-white/40 md:block">{event.name}</p>
                <p className="my-1 text-2xl font-black italic text-[#E8A020]">VS</p>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60">
                    {fight.isTitleFight ? 'Title Fight' : fight.weightClass}
                </p>
            </div>
            <FighterStage fighter={fighter2} side="right" />
        </div>
    </section>
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
    const { fighterMap } = useFighters();
    const queryClient = useQueryClient();
    const [activeChatType, setActiveChatType] = useState<ChatType>('global');
    const [chatView, setChatView] = useState<ChatView>('chat');
    const [input, setInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSlipPicker, setShowSlipPicker] = useState(false);
    const [slipCooldownMsg, setSlipCooldownMsg] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const userCountry = user?.country;

    const { data: events = [] } = useQuery<Event[]>({
        queryKey: ['/api/events'],
        queryFn: () => fetch('/api/events').then(r => {
            if (!r.ok) throw new Error('Failed to load events');
            return r.json();
        }),
        staleTime: 30_000,
    });

    const liveEventSummary = useMemo(
        () => events.find(event => String(event.status).toUpperCase() === 'LIVE'),
        [events]
    );

    const { data: liveEvent } = useQuery<Event>({
        queryKey: ['/api/events', liveEventSummary?.id],
        queryFn: () => fetch(`/api/events/${liveEventSummary!.id}`).then(r => {
            if (!r.ok) throw new Error('Failed to load live event');
            return r.json();
        }),
        enabled: Boolean(liveEventSummary?.id),
        refetchInterval: 30_000,
    });

    const liveFight = useMemo(
        () => liveEvent?.fights?.find(fight => String(fight.status).toUpperCase() === 'LIVE'),
        [liveEvent]
    );

    // Tier check: Challenger = premium tier or active subscription
    const isChallenger = user?.tier === 'premium' || user?.subscriptionStatus === 'active';

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

    const queryKey = useMemo(() => ['/api/chat', activeChatType, userCountry], [activeChatType, userCountry]);

    const { data: apiMessages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey,
        queryFn: () => fetch(queryUrl).then(r => r.json()),
        enabled: chatView === 'chat',
    });

    const messages = apiMessages;

    // Fixture-only supporter activity. Production stays empty until the real
    // Boosts API lands; fake money must never appear to users.
    const fixtureMode = import.meta.env.UI_AUDIT_FIXTURES === '1';
    const topDonors: DonorEntry[] = fixtureMode ? [
        { rank: 1, username: 'fightiq_01', amount: 125, tier: 'ULTIMATE GOLD', initials: 'FI' },
        { rank: 2, username: 'mx_fight_club', amount: 75, tier: 'GRANDMASTER', initials: 'MX' },
        { rank: 3, username: 'southpaw_sage', amount: 50, tier: 'MASTER', initials: 'SS' },
    ] : [];
    const recentDonations: DonorEntry[] = fixtureMode ? [
        { username: 'jordan_rivera', amount: 25, tier: 'MASTER', initials: 'JR' },
        { username: 'cage_metrics', amount: 10, tier: 'SAMURAI', initials: 'CM' },
        { username: 'late_round', amount: 5, tier: 'ROOKIE', initials: 'LR' },
    ] : [];

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
        mutationFn: async ({ message, messageType, slipId }: SendMessageInput) => {
            const body: SendMessageBody = { message, chatType: activeChatType };
            if (activeChatType === 'country') body.countryCode = userCountry;
            if (messageType) body.messageType = messageType;
            if (slipId) body.slipId = slipId;
            const response = await fetchWithAuth('/api/chat', { method: 'POST', body: JSON.stringify(body) });
            if (!response.ok) {
                const err = await response.json() as ChatErrorResponse;
                throw new ChatSendError(err.error || 'Failed to send message', err.remainingMinutes);
            }
            return response.json();
        },
        onSuccess: (_, vars) => {
            if (!vars.messageType || vars.messageType === 'text') setInput('');
            setShowSlipPicker(false);
            setSlipCooldownMsg(undefined);
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (err: Error) => {
            if (err instanceof ChatSendError && err.remainingMinutes) {
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
            {liveEvent && liveFight && (
                <LiveBoutStage
                    event={liveEvent}
                    fight={liveFight}
                    fighter1={fighterMap.get(liveFight.fighter1Id)}
                    fighter2={fighterMap.get(liveFight.fighter2Id)}
                />
            )}

            {/* Full-width room command bar */}
            <div className="flex w-full flex-shrink-0 flex-col gap-3 border-b border-[#E8A020]/15 bg-black/70 px-4 py-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div>
                        <h1 className="text-base font-black uppercase leading-none tracking-tight text-[#E8A020] md:text-xl">GRIT Fight Chat</h1>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
                            {isChatOpen ? 'Talk the card. Back your picks.' : 'Chat opens during live events.'}
                        </p>
                    </div>
                    <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
                        isChatOpen ? 'border-green-500/25 bg-green-500/10 text-green-400' : 'border-red-500/25 bg-red-500/10 text-red-400'
                    )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', isChatOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
                        {isChatOpen ? 'Open' : 'Closed'}
                    </span>
                </div>

                <nav aria-label="Chat rooms" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => { setChatView('chat'); setActiveChatType('global'); }}
                        className={cn('flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors', chatView === 'chat' && activeChatType === 'global' ? 'bg-[#E8A020] text-black' : 'text-white/45 hover:text-white')}
                    >
                        <Globe className="h-3.5 w-3.5" /> Global
                    </button>
                    <button
                        onClick={() => { if (userCountry) { setChatView('chat'); setActiveChatType('country'); } }}
                        disabled={!userCountry}
                        className={cn('flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors', chatView === 'chat' && activeChatType === 'country' ? 'bg-[#E8A020] text-black' : !userCountry ? 'cursor-not-allowed text-white/20' : 'text-white/45 hover:text-white')}
                    >
                        <Flag className="h-3.5 w-3.5" /> Country {!userCountry && <Lock className="h-2.5 w-2.5" />}
                    </button>
                    <button
                        onClick={() => setChatView('wall')}
                        className={cn('flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors', chatView === 'wall' ? 'bg-[#E8A020] text-black' : 'text-white/45 hover:text-white')}
                    >
                        <Trophy className="h-3.5 w-3.5" /> Slip Wall
                    </button>
                </nav>
            </div>

            {/* ── Body: Two Panel Split ─────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden lg:flex-row" style={{ minHeight: 440 }}>

                {/* ── Left Panel (70%): Chat Feed or Slip Wall ─ */}
                <div className="flex min-h-[520px] flex-col overflow-hidden border-white/5 lg:min-h-0 lg:flex-[7] lg:border-r">

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
                                        {messages.filter(m => m.isAdmin).map(msg => (
                                            <ChatMessageRow key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />
                                        ))}
                                        {[...messages].filter(m => !m.isAdmin).reverse().map(msg => (
                                            <ChatMessageRow key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />
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

                {/* Right panel: GRIT Boosts */}
                <aside className="flex w-full flex-col overflow-hidden border-t border-white/5 lg:w-[340px] lg:flex-none lg:border-t-0">

                    <div className="relative overflow-hidden border-b border-red-500/20 bg-gradient-to-br from-red-950/70 via-black to-amber-950/30 p-5">
                        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-red-600/15 blur-2xl" />
                        <div className="relative">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8A020]/30 bg-[#E8A020]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#E8A020]">
                                    <Zap className="h-3 w-3" /> GRIT Boosts
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/25">{fixtureMode ? 'Fixture mode' : 'Coming soon'}</span>
                            </div>
                            <h2 className="text-xl font-black uppercase leading-none text-white">Fuel the Fight</h2>
                            <p className="mt-2 text-xs leading-relaxed text-white/45">
                                Boost a message during fight night and put your take above the noise.
                            </p>
                            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-[9px] font-bold uppercase tracking-wider text-white/30">
                                <Pin className="h-3 w-3 text-[#E8A020]" /> Highlighted in chat
                                <span className="text-white/10">•</span>
                                <Trophy className="h-3 w-3 text-[#E8A020]" /> Supporter rank
                            </div>
                        </div>
                    </div>

                    {/* Top Support */}
                    <div className="flex-shrink-0 p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: GOLD }}>FIGHT NIGHT SUPPORTERS</h3>

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
                            <p className="text-center text-[11px] text-white/30 py-4">Supporter rankings appear when GRIT Boosts go live.</p>
                        )}
                    </div>

                    {/* Recent Donations */}
                    <div className="flex flex-col flex-1 overflow-hidden p-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 flex-shrink-0" style={{ color: GOLD }}>RECENT BOOSTS</h3>
                        <div className="flex-1 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                            {recentDonations.length > 0 ? (
                                recentDonations.map((d, i) => (
                                    <RecentDonationRow key={i} donor={d} index={i} />
                                ))
                            ) : (
                                <p className="text-center text-[11px] text-white/30 py-4">No boosts yet.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ChatHub;
