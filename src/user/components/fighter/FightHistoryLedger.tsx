import React, { useState } from 'react';
import { FightRecord } from '@/shared/types/fighter';
import { ChevronDown, ChevronUp, Trophy, Calendar, Clock, Lock, LinkIcon } from 'lucide-react';
import { Badge } from '@/shared/components/ui/ResultBadge';
import { cn } from '@/shared/lib/utils';

interface FightHistoryLedgerProps {
  fights: FightRecord[];
  /**
   * When true, indicates there's an upcoming scheduled fight (pre-fight state)
   * The ledger will show a placeholder for the pending fight
   */
  hasPendingFight?: boolean;
  pendingFightInfo?: {
    eventName: string;
    eventDate: string;
    opponentName?: string;
  };
}

/**
 * FightHistoryLedger - Immutable Fight Record Display
 * 
 * This component serves as a ledger (not just a list) of fight records.
 * Each row represents one historical fight - an immutable record once finalized.
 * 
 * Key behaviors:
 * - Renders cleanly with zero fights (empty-ready)
 * - Supports pre-fight state (pending fight row)
 * - Supports post-fight locked state (finalized records)
 * - Same structure will be used by Events later
 * - No mock data assumptions - works with any fight history
 */
export const FightHistoryLedger: React.FC<FightHistoryLedgerProps> = ({ 
  fights = [], 
  hasPendingFight = false,
  pendingFightInfo 
}) => {
  const [expandedFightId, setExpandedFightId] = useState<string | null>(null);

  const toggleFight = (id: string) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    setExpandedFightId(expandedFightId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || 'Date TBD';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const sortedFights = [...fights].sort((a, b) => {
    const dateA = new Date(a.eventDate).getTime();
    const dateB = new Date(b.eventDate).getTime();
    return dateB - dateA;
  });

  const isEmpty = fights.length === 0 && !hasPendingFight;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="section-header">Fight History Ledger</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {fights.length} {fights.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        <div className="flex gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-win" />
            WIN
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-loss" />
            LOSS
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-draw" />
            DRAW/NC
          </span>
        </div>
      </div>

      {/* Fight List */}
      <div className="divide-y divide-border/30">
        {/* Pending Fight Row (Pre-Fight State) */}
        {hasPendingFight && pendingFightInfo && (
          <div className="group bg-primary/5 border-l-2 border-primary">
            <div className="grid grid-cols-12 gap-2 p-4 items-center">
              {/* Event */}
              <div className="col-span-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary truncate">
                    {pendingFightInfo.eventName}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="col-span-2 hidden md:block">
                <span className="text-xs text-primary font-mono">
                  {formatDate(pendingFightInfo.eventDate)}
                </span>
              </div>

              {/* Opponent */}
              <div className="col-span-4 md:col-span-3">
                <span className="text-sm font-semibold text-foreground">
                  {pendingFightInfo.opponentName || 'TBD'}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-5 md:col-span-5 flex items-center justify-end gap-2">
                <Badge variant="primary" size="md">
                  <Clock className="h-3 w-3 mr-1" />
                  SCHEDULED
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No fight records</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Fight history will appear here once recorded
            </p>
          </div>
        )}

        {/* Fight Records - sorted by date, newest first */}
        {sortedFights.map((fight) => {
          const isExpanded = expandedFightId === fight.id;
          const accuracy = fight.stats && fight.stats.strikesAttempted > 0
            ? Math.round((fight.stats.strikesLanded / fight.stats.strikesAttempted) * 100)
            : null;

          return (
            <div key={fight.id} className={cn('group', fight.isLocked && 'bg-muted/10')}>
              {/* Fight Row */}
              <div
                onClick={() => toggleFight(fight.id)}
                className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-muted/30 cursor-pointer transition-colors duration-200"
              >
                {/* Date + Event */}
                <div className="col-span-3 md:col-span-3">
                  <div className="flex items-center gap-2">
                    {fight.titleFight && (
                      <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground truncate block">
                        {fight.eventName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(fight.eventDate)}
                        </span>
                        {fight.weightClass && (
                          <span className="text-[10px] text-primary/80 font-medium">
                            {fight.weightClass}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opponent */}
                <div className="col-span-3 md:col-span-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      {fight.opponentName}
                    </span>
                    {fight.opponentLinked === false && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Opponent not yet in system">
                        <LinkIcon className="h-2.5 w-2.5" />
                        UNLINKED
                      </span>
                    )}
                  </div>
                  {fight.billing && (
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {fight.billing}
                    </span>
                  )}
                  {fight.titleFightDetail && (
                    <span className="text-[10px] text-accent/80 block">
                      {fight.titleFightDetail}
                    </span>
                  )}
                </div>

                {/* Result */}
                <div className="col-span-4 md:col-span-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          fight.result === 'WIN'
                            ? 'win'
                            : fight.result === 'LOSS'
                            ? 'loss'
                            : 'draw'
                        }
                      >
                        {fight.result}
                      </Badge>
                      {fight.isLocked && (
                        <Lock className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {fight.method} R{fight.round} {fight.time}
                    </span>
                  </div>
                </div>

                {/* Expand Button */}
                <div className="col-span-2 md:col-span-3 flex items-center justify-end gap-2">
                  {fight.referee && (
                    <span className="text-[10px] text-muted-foreground hidden md:inline">
                      Ref: {fight.referee}
                    </span>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Stats */}
              <div
                className={cn(
                  'bg-muted/20 overflow-hidden transition-all duration-300 ease-in-out',
                  isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                {fight.stats ? (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="text-center">
                        <div className="data-label">Sig. Strikes</div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {fight.stats.significantStrikesLanded} / {fight.stats.significantStrikesAttempted}
                        </div>
                        {fight.stats.significantStrikesAttempted > 0 && (
                          <div className={cn('text-[10px] font-mono', 
                            Math.round((fight.stats.significantStrikesLanded / fight.stats.significantStrikesAttempted) * 100) >= 50 ? 'text-win' : 'text-loss'
                          )}>
                            {Math.round((fight.stats.significantStrikesLanded / fight.stats.significantStrikesAttempted) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="data-label">Total Strikes</div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {fight.stats.strikesLanded} / {fight.stats.strikesAttempted}
                        </div>
                        {accuracy !== null && (
                          <div className={cn('text-[10px] font-mono', accuracy >= 50 ? 'text-win' : 'text-loss')}>
                            {accuracy}%
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="data-label">Takedowns</div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {fight.stats.takedownsLanded} / {fight.stats.takedownsAttempted}
                        </div>
                        {fight.stats.takedownsAttempted > 0 && (
                          <div className="text-[10px] font-mono text-primary">
                            {Math.round((fight.stats.takedownsLanded / fight.stats.takedownsAttempted) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="data-label">Control</div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {Math.floor(fight.stats.controlTimeSeconds / 60)}:{String(fight.stats.controlTimeSeconds % 60).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="data-label">KD</div>
                        <div className="text-sm font-mono font-bold text-accent">
                          {fight.stats.knockdowns}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="data-label">Sub Att.</div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {fight.stats.submissionAttempts}
                        </div>
                      </div>
                    </div>
                    {(fight.stats.clinchStrikesLanded > 0 || fight.stats.groundStrikesLanded > 0 || fight.stats.headStrikesLanded > 0) && (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-border/30">
                        <div className="text-center">
                          <div className="data-label">Head</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.headStrikesLanded} / {fight.stats.headStrikesAttempted}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="data-label">Body</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.bodyStrikesLanded} / {fight.stats.bodyStrikesAttempted}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="data-label">Leg</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.legStrikesLanded} / {fight.stats.legStrikesAttempted}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="data-label">Distance</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.distanceStrikesLanded} / {fight.stats.distanceStrikesAttempted}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="data-label">Clinch</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.clinchStrikesLanded} / {fight.stats.clinchStrikesAttempted}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="data-label">Ground</div>
                          <div className="text-xs font-mono text-foreground">
                            {fight.stats.groundStrikesLanded} / {fight.stats.groundStrikesAttempted}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No detailed statistics available for this fight
                  </div>
                )}

                {fight.per_round_stats && fight.per_round_stats.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="data-label mb-2 flex items-center gap-2">
                      <span className="text-primary">Round-by-Round</span>
                      <span className="text-[9px] text-muted-foreground font-mono">SIG. STRIKES</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {fight.per_round_stats.map((rs) => {
                        const pct = rs.sig_str_attempted > 0
                          ? Math.round((rs.sig_str_landed / rs.sig_str_attempted) * 100)
                          : rs.sig_str_pct ?? 0;
                        return (
                          <div
                            key={rs.round}
                            className="flex-1 min-w-[80px] rounded-lg bg-muted/40 border border-border/30 p-2 text-center"
                          >
                            <div className="text-[10px] font-mono text-muted-foreground mb-1">R{rs.round}</div>
                            <div className="text-sm font-mono font-bold text-foreground">
                              {rs.sig_str_landed}/{rs.sig_str_attempted}
                            </div>
                            <div className={cn(
                              'text-[10px] font-mono font-semibold',
                              pct >= 50 ? 'text-win' : 'text-loss'
                            )}>
                              {pct}%
                            </div>
                            {rs.knockdowns != null && rs.knockdowns > 0 && (
                              <div className="text-[9px] font-mono text-accent mt-0.5">
                                {rs.knockdowns} KD
                              </div>
                            )}
                            {rs.landed_by_target_pct != null && (
                              <div className="text-[9px] font-mono text-muted-foreground mt-0.5" title="Target accuracy %">
                                TGT {rs.landed_by_target_pct}%
                              </div>
                            )}
                            {rs.landed_by_position_pct != null && (
                              <div className="text-[9px] font-mono text-muted-foreground" title="Position accuracy %">
                                POS {rs.landed_by_position_pct}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Judges Display */}
                {(fight as any).judges && (
                  <div className="px-4 pb-3">
                    <div className="data-label mb-1">Judges</div>
                    <div className="text-xs font-mono text-foreground">
                      {(fight as any).judges}
                    </div>
                  </div>
                )}

                {/* Location & Additional Info */}
                <div className="px-4 pb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {fight.location?.venue && (
                    <span>📍 {fight.location.venue}{fight.location.city ? `, ${fight.location.city}` : ''}</span>
                  )}
                  {fight.roundsScheduled && (
                    <span>🥊 {fight.roundsScheduled} Rds x {fight.roundDurationMinutes || 5} Min</span>
                  )}
                  {fight.round_time_format && (
                    <span>⏱️ {fight.round_time_format}</span>
                  )}
                  {fight.eventPromotion && (
                    <span>🏢 {fight.eventPromotion}</span>
                  )}
                  {fight.oddsSnapshot && (
                    <span>
                      💰 {fight.oddsSnapshot.openingMoneyline > 0 ? '+' : ''}
                      {fight.oddsSnapshot.openingMoneyline}
                    </span>
                  )}
                </div>
                
                {/* Judges Scorecards */}
                {fight.judges_scores_data && fight.judges_scores_data.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="data-label mb-1">Judges Scorecards</div>
                    <div className="flex flex-wrap gap-3">
                      {fight.judges_scores_data.map((score, idx) => (
                        <span key={idx} className="text-xs font-mono text-foreground">
                          {score.judge_name}: {score.fighter_score}-{score.opponent_score}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Finalized Record Indicator */}
                {fight.isLocked && (
                  <div className="px-4 pb-3">
                    <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      Record Finalized – Read Only
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
