import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Trophy, ImageOff } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui/empty-state';

interface FeaturedSlip {
    id: string;
    imageUrl: string;
    caption: string | null;
    featuredAt: string | null;
    user?: {
        username?: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

const GOLD = '#E8A020';

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const SlipCard: React.FC<{ slip: FeaturedSlip }> = ({ slip }) => {
    const name = slip.user?.displayName || slip.user?.username || 'Fighter';
    const date = formatDate(slip.featuredAt);
    const initials = name.substring(0, 2).toUpperCase();

    return (
        <div
            className="rounded-2xl overflow-hidden flex flex-col border transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(232,160,32,0.15)' }}
        >
            <div className="relative bg-black aspect-[4/3] overflow-hidden">
                <img
                    src={slip.imageUrl}
                    alt={`${name}'s slip`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest"
                    style={{ background: GOLD, color: '#1a0f00' }}
                >
                    FEATURED
                </span>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                        style={{ background: 'rgba(232,160,32,0.15)', color: GOLD, border: '1px solid rgba(232,160,32,0.25)' }}
                    >
                        {slip.user?.avatarUrl ? (
                            <img src={slip.user.avatarUrl} alt={initials} className="w-full h-full object-cover rounded-full" />
                        ) : initials}
                    </div>
                    <span className="font-bold text-white text-xs truncate">{name}</span>
                    {date && <span className="text-[10px] text-white/30 ml-auto flex-shrink-0">{date}</span>}
                </div>
                {slip.caption && (
                    <p className="text-[11px] text-white/60 italic leading-snug line-clamp-2">{slip.caption}</p>
                )}
            </div>
        </div>
    );
};

export const SlipWall: React.FC = () => {
    const { data: slips = [], isLoading } = useQuery<FeaturedSlip[]>({
        queryKey: ['/api/slip-wall'],
        queryFn: () => fetch('/api/slip-wall', { credentials: 'include' }).then(r => r.json()),
        staleTime: 0, // Always refetch - new slips added frequently
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div
                className="px-5 py-4 border-b flex-shrink-0 flex items-center gap-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)' }}
            >
                <Trophy className="w-5 h-5" style={{ color: GOLD }} />
                <div>
                    <h2 className="font-black uppercase tracking-wider text-sm" style={{ color: GOLD }}>Slip Wall</h2>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">Hall of Fame · Featured Hits</p>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto p-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mr-2" />
                        <span className="text-white/40 text-sm">Loading Slip Wall…</span>
                    </div>
                ) : slips.length === 0 ? (
                    <EmptyState
                        icon={ImageOff}
                        title="No featured slips yet"
                        description="The wall fills up as Challengers post big hits."
                    />
                ) : (
                    <div className="columns-2 md:columns-3 gap-3 space-y-3">
                        {slips.map(slip => (
                            <div key={slip.id} className="break-inside-avoid mb-3">
                                <SlipCard slip={slip} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
