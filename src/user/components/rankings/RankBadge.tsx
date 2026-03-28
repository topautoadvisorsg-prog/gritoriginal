import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Trophy, Star, Shield, Flag, Target } from 'lucide-react';

export type RankTier = 'ULTIMATE GOLD' | 'GRANDMASTER' | 'MASTER' | 'SAMURAI' | 'NINJA';

interface RankBadgeProps {
  tier: RankTier;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG: Record<RankTier, { colors: string; icon: React.ElementType }> = {
  'ULTIMATE GOLD': {
    colors: 'from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-yellow-300',
    icon: Trophy,
  },
  'GRANDMASTER': {
    colors: 'from-amber-700 via-yellow-700 to-amber-900 border-amber-600',
    icon: Star,
  },
  'MASTER': {
    colors: 'from-purple-500 via-purple-600 to-purple-800 shadow-[0_0_15px_rgba(147,51,234,0.3)] border-purple-400',
    icon: Shield,
  },
  'SAMURAI': {
    colors: 'from-orange-700 via-red-800 to-orange-900 border-red-500',
    icon: Flag,
  },
  'NINJA': {
    colors: 'from-slate-600 via-slate-700 to-slate-900 border-slate-500',
    icon: Target,
  },
};

export const RankBadge: React.FC<RankBadgeProps> = ({ tier, className, size = 'md' }) => {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG['NINJA'];
  const Icon = cfg.icon;

  const sizeClass = {
    sm: 'w-10 h-11 text-[8px]',
    md: 'w-16 h-18 text-[10px]',
    lg: 'w-24 h-28 text-[14px]',
  }[size];

  const iconSize = {
    sm: 'w-3 h-3 mb-0.5',
    md: 'w-5 h-5 mb-1',
    lg: 'w-8 h-8 mb-2',
  }[size];

  return (
    <div className={cn("relative flex flex-col items-center justify-center", sizeClass, className)}>
      {/* Hexagon shape */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-b border-2",
          cfg.colors
        )} 
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }} 
      />
      
      {/* Inner content */}
      <div className="relative z-10 flex flex-col items-center text-center px-1">
        <Icon className={cn("text-white/90 drop-shadow-md", iconSize)} />
        <span className="font-black text-white leading-tight uppercase tracking-wide drop-shadow-md pb-[2px]">
          {tier.split(' ').map((word, i) => (
            <React.Fragment key={i}>
              {word}
              {i < tier.split(' ').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      </div>
    </div>
  );
};
