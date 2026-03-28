import React from 'react';
import { cn } from '@/shared/lib/utils';
import { useSpring, animated } from '@react-spring/web';
import { Trophy, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number;
    icon?: React.ReactNode;
    change?: number;
    suffix?: string;
    highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    change,
    suffix = '',
    highlight = false,
}) => {
    // Animated count-up effect
    const { number } = useSpring({
        from: { number: 0 },
        number: value,
        delay: 200,
        config: { mass: 1, tension: 20, friction: 10 },
    });

    const getChangeIcon = () => {
        if (change === undefined || change === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
        return <TrendingDown className="w-4 h-4 text-red-400" />;
    };

    const getChangeColor = () => {
        if (change === undefined || change === 0) return 'text-muted-foreground';
        return change > 0 ? 'text-green-400' : 'text-red-400';
    };

    return (
        <div
            className={cn(
                'p-4 rounded-xl border transition-all duration-300',
                highlight
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30'
                    : 'bg-card border-border hover:border-primary/30'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                </span>
                {icon}
            </div>

            {/* Value */}
            <div className="flex items-end gap-2">
                <animated.span className="text-3xl font-bold text-foreground">
                    {number.to((n) => Math.floor(n))}
                </animated.span>
                {suffix && (
                    <span className="text-lg text-muted-foreground mb-0.5">{suffix}</span>
                )}
            </div>

            {/* Change indicator */}
            {change !== undefined && (
                <div className={cn('flex items-center gap-1 mt-2', getChangeColor())}>
                    {getChangeIcon()}
                    <span className="text-sm font-medium">
                        {change > 0 ? '+' : ''}{change}
                    </span>
                </div>
            )}
        </div>
    );
};

// Specialized streak card
interface StreakCardProps {
    streakCount: number;
    streakType: 'pick' | 'login' | 'event';
}

export const StreakCard: React.FC<StreakCardProps> = ({ streakCount, streakType }) => {
    const streakIcons = {
        pick: <Flame className="w-6 h-6 text-orange-400" />,
        login: <Trophy className="w-6 h-6 text-blue-400" />,
        event: <Trophy className="w-6 h-6 text-purple-400" />,
    };

    const streakLabels = {
        pick: 'Pick Streak',
        login: 'Login Streak',
        event: 'Event Streak',
    };

    const { number } = useSpring({
        from: { number: 0 },
        number: streakCount,
        delay: 300,
        config: { mass: 1, tension: 20, friction: 10 },
    });

    return (
        <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {streakLabels[streakType]}
                </span>
                {streakIcons[streakType]}
            </div>

            <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                <animated.span className="text-3xl font-bold text-orange-400">
                    {number.to((n) => `×${Math.floor(n)}`)}
                </animated.span>
            </div>

            {streakCount >= 3 && (
                <p className="text-xs text-orange-400/70 mt-2">
                    🔥 You're on fire! Keep it going!
                </p>
            )}
        </div>
    );
};
