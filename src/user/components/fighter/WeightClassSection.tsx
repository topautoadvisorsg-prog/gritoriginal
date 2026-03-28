import React, { useState } from 'react';
import { Fighter, WeightClass } from '@/shared/types/fighter';
import { FighterCard } from './FighterCard';
import { ChevronDown, ChevronRight, Trophy, Users } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';

interface WeightClassSectionProps {
  weightClass: WeightClass;
  fighters: Fighter[];
  onFighterClick: (fighter: Fighter) => void;
  defaultOpen?: boolean;
}

export const WeightClassSection: React.FC<WeightClassSectionProps> = ({
  weightClass,
  fighters,
  onFighterClick,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Sort fighters: champion first, then by ranking
  const sortedFighters = [...fighters].sort((a, b) => {
    if (a.isChampion) return -1;
    if (b.isChampion) return 1;
    if (!a.ranking && !b.ranking) return 0;
    if (!a.ranking) return 1;
    if (!b.ranking) return -1;
    return a.ranking - b.ranking;
  });

  const champion = sortedFighters.find(f => f.isChampion);
  const rankedCount = fighters.filter(f => f.ranking || f.isChampion).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-between p-4 h-auto rounded-lg mb-2',
            'bg-card/50 hover:bg-card/80 border border-border/50',
            'transition-all duration-200',
            isOpen && 'border-primary/30 bg-card/80'
          )}
        >
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            
            <div className="flex items-center gap-2">
              {champion && <Trophy className="h-4 w-4 text-accent" />}
              <span className="font-display text-lg tracking-wide uppercase text-foreground">
                {weightClass}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{rankedCount} ranked</span>
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 animate-accordion-down">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
          {sortedFighters.map((fighter) => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              onClick={onFighterClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
