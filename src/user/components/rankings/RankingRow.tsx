import React, { useEffect, useState } from 'react';
import { getCountryFlag } from '@/shared/lib/countries';
import { cn } from '@/shared/lib/utils';
import { RankBadge, RankTier } from './RankBadge';
import { ResultIndicators, PickResult } from './ResultIndicators';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Instagram, Twitter, ArrowUp, TrendingUp,
  AlertCircle,
  Flame, ArrowDown, Minus, Diamond } from 'lucide-react';

// Odometer-style animated counter for points
const OdometerCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5s animation
    const steps = 30;
    const incrementTime = duration / steps;
    const increment = value / steps;
    let current = 0;

    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export interface RankingUser {
  id: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  results: PickResult[];
  totalWins: number;
  totalPicks: number;
  tier: RankTier;
  monthlyRankDelta?: number;
  yearlyRankDelta?: number;
  eventsParticipated?: number;
  country?: string;
  currentStreak?: number;
  intelligencePoints?: number;
}

interface RankingRowProps {
  user: RankingUser;
  className?: string;
  animationIndex?: number;
  disableAnimation?: boolean;
  isSelf?: boolean;
  currentStreak?: number;
}

const DeltaIndicator: React.FC<{ value?: number; rank: number }> = ({ value, rank }) => {
  if (!value || value === 0) {
    return (
      <div className="flex items-center gap-1.5 text-white/20">
        <span className="font-bold text-base text-white/40">{rank}</span>
        <Minus className="w-2.5 h-2.5" />
        <span className="text-[10px] font-black">0</span>
      </div>
    );
  }

  const isUp = value > 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-bold text-white text-base">{rank}</span>
      <div className={cn("flex items-center gap-0.5 font-black text-[10px]", isUp ? "text-green-500" : "text-red-500")}>
        {isUp ? <ArrowUp className="w-2.5 h-2.5 fill-current" /> : <ArrowDown className="w-2.5 h-2.5 fill-current" />}
        <span>{isUp ? '+' : ''}{value}</span>
      </div>
    </div>
  );
};

export const RankingRow: React.FC<RankingRowProps> = ({
  user,
  className,
  animationIndex = 0,
  disableAnimation = false,
  isSelf = false,
  currentStreak = 0,
}) => {
  const initials = user.username.slice(0, 2).toUpperCase();
  const winRate = user.totalPicks > 0 ? Math.round((user.totalWins / user.totalPicks) * 100) : 0;
  const isNumberOne = user.rank === 1;

  // Animation delay based on index (staggered entry)
  const animationDelay = disableAnimation ? '0ms' : `${animationIndex * 50}ms`;

  return (
    <div
      className={cn(
        "flex items-center gap-6 px-6 py-4 rounded-xl transition-all duration-200 group cursor-pointer",
        !disableAnimation && "animate-slide-up opacity-0",
        // Styling based on row
        isNumberOne
          ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] gold-shimmer-border"
          : isSelf
            ? "bg-[#E8A020]/10 border-[#E8A020] shadow-[0_0_15px_rgba(232,160,32,0.2)]"
            : "bg-[#111111]/80 border border-white/5 hover:border-white/20 hover:bg-[#1a1a1a]",
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
      <div className="flex items-center gap-4 w-[250px] flex-shrink-0">
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
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-white display-font italic uppercase tracking-tight">{user.username}</p>
              {currentStreak >= 3 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 animate-pulse" title={`${currentStreak} Fight Win Streak!`}>
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  <span className="text-[10px] font-black text-orange-500">{currentStreak}</span>
                </div>
              )}
            </div>
            <span className="text-xl" title={user.country || "Global"}>
              {getCountryFlag(user.country || "")}
            </span>
            {isNumberOne && <span className="text-[#E8A020] text-sm">👑</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-white/30">
            <Instagram className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
            <span className="w-3 h-3 flex items-center justify-center font-black text-[10px] hover:text-white transition-colors cursor-pointer">X</span>
          </div>
        </div>
      </div>

      {/* 3. RANK BADGE */}
      <div className="w-[120px] flex justify-center flex-shrink-0">
        <RankBadge tier={user.tier} size="md" />
      </div>

      {/* 4. PERFORMANCE BAR */}
      <div className="flex-1 min-w-[200px]">
        <ResultIndicators results={user.results} totalBlocks={12} />
      </div>

      {/* 5. WIN % */}
      <div className="w-[80px] flex flex-col items-center flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
          Win %
        </span>
        <span className="font-bold text-white text-lg">
          {winRate}%
        </span>
      </div>

      {/* 6. EVENTS */}
      <div className="w-[80px] flex flex-col items-center flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
          Events
        </span>
        <span className="font-bold text-white text-base">
          {user.eventsParticipated || 0}
        </span>
      </div>

      {/* 6b. INTELLIGENCE POINTS */}
      {user.intelligencePoints !== undefined && (
        <div className="w-[120px] flex flex-col items-center flex-shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
            <Diamond className="w-3 h-3 text-[#E8A020]" />
            Points
          </span>
          <span className="font-bold text-white text-lg flex items-center gap-1">
            <OdometerCounter value={user.intelligencePoints || 0} />
          </span>
        </div>
      )}

      {/* 7. MONTHLY RANK */}
      <div className="w-[100px] flex flex-col items-center flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
          Monthly Rank
        </span>
        <DeltaIndicator rank={user.rank} value={user.monthlyRankDelta} />
      </div>

      {/* 8. YEARLY RANK */}
      <div className="w-[100px] flex flex-col items-center flex-shrink-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
          Yearly Rank
        </span>
        <DeltaIndicator rank={user.rank} value={user.yearlyRankDelta} />
      </div>
    </div>
  );
};
