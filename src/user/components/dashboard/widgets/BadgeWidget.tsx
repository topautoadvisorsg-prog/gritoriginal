import React from 'react';
import { BadgeProgress } from '../ProgressBar';
import { Target } from 'lucide-react';

interface BadgeWidgetProps {
    nextBadge: any;
}

export const BadgeWidget: React.FC<BadgeWidgetProps> = ({ nextBadge }) => {
    if (!nextBadge) return null;

    return (
        <BadgeProgress
            current={Math.round(nextBadge.progress * 10)}
            required={10}
            badgeName={nextBadge.name}
            badgeIcon={<Target className="w-5 h-5 text-primary" />}
        />
    );
};
