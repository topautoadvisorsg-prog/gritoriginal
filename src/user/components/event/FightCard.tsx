import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventFight, Fighter } from '@/shared/types/fighter';
import { FighterCorner } from './FighterCorner';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Trophy, Swords, ArrowRight, Clock, Lock } from 'lucide-react';
import { getFightTypeLabel } from '@/shared/utils/eventHelpers';

interface FightCardProps {
  fight: EventFight;
  fighter1: Fighter | undefined;
  fighter2: Fighter | undefined;
  onViewDetails?: (fightId: string) => void;
}

export const FightCard: React.FC<FightCardProps> = ({
  fight,
  fighter1,
  fighter2,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const fightLabel = getFightTypeLabel(fight.boutOrder, fight.isTitleFight, fight.cardPlacement);
  const isMainEvent = fight.cardPlacement === 'Main Event' || (fight.boutOrder === 1 && !fight.cardPlacement);
  const isCoMain    = fight.cardPlacement === 'Co-Main Event' || (fight.boutOrder === 2 && !fight.cardPlacement);

  // Get moneylines from fighter odds if available
  const fighter1Moneyline = fighter1?.odds?.moneyline;
  const fighter2Moneyline = fighter2?.odds?.moneyline;

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-300 overflow-hidden",
        "bg-card/80 backdrop-blur-sm",
        isMainEvent && "border-accent/50 shadow-lg shadow-accent/10",
        isCoMain && "border-primary/40",
        !isMainEvent && !isCoMain && "border-border/50",
        isExpanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Fight Type Badge */}
      {fightLabel && (
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-b-md text-[10px] font-bold uppercase tracking-wider",
          isMainEvent && "bg-accent text-accent-foreground",
          isCoMain && "bg-primary text-primary-foreground",
          fight.isTitleFight && !isMainEvent && !isCoMain && "bg-yellow-500/90 text-yellow-900"
        )}>
          <div className="flex items-center gap-1">
            {fight.isTitleFight && <Trophy className="w-3 h-3" />}
            {fightLabel}
          </div>
        </div>
      )}

      {/* Main Card Content */}
      <div 
        className="pt-6 pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Scheduled Time */}
        {fight.scheduledTime && (
          <div className="text-center mb-1">
            <span className="text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {fight.scheduledTime}
            </span>
          </div>
        )}

        {/* Weight Class */}
        <div className="text-center mb-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {fight.weightClass}
          </span>
        </div>

        {/* Fighters Row */}
        <div className="flex items-center">
          <FighterCorner 
            fighter={fighter1} 
            corner="red" 
            moneyline={fighter1Moneyline}
          />
          
          {/* VS Badge */}
          <div className="flex-shrink-0 relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-accent/20 to-primary/20",
              "border border-border/50"
            )}>
              <Swords className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          
          <FighterCorner 
            fighter={fighter2} 
            corner="blue"
            moneyline={fighter2Moneyline}
          />
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-1 text-muted-foreground/60 hover:text-primary transition-colors">
            <span className="text-[10px] uppercase tracking-wider">
              {isExpanded ? 'Hide Details' : 'View Details'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/30 pt-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            {/* Fighter 1 Stats Preview */}
            <div className="space-y-2">
              <div className="stat-card">
                <span className="data-label">Finish Rate</span>
                <p className="text-lg font-bold text-foreground">
                  {fighter1?.performance?.finish_rate ?? '--'}%
                </p>
              </div>
              <div className="stat-card">
                <span className="data-label">Str. Acc</span>
                <p className="text-lg font-bold text-foreground">
                  {fighter1?.performance?.strike_accuracy ?? '--'}%
                </p>
              </div>
            </div>

            {/* Center CTA */}
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/event/fight/${fight.id}`);
                }}
                className="ghost-btn group flex flex-col items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  VIEW FIGHT
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Fighter 2 Stats Preview */}
            <div className="space-y-2">
              <div className="stat-card">
                <span className="data-label">Finish Rate</span>
                <p className="text-lg font-bold text-foreground">
                  {fighter2?.performance?.finish_rate ?? '--'}%
                </p>
              </div>
              <div className="stat-card">
                <span className="data-label">Str. Acc</span>
                <p className="text-lg font-bold text-foreground">
                  {fighter2?.performance?.strike_accuracy ?? '--'}%
                </p>
              </div>
            </div>
          </div>

          {/* Quick comparison bar */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <span className="text-[10px] text-muted-foreground flex-shrink-0">KO Power</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-accent to-accent/70" 
                style={{ width: `${fighter1?.performance?.ko_wins ?? 0}%` }}
              />
              <div className="h-full bg-border/30 flex-1" />
              <div 
                className="h-full bg-gradient-to-l from-primary to-primary/70" 
                style={{ width: `${fighter2?.performance?.ko_wins ?? 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">KO Power</span>
          </div>
        </div>
      )}
    </div>
  );
};
