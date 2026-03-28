import React from 'react';
import { cn } from '@/shared/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'win' | 'loss' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variants = {
    default: 'bg-muted/50 border-border/30 hover:border-primary/40',
    win: 'bg-win/10 border-win/30 hover:border-win/60',
    loss: 'bg-loss/10 border-loss/30 hover:border-loss/60',
    accent: 'bg-accent/10 border-accent/30 hover:border-accent/60',
  };

  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const valueSizes = {
    sm: 'text-sm',
    md: 'text-base md:text-lg',
    lg: 'text-xl md:text-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="data-label mb-1">{label}</div>
          <div className={cn('font-mono font-bold text-foreground', valueSizes[size])}>
            {value}
          </div>
        </div>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {trend && trendValue && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-win',
              trend === 'down' && 'text-loss',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};
