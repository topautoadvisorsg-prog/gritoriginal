import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Flame, Calendar, Trophy, Target } from 'lucide-react';

export type StreakType = 'pick' | 'login' | 'event' | 'accuracy';

interface StreakBadgeProps {
    type: StreakType;
    count: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animate?: boolean;
    className?: string;
}

const streakConfigs: Record<StreakType, {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    label: string;
    emoji: string;
}> = {
    pick: {
        icon: <Flame className="w-full h-full" />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        label: 'Pick Streak',
        emoji: '🔥',
    },
    login: {
        icon: <Calendar className="w-full h-full" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        label: 'Login Streak',
        emoji: '📅',
    },
    event: {
        icon: <Trophy className="w-full h-full" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        label: 'Event Streak',
        emoji: '🏆',
    },
    accuracy: {
        icon: <Target className="w-full h-full" />,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        label: 'Accuracy Streak',
        emoji: '🎯',
    },
};

const sizeClasses = {
    sm: { badge: 'text-sm gap-1', icon: 'w-4 h-4', padding: 'px-2 py-1' },
    md: { badge: 'text-base gap-1.5', icon: 'w-5 h-5', padding: 'px-3 py-1.5' },
    lg: { badge: 'text-lg gap-2', icon: 'w-6 h-6', padding: 'px-4 py-2' },
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({
    type,
    count,
    size = 'md',
    showLabel = false,
    animate = true,
    className,
}) => {
    const config = streakConfigs[type];
    const sizes = sizeClasses[size];

    if (count <= 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full border font-bold',
                sizes.badge,
                sizes.padding,
                config.bgColor,
                config.color,
                'border-current/30',
                className
            )}
        >
            <span className={cn(sizes.icon, animate && count >= 3 && 'animate-pulse')}>
                {config.icon}
            </span>
            <span>×{count}</span>
            {showLabel && (
                <span className="text-xs opacity-70 ml-1">{config.label}</span>
            )}
        </div>
    );
};

// Compact streak display (emoji version)
interface StreakEmojiProps {
    type: StreakType;
    count: number;
    className?: string;
}

export const StreakEmoji: React.FC<StreakEmojiProps> = ({ type, count, className }) => {
    const config = streakConfigs[type];

    if (count <= 0) {
        return null;
    }

    return (
        <span className={cn('font-bold', config.color, className)}>
            {config.emoji}×{count}
        </span>
    );
};

// Multi-streak display
interface MultiStreakProps {
    streaks: Array<{ type: StreakType; count: number }>;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const MultiStreak: React.FC<MultiStreakProps> = ({
    streaks,
    size = 'sm',
    className,
}) => {
    const activeStreaks = streaks.filter(s => s.count > 0);

    if (activeStreaks.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {activeStreaks.map((streak) => (
                <StreakBadge
                    key={streak.type}
                    type={streak.type}
                    count={streak.count}
                    size={size}
                />
            ))}
        </div>
    );
};
