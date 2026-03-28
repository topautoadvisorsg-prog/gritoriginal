import React from 'react';
import { RiskSignal } from '@/shared/types/fighter';
import { AlertTriangle, Activity, Plane, TrendingDown, Clock, Shield } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { LucideIcon } from 'lucide-react';

interface RiskSignalsProps {
  signals?: RiskSignal[];
  className?: string;
}

/**
 * RiskSignals - Contextual Risk Indicators Display
 * 
 * Displays risk signals that may affect fighter performance.
 * Supports different signal types and severity levels.
 * Handles empty state gracefully.
 * 
 * Signal Types:
 * - injury: Physical injury concerns
 * - travel: Travel-related fatigue or jet lag
 * - layoff: Extended time away from competition
 * - weight_cut: Weight cutting concerns
 * - camp: Training camp issues
 * - form: Recent performance decline
 * 
 * Severity Levels:
 * - low: Minor concern, informational
 * - medium: Notable concern, should be considered
 * - high: Major concern, significant risk
 */
export const RiskSignals: React.FC<RiskSignalsProps> = ({ signals = [], className }) => {
  const getIcon = (type: RiskSignal['type']): LucideIcon => {
    switch (type) {
      case 'injury':
        return Activity;
      case 'travel':
        return Plane;
      case 'layoff':
        return Clock;
      case 'weight_cut':
        return TrendingDown;
      case 'camp':
        return Shield;
      case 'form':
        return TrendingDown;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityStyles = (severity: RiskSignal['severity']) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-loss/10',
          border: 'border-loss/30',
          text: 'text-loss',
          icon: 'text-loss',
        };
      case 'medium':
        return {
          bg: 'bg-accent/10',
          border: 'border-accent/30',
          text: 'text-accent',
          icon: 'text-accent',
        };
      case 'low':
      default:
        return {
          bg: 'bg-muted/30',
          border: 'border-border/50',
          text: 'text-muted-foreground',
          icon: 'text-muted-foreground',
        };
    }
  };

  // Empty state - block exists but is empty-ready
  if (signals.length === 0) {
    return (
      <div className={cn('glass-card rounded-xl p-6', className)}>
        <h3 className="section-header mb-4">Risk Signals</h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Shield className="h-6 w-6 text-win/50 mb-2" />
          <p className="text-sm text-win font-medium">No Active Risks</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Risk signals will be displayed here when detected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header">Risk Signals</h3>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium text-accent">
            {signals.length} Active
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {signals.map((signal) => {
          const Icon = getIcon(signal.type);
          const styles = getSeverityStyles(signal.severity);
          
          return (
            <div
              key={signal.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors duration-200',
                styles.bg,
                styles.border
              )}
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', styles.icon)} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', styles.text)}>
                    {signal.label}
                  </span>
                  <span className={cn(
                    'text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
                    styles.bg,
                    styles.text
                  )}>
                    {signal.severity}
                  </span>
                </div>
                {signal.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {signal.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
