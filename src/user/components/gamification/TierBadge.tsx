import React from 'react';
import { cn } from '@/shared/lib/utils';

interface TierBadgeProps {
    tier?: string;
    className?: string;
    size?: 'sm' | 'md';
}

/**
 * Subscriber tier badge.
 * - free → no badge
 * - medium → silver shield 🛡️ "Pro"
 * - premium → gold crown 👑 "Elite"
 * 
 * Visually distinct from influencer checkmark (green ✓)
 */
export function TierBadge({ tier, className, size = 'sm' }: TierBadgeProps) {
    if (!tier || tier === 'free') return null;

    const config: Record<string, { emoji: string; label: string; bg: string; text: string; border: string }> = {
        medium: {
            emoji: '🛡️',
            label: 'Pro',
            bg: 'bg-slate-400/10',
            text: 'text-slate-300',
            border: 'border-slate-400/30',
        },
        premium: {
            emoji: '👑',
            label: 'Elite',
            bg: 'bg-amber-400/10',
            text: 'text-amber-300',
            border: 'border-amber-400/30',
        },
    };

    const c = config[tier];
    if (!c) return null;

    const sizeClasses = size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
        : 'text-xs px-2 py-0.5 gap-1';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
                c.bg, c.text, c.border,
                sizeClasses,
                className,
            )}
            title={`${c.label} Subscriber`}
        >
            <span className="leading-none">{c.emoji}</span>
            <span>{c.label}</span>
        </span>
    );
}

export default TierBadge;
