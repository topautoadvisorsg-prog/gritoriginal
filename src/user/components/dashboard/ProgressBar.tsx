import React from 'react';
import { cn } from '@/shared/lib/utils';
import { useSpring, animated } from '@react-spring/web';

interface ProgressBarProps {
    value: number; // 0-1
    label: string;
    targetLabel?: string;
    showPercentage?: boolean;
    color?: 'primary' | 'gold' | 'green' | 'blue';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    label,
    targetLabel,
    showPercentage = true,
    color = 'primary',
}) => {
    const clampedValue = Math.min(Math.max(value, 0), 1);
    const percentage = Math.round(clampedValue * 100);

    const { width } = useSpring({
        from: { width: 0 },
        width: percentage,
        delay: 200,
        config: { mass: 1, tension: 40, friction: 15 },
    });

    const colorClasses = {
        primary: 'from-primary to-primary/80',
        gold: 'from-yellow-500 to-amber-600',
        green: 'from-green-500 to-emerald-600',
        blue: 'from-blue-500 to-cyan-600',
    };

    return (
        <div className="space-y-2">
            {/* Labels */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    {showPercentage && (
                        <span className="text-sm font-bold text-primary">{percentage}%</span>
                    )}
                    {targetLabel && (
                        <span className="text-xs text-muted-foreground">to {targetLabel}</span>
                    )}
                </div>
            </div>

            {/* Progress track */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
                <animated.div
                    className={cn(
                        'h-full bg-gradient-to-r rounded-full transition-all',
                        colorClasses[color]
                    )}
                    style={{
                        width: width.to((w) => `${w}%`),
                    }}
                />
            </div>

            {/* XP style markers */}
            <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">0</span>
                <span className="text-xs text-muted-foreground">100%</span>
            </div>
        </div>
    );
};

// Badge progress variant
interface BadgeProgressProps {
    current: number;
    required: number;
    badgeName: string;
    badgeIcon?: React.ReactNode;
}

export const BadgeProgress: React.FC<BadgeProgressProps> = ({
    current,
    required,
    badgeName,
    badgeIcon,
}) => {
    const progress = Math.min(current / required, 1);

    return (
        <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
                {badgeIcon && (
                    <div className="p-2 rounded-lg bg-primary/10">
                        {badgeIcon}
                    </div>
                )}
                <div>
                    <p className="font-medium text-foreground">{badgeName}</p>
                    <p className="text-sm text-muted-foreground">
                        {current} / {required} complete
                    </p>
                </div>
            </div>

            <ProgressBar
                value={progress}
                label=""
                showPercentage={false}
                color="gold"
            />

            {progress >= 1 && (
                <p className="text-sm text-yellow-400 mt-2">
                    ✨ Badge unlocked! Claim it now.
                </p>
            )}
        </div>
    );
};
