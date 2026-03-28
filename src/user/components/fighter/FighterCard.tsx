import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { Card } from '@/shared/components/ui/card';
import { Crown, Medal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface FighterCardProps {
  fighter: Fighter;
  onClick: (fighter: Fighter) => void;
}

export const FighterCard: React.FC<FighterCardProps> = ({ fighter, onClick }) => {
  const { firstName, lastName, nickname, record, ranking, isChampion, imageUrl } = fighter;
  const recordStr = `${record.wins}-${record.losses}${record.draws > 0 ? `-${record.draws}` : ''}`;
  
  return (
    <Card
      onClick={() => onClick(fighter)}
      className={cn(
        'group relative cursor-pointer overflow-hidden transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20',
        'bg-card/80 backdrop-blur border-border/50',
        'hover:border-primary/50',
        isChampion && 'ring-2 ring-accent/50 border-accent/30'
      )}
    >
      {/* Champion/Ranking Badge */}
      <div className="absolute top-2 left-2 z-10">
        {isChampion ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-bold">
            <Crown className="h-3 w-3" />
            <span>CHAMP</span>
          </div>
        ) : ranking ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/90 text-foreground text-xs font-bold border border-border">
            <Medal className="h-3 w-3 text-primary" />
            <span>#{ranking}</span>
          </div>
        ) : null}
      </div>

      {/* Fighter Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-b from-muted to-background">
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/300x400/1a1a2e/00d4ff?text=${firstName[0]}${lastName[0]}`;
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      {/* Fighter Info */}
      <div className="relative p-4 space-y-2">
        {/* Name */}
        <div className="space-y-0.5">
          <h3 className="font-display text-lg font-bold text-foreground tracking-wide truncate">
            {firstName} {lastName}
          </h3>
          {nickname && (
            <p className="text-xs text-primary font-medium truncate">
              "{nickname}"
            </p>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Card>
  );
};
