import React from 'react';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { FightCard } from './FightCard';
import { cn } from '@/shared/lib/utils';

interface FightCardSectionProps {
  title: string;
  fights: EventFight[];
  getFighter: (id: string) => Fighter | undefined;
  onViewDetails?: (fightId: string) => void;
}

export const FightCardSection: React.FC<FightCardSectionProps> = ({
  title,
  fights,
  getFighter,
  onViewDetails,
}) => {
  if (fights.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Fight Cards */}
      <div className="space-y-3">
        {fights.map((fight) => (
          <FightCard
            key={fight.id}
            fight={fight}
            fighter1={getFighter(fight.fighter1Id)}
            fighter2={getFighter(fight.fighter2Id)}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};
