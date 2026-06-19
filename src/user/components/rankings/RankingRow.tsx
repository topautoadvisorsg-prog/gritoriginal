import React from 'react';
import { CountryFlag } from '@/shared/components/CountryFlag';
import { cn } from '@/shared/lib/utils';
import { RankBadge, RankTier } from './RankBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Flame } from 'lucide-react';

export interface RankingUser {
  id: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  tier: RankTier;
  score: number;
  scoreLabel: string;
  scoreIsUnits: boolean;
  country?: string;
  currentStreak?: number;
}

interface RankingRowProps {
  user: RankingUser;
  className?: string;
  animationIndex?: number;
  disableAnimation?: boolean;
  isSelf?: boolean;
  currentStreak?: number;
}

export const RankingRow: React.FC<RankingRowProps> = ({
  user,
  className,
  animationIndex = 0,
  disableAnimation = false,
  isSelf = false,
  currentStreak = 0,
}) => {
  const initials = user.username.slice(0, 2).toUpperCase();
  const isNumberOne = user.rank === 1;
  const isPositive = user.scoreIsUnits && user.score > 0;
  const isNegative = user.scoreIsUnits && user.score < 0;

  // Animation delay based on index (staggered entry)
  const animationDelay = disableAnimation ? '0ms' : `${animationIndex * 50}ms`;

  return (
    <div
      className={cn(
        "flex items-center gap-6 px-6 py-4 rounded-xl transition-all duration-200 group cursor-pointer hover:-translate-y-0.5",
        !disableAnimation && "animate-slide-up opacity-0",
        // Styling based on row
        isNumberOne
          ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] gold-shimmer-border"
          : isSelf
            ? "bg-[#E8A020]/10 border-[#E8A020] shadow-[0_0_15px_rgba(232,160,32,0.2)] hover:shadow-[0_0_25px_rgba(232,160,32,0.3)]"
            : "bg-[#111111]/80 border border-white/5 hover:border-white/20 hover:bg-[#1a1a1a] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]",
        className
      )}
      style={{ animationDelay, animationFillMode: 'forwards' }}
    >
      {/* 1. RANK */}
      <div className="w-12 text-center flex-shrink-0">
        <span className={cn(
          "font-black text-3xl italic display-font",
          isNumberOne ? "text-[#E8A020]" : "text-white/20"
        )}>
          #{user.rank}
        </span>
      </div>

      {/* 2. USER */}
      <div className="flex items-center gap-4 flex-1 min-w-[250px]">
        <Avatar className={cn(
          "h-12 w-12 border-2 shadow-lg",
          isNumberOne ? "border-yellow-400" : "border-white/10"
        )}>
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback className="bg-slate-800 text-white font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white display-font italic uppercase tracking-tight">{user.username}</p>
            {currentStreak >= 3 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 animate-pulse" title={`${currentStreak} Fight Win Streak!`}>
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                <span className="text-[10px] font-black text-orange-500">{currentStreak}</span>
              </div>
            )}
            <CountryFlag country={user.country} className="text-xl" />
            {isNumberOne && <span className="text-[#E8A020] text-sm">👑</span>}
          </div>
        </div>
      </div>

      {/* 3. RANK BADGE */}
      <div className="w-[120px] flex justify-center flex-shrink-0">
        <RankBadge tier={user.tier} size="md" />
      </div>

      {/* 4. SCORE (Net Units or Points — real DB value) */}
      <div className="w-[140px] flex flex-col items-center flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
          {user.scoreLabel}
        </span>
        <span className={cn(
          "font-black text-xl tabular-nums",
          isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-[#E8A020]"
        )}>
          {user.scoreIsUnits
            ? `${isPositive ? '+' : ''}${user.score.toFixed(1)}`
            : user.score.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
