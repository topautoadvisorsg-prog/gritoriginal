import React from 'react';
import { cn } from '@/shared/lib/utils';
import { useSpring, animated } from '@react-spring/web';
import {
    Target,
    Crown,
    Flame,
    Award,
    Zap,
    Star,
    Trophy,
    Medal,
    Bot,
    Calendar,
    Heart,
    Swords
} from 'lucide-react';

export type BadgeType =
    | 'first-blood'
    | 'sharpshooter'
    | 'prophet'
    | 'champion'
    | 'veteran'
    | 'iron-streak'
    | 'ai-apprentice'
    | 'social-butterfly'
    | 'event-warrior'
    | 'underdog-hunter';

interface BadgeConfig {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    description: string;
}

const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
    'first-blood': {
        icon: <Swords className="w-full h-full" />,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        label: 'First Blood',
        description: 'First correct pick',
    },
    'sharpshooter': {
        icon: <Target className="w-full h-full" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        label: 'Sharpshooter',
        description: '75%+ accuracy (10+ picks)',
    },
    'prophet': {
        icon: <Star className="w-full h-full" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        label: 'Prophet',
        description: '5 perfect picks',
    },
    'champion': {
        icon: <Crown className="w-full h-full" />,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        label: 'Champion',
        description: 'Finish #1 in an event',
    },
    'veteran': {
        icon: <Medal className="w-full h-full" />,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        label: 'Veteran',
        description: '50 total picks',
    },
    'iron-streak': {
        icon: <Flame className="w-full h-full" />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        label: 'Iron Streak',
        description: '10 consecutive correct picks',
    },
    'ai-apprentice': {
        icon: <Bot className="w-full h-full" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        label: 'AI Apprentice',
        description: 'Follow AI prediction 10 times',
    },
    'social-butterfly': {
        icon: <Heart className="w-full h-full" />,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        label: 'Social Butterfly',
        description: '100 chat messages',
    },
    'event-warrior': {
        icon: <Calendar className="w-full h-full" />,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30',
        label: 'Event Warrior',
        description: 'Participate in 10 events',
    },
    'underdog-hunter': {
        icon: <Zap className="w-full h-full" />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        label: 'Underdog Hunter',
        description: '5 correct underdog picks',
    },
};

interface BadgeIconProps {
    badge: BadgeType;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    unlocked?: boolean;
    showLabel?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
};

const iconSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4',
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({
    badge,
    size = 'md',
    unlocked = true,
    showLabel = false,
    className,
}) => {
    const config = BADGE_CONFIGS[badge];

    const springProps = useSpring({
        from: { transform: 'scale(1)', opacity: 0 },
        to: {
            transform: 'scale(1)',
            opacity: 1,
            boxShadow: unlocked ? `0 0 15px ${config.borderColor.split('/')[0].replace('border-', 'var(--')}` : 'none'
        },
        config: { tension: 300, friction: 10 }
    });

    if (!config) {
        return null;
    }

    return (
        <div className={cn('flex flex-col items-center gap-1', className)}>
            <animated.div
                style={springProps}
                className={cn(
                    'rounded-full border-2 transition-all duration-500 cursor-default hover:scale-110',
                    sizeClasses[size],
                    iconSizeClasses[size],
                    unlocked
                        ? [config.bgColor, config.borderColor, config.color, 'shadow-lg']
                        : 'bg-muted/50 border-muted text-muted-foreground grayscale opacity-50'
                )}
            >
                {config.icon}
            </animated.div>
            {showLabel && (
                <span
                    className={cn(
                        'text-xs font-medium text-center',
                        unlocked ? config.color : 'text-muted-foreground'
                    )}
                >
                    {config.label}
                </span>
            )}
        </div>
    );
};

// Badge with tooltip
export const BadgeWithTooltip: React.FC<BadgeIconProps & { showDescription?: boolean }> = ({
    showDescription = false,
    ...props
}) => {
    const config = BADGE_CONFIGS[props.badge];

    return (
        <div className="group relative">
            <BadgeIcon {...props} />
            {showDescription && config && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg border border-border whitespace-nowrap">
                        <p className="font-medium">{config.label}</p>
                        <p className="text-muted-foreground">{config.description}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Get all badge configs (for badge gallery)
export const getAllBadges = (): Array<{ type: BadgeType; config: BadgeConfig }> => {
    return Object.entries(BADGE_CONFIGS).map(([type, config]) => ({
        type: type as BadgeType,
        config,
    }));
};

export { BADGE_CONFIGS };
