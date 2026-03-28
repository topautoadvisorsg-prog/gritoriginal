import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Swords, Shield, Target, Zap } from 'lucide-react';

interface StatsComparisonProps {
  fighter1: Fighter;
  fighter2: Fighter;
}

interface ComparisonBarProps {
  label: string;
  value1: number | undefined;
  value2: number | undefined;
  unit?: string;
  icon?: React.ReactNode;
  higherIsBetter?: boolean;
  isCoreStat?: boolean;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({ 
  label, 
  value1, 
  value2, 
  unit = '', 
  icon,
  higherIsBetter = true,
  isCoreStat = false
}) => {
  const v1 = value1 ?? 0;
  const v2 = value2 ?? 0;
  
  if (!isCoreStat && v1 === 0 && v2 === 0) {
    return null;
  }
  
  const max = Math.max(v1, v2, 1);
  const pct1 = (v1 / max) * 100;
  const pct2 = (v2 / max) * 100;
  
  const fighter1Wins = higherIsBetter ? v1 > v2 : v1 < v2;
  const fighter2Wins = higherIsBetter ? v2 > v1 : v2 < v1;
  const isTie = v1 === v2;
  
  const formatValue = (val: number | undefined) => {
    if (val === undefined) return '—';
    if (val === 0 && !isCoreStat) return '—';
    return `${val}${unit}`;
  };

  return (
    <div className="py-3">
      {/* Label */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Values & Bars */}
      <div className="flex items-center gap-3">
        {/* Fighter 1 Value */}
        <div className={cn(
          "w-16 text-right font-mono font-bold text-lg",
          v1 === 0 && !isCoreStat ? "text-muted-foreground" :
          fighter1Wins && !isTie ? "text-accent" : "text-foreground"
        )}>
          {formatValue(value1)}
        </div>

        {/* Comparison Bars */}
        <div className="flex-1 flex items-center gap-1">
          {/* Fighter 1 Bar (right aligned) */}
          <div className="flex-1 flex justify-end">
            <div 
              className={cn(
                "h-2.5 rounded-l-full transition-all duration-500",
                fighter1Wins && !isTie 
                  ? "bg-gradient-to-r from-accent/40 to-accent" 
                  : "bg-muted-foreground/30"
              )}
              style={{ width: `${pct1}%` }}
            />
          </div>
          
          {/* Center divider */}
          <div className="w-0.5 h-4 bg-border" />
          
          {/* Fighter 2 Bar (left aligned) */}
          <div className="flex-1">
            <div 
              className={cn(
                "h-2.5 rounded-r-full transition-all duration-500",
                fighter2Wins && !isTie 
                  ? "bg-gradient-to-l from-primary/40 to-primary" 
                  : "bg-muted-foreground/30"
              )}
              style={{ width: `${pct2}%` }}
            />
          </div>
        </div>

        {/* Fighter 2 Value */}
        <div className={cn(
          "w-16 text-left font-mono font-bold text-lg",
          v2 === 0 && !isCoreStat ? "text-muted-foreground" :
          fighter2Wins && !isTie ? "text-primary" : "text-foreground"
        )}>
          {formatValue(value2)}
        </div>
      </div>
    </div>
  );
};

export const StatsComparison: React.FC<StatsComparisonProps> = ({ fighter1, fighter2 }) => {
  return (
    <section className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Stats Comparison
        </h3>
      </div>

      {/* Fighter Names Header */}
      <div className="flex items-center justify-between mb-2 px-16">
        <span className="text-sm font-bold text-accent">{fighter1.lastName.toUpperCase()}</span>
        <span className="text-xs text-muted-foreground">VS</span>
        <span className="text-sm font-bold text-primary">{fighter2.lastName.toUpperCase()}</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 mb-2" />

      {/* Striking Stats */}
      <div className="space-y-1">
        <ComparisonBar
          label="Strikes Landed/Min"
          value1={fighter1.performance?.strikes_landed_per_min}
          value2={fighter2.performance?.strikes_landed_per_min}
          icon={<Target className="w-4 h-4" />}
        />
        <ComparisonBar
          label="Strike Accuracy"
          value1={fighter1.performance?.strike_accuracy}
          value2={fighter2.performance?.strike_accuracy}
          unit="%"
        />
        <ComparisonBar
          label="Strikes Absorbed/Min"
          value1={fighter1.performance?.strikes_absorbed_per_min}
          value2={fighter2.performance?.strikes_absorbed_per_min}
          icon={<Shield className="w-4 h-4" />}
          higherIsBetter={false}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 my-4" />

      {/* Grappling Stats */}
      <div className="space-y-1">
        <ComparisonBar
          label="Takedown Accuracy"
          value1={fighter1.performance?.takedown_accuracy}
          value2={fighter2.performance?.takedown_accuracy}
          unit="%"
        />
        <ComparisonBar
          label="Takedown Defense"
          value1={fighter1.performance?.takedown_defense}
          value2={fighter2.performance?.takedown_defense}
          unit="%"
        />
        <ComparisonBar
          label="Submission Defense"
          value1={fighter1.performance?.submission_defense}
          value2={fighter2.performance?.submission_defense}
          unit="%"
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 my-4" />

      {/* Finish Stats */}
      <div className="space-y-1">
        <ComparisonBar
          label="Finish Rate"
          value1={fighter1.performance?.finish_rate}
          value2={fighter2.performance?.finish_rate}
          unit="%"
          icon={<Zap className="w-4 h-4" />}
        />
        <ComparisonBar
          label="KO Wins"
          value1={fighter1.performance?.ko_wins}
          value2={fighter2.performance?.ko_wins}
          isCoreStat={true}
        />
        <ComparisonBar
          label="Submission Wins"
          value1={fighter1.performance?.submission_wins}
          value2={fighter2.performance?.submission_wins}
          isCoreStat={true}
        />
      </div>
    </section>
  );
};
