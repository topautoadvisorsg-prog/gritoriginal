import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Trophy, Star, TrendingUp, TrendingDown, Award, Flame, CheckCircle } from 'lucide-react';

type ActivityType = 'points' | 'badge' | 'rank_up' | 'rank_down' | 'streak' | 'pick_correct';

interface ActivityItem {
    id: string;
    type: ActivityType;
    message: string;
    timestamp: Date;
    value?: number;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    maxItems = 5,
}) => {
    const getActivityIcon = (type: ActivityType) => {
        switch (type) {
            case 'points':
                return <Star className="w-4 h-4 text-yellow-400" />;
            case 'badge':
                return <Award className="w-4 h-4 text-purple-400" />;
            case 'rank_up':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'rank_down':
                return <TrendingDown className="w-4 h-4 text-red-400" />;
            case 'streak':
                return <Flame className="w-4 h-4 text-orange-400" />;
            case 'pick_correct':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            default:
                return <Trophy className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getActivityColor = (type: ActivityType) => {
        switch (type) {
            case 'points':
                return 'border-l-yellow-400';
            case 'badge':
                return 'border-l-purple-400';
            case 'rank_up':
                return 'border-l-green-400';
            case 'rank_down':
                return 'border-l-red-400';
            case 'streak':
                return 'border-l-orange-400';
            case 'pick_correct':
                return 'border-l-green-400';
            default:
                return 'border-l-muted-foreground';
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const displayedActivities = activities.slice(0, maxItems);

    if (displayedActivities.length === 0) {
        return (
            <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground/60">Make picks to see your progress!</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {displayedActivities.map((activity, index) => (
                <div
                    key={activity.id}
                    className={cn(
                        'flex items-center gap-3 p-3 rounded-lg bg-card/50 border-l-2 transition-all',
                        'hover:bg-card/80',
                        getActivityColor(activity.type),
                        'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="p-1.5 rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
                    </div>
                    {activity.value !== undefined && (
                        <span className="text-sm font-bold text-primary">
                            +{activity.value}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

// Mock data generator for testing
export const generateMockActivities = (): ActivityItem[] => [
    {
        id: '1',
        type: 'points',
        message: 'You earned 6 pts from UFC 311',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        value: 6,
    },
    {
        id: '2',
        type: 'badge',
        message: 'New badge: First Blood 🩸',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: '3',
        type: 'rank_up',
        message: 'Rank improved: #7 → #5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
        id: '4',
        type: 'streak',
        message: 'Pick streak extended to 5!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: '5',
        type: 'pick_correct',
        message: 'Correct pick: Islam Makhachev',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
];
