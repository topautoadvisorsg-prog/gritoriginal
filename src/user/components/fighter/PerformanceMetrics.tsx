import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { CircularProgress } from '@/shared/components/ui/CircularProgress';
import { Last5FightsIndicator } from './Last5FightsIndicator';
import { Zap, Shield, Target, Clock } from 'lucide-react';

interface PerformanceMetricsProps {
  fighter: Fighter;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ fighter }) => {
  const { performance } = fighter;

  const hasFinishRate = performance.finish_rate > 0;
  const hasAvgFightTime = performance.avg_fight_time_minutes > 0;
  const hasStrikeAccuracy = performance.strike_accuracy > 0;
  const hasStrikesPerMin = performance.strikes_landed_per_min > 0;
  const hasTdDefense = performance.takedown_defense > 0;
  const hasAnyAdvancedStats = hasStrikeAccuracy || hasStrikesPerMin || hasTdDefense;
  const hasCircularMetrics = hasFinishRate || hasAvgFightTime;

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="section-header mb-4">Performance Metrics</h3>

      {/* Win Method Breakdown - Always show (0 is meaningful) */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.ko_wins + performance.tko_wins}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            KO/TKO Wins
          </div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.submission_wins}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Sub Wins
          </div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.decision_wins}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Dec Wins
          </div>
        </div>
      </div>

      {/* Loss Method Breakdown - Always show (0 is meaningful) */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.losses_by_ko}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            KO/TKO Losses
          </div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.losses_by_submission}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Sub Losses
          </div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold font-mono text-foreground">
            {performance.losses_by_decision}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Dec Losses
          </div>
        </div>
      </div>

      {/* Circular Metrics - Only show if we have data */}
      {hasCircularMetrics && (
        <div className="flex justify-between items-center gap-4 mb-6">
          {hasFinishRate && (
            <CircularProgress
              value={performance.finish_rate}
              label="Finish Rate"
              size={100}
            />
          )}
          {hasAvgFightTime && (
            <div className="flex-1 stat-card flex flex-col items-center justify-center h-[100px]">
              <Clock className="h-5 w-5 text-primary mb-2" />
              <span className="text-2xl font-mono font-bold text-foreground">
                {performance.avg_fight_time_minutes}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase text-center">
                Avg Fight Time (min)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Advanced Stats - Only show rows with data */}
      {hasAnyAdvancedStats && (
        <div className="space-y-3">
          {hasStrikeAccuracy && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Strike Accuracy</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {performance.strike_accuracy}%
              </span>
            </div>
          )}

          {hasStrikesPerMin && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Strikes/Min</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {performance.strikes_landed_per_min}
              </span>
            </div>
          )}

          {hasTdDefense && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-win" />
                <span className="text-sm text-muted-foreground">TD Defense</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {performance.takedown_defense}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Last 5 Fights Visual */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Last5FightsIndicator fights={fighter.history} />
      </div>

      {/* Streaks */}
      {(performance.win_streak > 0 || performance.ko_streak > 0) && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            {performance.win_streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-win/10 border border-win/30">
                <span className="text-win text-xs font-bold">
                  🔥 {performance.win_streak} Win Streak
                </span>
              </div>
            )}
            {performance.ko_streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
                <span className="text-accent text-xs font-bold">
                  💥 {performance.ko_streak} KO Streak
                </span>
              </div>
            )}
            {performance.longest_win_streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-win/10 border border-win/30">
                <span className="text-win text-xs font-bold">
                  🏆 {performance.longest_win_streak} Longest Win Streak
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
