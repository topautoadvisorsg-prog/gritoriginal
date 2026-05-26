import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, ImageOff } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui/empty-state';

interface Slip {
    id: string;
    imageUrl: string;
    status: string;
    daysRemaining: number;
    createdAt: string;
}

interface SlipPickerProps {
    onSelect: (slipId: string) => void;
    onClose: () => void;
    cooldownMessage?: string;
}

export const SlipPicker: React.FC<SlipPickerProps> = ({ onSelect, onClose, cooldownMessage }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: slips = [], isLoading } = useQuery<Slip[]>({
        queryKey: ['/api/slips/mine'],
        queryFn: () => fetch('/api/slips/mine', { credentials: 'include' }).then(r => r.json()),
    });

    const approved = slips.filter(s => s.status === 'approved');

    return (
        <div
            className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border overflow-hidden"
            style={{ background: 'rgba(10,10,10,0.97)', borderColor: 'rgba(232,160,32,0.25)', backdropFilter: 'blur(16px)' }}
            ref={containerRef}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">Share a Slip</span>
                <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {cooldownMessage && (
                <div className="px-4 py-2.5 text-center text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                    {cooldownMessage}
                </div>
            )}

            <div className="p-3 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-yellow-500 mr-2" />
                        <span className="text-white/40 text-sm">Loading slips…</span>
                    </div>
                ) : approved.length === 0 ? (
                    <EmptyState
                        icon={ImageOff}
                        variant="compact"
                        title="No approved slips yet"
                        description="Upload slips in Settings → My Slips, then wait for admin approval."
                    />
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {approved.map(slip => (
                            <button
                                key={slip.id}
                                onClick={() => onSelect(slip.id)}
                                className="relative group rounded-lg overflow-hidden border aspect-[4/3] transition-all hover:border-yellow-400/60"
                                style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#111' }}
                            >
                                <img
                                    src={slip.imageUrl}
                                    alt="Bet slip"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider" style={{ background: '#E8A020', color: '#1a0f00' }}>
                                    {slip.daysRemaining}d left
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
