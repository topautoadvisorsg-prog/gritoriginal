import React from 'react';
import { Trophy, Star, Target } from 'lucide-react';
import { StatCard, StreakCard } from '../StatCard';

interface StatsWidgetProps {
    data: any; // Ideally typed strictly, but using any for flexibility with mocks
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Rank"
                value={data.rank}
                icon={<Trophy className="w-5 h-5 text-yellow-400" />}
                change={data.rankChange}
                suffix="#"
                highlight={data.rank <= 3}
            />
            <StatCard
                label="Total Points"
                value={data.totalPoints}
                icon={<Star className="w-5 h-5 text-primary" />}
            />
            <StatCard
                label="Accuracy"
                value={data.accuracy}
                icon={<Target className="w-5 h-5 text-green-400" />}
                suffix="%"
            />
            <StreakCard
                streakCount={data.currentStreak}
                streakType={data.streakType}
            />
        </div>
    );
};
