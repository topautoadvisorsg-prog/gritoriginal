import React from 'react';
import { cn } from '@/shared/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'win' | 'loss' | 'draw' | 'primary' | 'accent' | 'muted';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  pulse = false,
  className,
}) => {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    win: 'bg-win/20 text-win border border-win/30',
    loss: 'bg-loss/20 text-loss border border-loss/30',
    draw: 'bg-draw/20 text-draw border border-draw/30',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted/50 text-muted-foreground border border-border/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse-slow',
        className
      )}
    >
      {children}
    </span>
  );
};
