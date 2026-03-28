import React, { useState, useMemo } from 'react';
import { ExportFieldSelector, fieldGroups } from './ExportFieldSelector';
import { ExportDataPreview } from './ExportDataPreview';
import { useFighters } from '@/shared/hooks/useFighters';
import { useFightHistory } from '@/shared/hooks/useFightHistory';
import { Fighter } from '@/shared/types/fighter';
import { toast } from 'sonner';
import { Database, Download, Lock } from 'lucide-react';
import { fightHistoryFieldGroups, ImportableFightRecord } from '@/shared/utils/fightHistoryTransform';
import { useAuth } from '@/shared/hooks/use-auth';

export const ExportPage: React.FC = () => {
  const { user } = useAuth();
  const { fighters, isLoaded } = useFighters();
  const { fights, isLoaded: fightsLoaded } = useFightHistory();
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(['firstName', 'lastName', 'weightClass', 'wins', 'losses', 'draws'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState('fighters');
  const [picksExporting, setPicksExporting] = useState(false);

  const handleExportMyPicks = async () => {
    setPicksExporting(true);
    try {
      const res = await fetch('/api/user/export/picks', { credentials: 'include' });
      if (res.status === 403) {
        toast.error('My Picks export requires a Premium subscription.');
        return;
      }
      if (!res.ok) {
        toast.error('Failed to export picks. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-picks-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Your picks have been exported.');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setPicksExporting(false);
    }
  };

  const isPremium = user?.tier === 'premium';

  // Get current field groups based on data source
  const currentFieldGroups = dataSource === 'fights' ? fightHistoryFieldGroups : fieldGroups;

  // Filter fighters based on search query
  const filteredFighters = useMemo(() => {
    if (!searchQuery.trim()) return fighters;
    const query = searchQuery.toLowerCase();
    return fighters.filter(
      (f) =>
        f.firstName.toLowerCase().includes(query) ||
        f.lastName.toLowerCase().includes(query) ||
        f.nickname?.toLowerCase().includes(query)
    );
  }, [fighters, searchQuery]);

  // Filter fights based on search
  const filteredFights = useMemo(() => {
    if (!searchQuery.trim()) return fights;
    const query = searchQuery.toLowerCase();
    return fights.filter(
      (f) =>
        f.opponentName.toLowerCase().includes(query) ||
        f.eventName.toLowerCase().includes(query)
    );
  }, [fights, searchQuery]);

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const handleGroupToggle = (groupId: string, fieldIds: string[]) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      const allSelected = fieldIds.every((id) => next.has(id));
      if (allSelected) {
        fieldIds.forEach((id) => next.delete(id));
      } else {
        fieldIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFieldIds = currentFieldGroups.flatMap((g) => g.fields.map((f) => f.id));
    setSelectedFields(new Set(allFieldIds));
  };

  const handleClearAll = () => {
    setSelectedFields(new Set());
  };

  const handleDataSourceChange = (source: string) => {
    setDataSource(source);
    // Reset fields when switching data source
    if (source === 'fights') {
      setSelectedFields(new Set(['fighter_name', 'opponent_name', 'event_name', 'result', 'method']));
    } else {
      setSelectedFields(new Set(['firstName', 'lastName', 'weightClass', 'wins', 'losses', 'draws']));
    }
  };

  // Helper to get fighter field value
  const getFighterFieldValue = (fighter: Fighter, fieldId: string): string => {
    if (fieldId === 'id') return fighter.id;
    if (fieldId === 'firstName') return fighter.firstName;
    if (fieldId === 'lastName') return fighter.lastName;
    if (fieldId === 'nickname') return fighter.nickname || '';
    if (fieldId === 'dateOfBirth') return fighter.dateOfBirth || '';
    if (fieldId === 'nationality') return fighter.nationality || '';
    if (fieldId === 'gender') return fighter.gender;
    if (fieldId === 'organization') return fighter.organization;
    if (fieldId === 'weightClass') return fighter.weightClass;
    if (fieldId === 'stance') return fighter.stance || '';
    if (fieldId === 'gym') return fighter.gym || '';
    if (fieldId === 'headCoach') return fighter.headCoach || '';
    if (fieldId === 'team') return fighter.team || '';
    if (fieldId === 'age') return fighter.physicalStats?.age?.toString() || '';
    if (fieldId === 'height') return fighter.physicalStats?.height || '';
    if (fieldId === 'reach') return fighter.physicalStats?.reach || '';
    if (fieldId === 'leg_reach') return fighter.physicalStats?.leg_reach || '';
    if (fieldId === 'weight') return fighter.physicalStats?.weight?.toString() || '';
    if (fieldId === 'wins') return fighter.record.wins.toString();
    if (fieldId === 'losses') return fighter.record.losses.toString();
    if (fieldId === 'draws') return fighter.record.draws.toString();
    if (fieldId === 'noContests') return fighter.record.noContests.toString();
    if (fieldId === 'ko_wins') return fighter.performance?.ko_wins?.toString() || '';
    if (fieldId === 'tko_wins') return fighter.performance?.tko_wins?.toString() || '';
    if (fieldId === 'submission_wins') return fighter.performance?.submission_wins?.toString() || '';
    if (fieldId === 'decision_wins') return fighter.performance?.decision_wins?.toString() || '';
    if (fieldId === 'finish_rate') return fighter.performance?.finish_rate?.toString() || '';
    if (fieldId === 'avg_fight_time') return fighter.performance?.avg_fight_time_minutes?.toString() || '';
    if (fieldId === 'strike_accuracy') return fighter.performance?.strike_accuracy?.toString() || '';
    if (fieldId === 'takedown_accuracy') return fighter.performance?.takedown_accuracy?.toString() || '';
    if (fieldId === 'strikes_landed_per_min') return fighter.performance?.strikes_landed_per_min?.toString() || '';
    if (fieldId === 'strikes_absorbed_per_min') return fighter.performance?.strikes_absorbed_per_min?.toString() || '';
    if (fieldId === 'takedown_defense') return fighter.performance?.takedown_defense?.toString() || '';
    if (fieldId === 'submission_defense') return fighter.performance?.submission_defense?.toString() || '';
    if (fieldId === 'win_streak') return fighter.performance?.win_streak?.toString() || '0';
    if (fieldId === 'loss_streak') return fighter.performance?.loss_streak?.toString() || '0';
    if (fieldId === 'isActive') return fighter.isActive ? 'Active' : 'Inactive';
    if (fieldId === 'ranking') return fighter.ranking?.toString() || '';
    if (fieldId === 'isChampion') return fighter.isChampion ? 'Yes' : 'No';
    if (fieldId === 'rank_global') return fighter.rankGlobal?.toString() || '';
    if (fieldId === 'rank_promotion') return fighter.rankPromotion?.toString() || '';
    if (fieldId === 'fighting_out_of') return fighter.fightingOutOf || '';
    if (fieldId === 'losses_by_ko') return fighter.performance?.losses_by_ko?.toString() || '';
    if (fieldId === 'losses_by_submission') return fighter.performance?.losses_by_submission?.toString() || '';
    if (fieldId === 'losses_by_decision') return fighter.performance?.losses_by_decision?.toString() || '';
    if (fieldId === 'longest_win_streak') return fighter.performance?.longest_win_streak?.toString() || '';
    if (fieldId === 'moneyline') return fighter.odds?.moneyline || '';
    if (fieldId === 'overUnder') return fighter.odds?.overUnder || '';
    if (fieldId === 'methodKo') return fighter.odds?.methodKo || '';
    if (fieldId === 'methodSub') return fighter.odds?.methodSub || '';
    if (fieldId === 'methodDec') return fighter.odds?.methodDec || '';
    if (fieldId === 'impliedProbability') return fighter.odds?.impliedProbability?.toString() || '';
    return '';
  };

  // Helper to get fight field value
  const getFightFieldValue = (fight: ImportableFightRecord, fieldId: string): string => {
    if (fieldId === 'fight_id') return fight.id;
    if (fieldId === 'fighter_id') return fight.fighterId || '';
    if (fieldId === 'fighter_name') return fight.fighterName || '';
    if (fieldId === 'fighter_nickname') return fight.fighterNickname || '';
    if (fieldId === 'opponent_name') return fight.opponentName;
    if (fieldId === 'opponent_nickname') return fight.opponentNickname || '';
    if (fieldId === 'event_name') return fight.eventName;
    if (fieldId === 'event_date') return fight.eventDate;
    if (fieldId === 'event_promotion') return fight.eventPromotion || '';
    if (fieldId === 'weight_class') return fight.weightClass || '';
    if (fieldId === 'billing') return fight.billing || '';
    if (fieldId === 'bout_type') return fight.billing || '';
    if (fieldId === 'fight_order') return fight.fightType;
    if (fieldId === 'title_fight') return fight.titleFight ? 'Yes' : 'No';
    if (fieldId === 'title_fight_detail') return fight.titleFightDetail || '';
    if (fieldId === 'scheduled_rounds') return fight.roundsScheduled?.toString() || '';
    if (fieldId === 'round_duration_minutes') return fight.roundDurationMinutes?.toString() || '';
    if (fieldId === 'result') return fight.result;
    if (fieldId === 'method') return fight.method;
    if (fieldId === 'method_detail') return fight.methodDetail || '';
    if (fieldId === 'round_finished') return fight.round?.toString() || '';
    if (fieldId === 'time_finished') return fight.time || '';
    if (fieldId === 'referee') return fight.referee || '';
    if (fieldId === 'decision_type') return fight.decisionType || '';
    if (fieldId === 'knockdowns') return fight.stats?.knockdowns?.toString() || '0';
    if (fieldId === 'significant_strikes_landed') return fight.stats?.significantStrikesLanded?.toString() || '0';
    if (fieldId === 'significant_strikes_attempted') return fight.stats?.significantStrikesAttempted?.toString() || '0';
    if (fieldId === 'significant_strikes_pct') {
      if (!fight.stats || !fight.stats.significantStrikesAttempted) return '0';
      return Math.round((fight.stats.significantStrikesLanded / fight.stats.significantStrikesAttempted) * 100).toString();
    }
    if (fieldId === 'total_strikes_landed') return fight.stats?.strikesLanded?.toString() || '0';
    if (fieldId === 'total_strikes_attempted') return fight.stats?.strikesAttempted?.toString() || '0';
    if (fieldId === 'takedowns_landed') return fight.stats?.takedownsLanded?.toString() || '0';
    if (fieldId === 'takedowns_attempted') return fight.stats?.takedownsAttempted?.toString() || '0';
    if (fieldId === 'takedown_pct') {
      if (!fight.stats || !fight.stats.takedownsAttempted) return '0';
      return Math.round((fight.stats.takedownsLanded / fight.stats.takedownsAttempted) * 100).toString();
    }
    if (fieldId === 'submissions_attempted') return fight.stats?.submissionAttempts?.toString() || '0';
    if (fieldId === 'control_time') return fight.stats?.controlTimeSeconds?.toString() || '0';
    if (fieldId === 'reversals') return fight.stats?.reversals?.toString() || '0';
    if (fieldId === 'head_strikes_landed') return fight.stats?.headStrikesLanded?.toString() || '0';
    if (fieldId === 'head_strikes_attempted') return fight.stats?.headStrikesAttempted?.toString() || '0';
    if (fieldId === 'body_strikes_landed') return fight.stats?.bodyStrikesLanded?.toString() || '0';
    if (fieldId === 'body_strikes_attempted') return fight.stats?.bodyStrikesAttempted?.toString() || '0';
    if (fieldId === 'leg_strikes_landed') return fight.stats?.legStrikesLanded?.toString() || '0';
    if (fieldId === 'leg_strikes_attempted') return fight.stats?.legStrikesAttempted?.toString() || '0';
    if (fieldId === 'distance_strikes_landed') return fight.stats?.distanceStrikesLanded?.toString() || '0';
    if (fieldId === 'distance_strikes_attempted') return fight.stats?.distanceStrikesAttempted?.toString() || '0';
    if (fieldId === 'clinch_strikes_landed') return fight.stats?.clinchStrikesLanded?.toString() || '0';
    if (fieldId === 'clinch_strikes_attempted') return fight.stats?.clinchStrikesAttempted?.toString() || '0';
    if (fieldId === 'ground_strikes_landed') return fight.stats?.groundStrikesLanded?.toString() || '0';
    if (fieldId === 'ground_strikes_attempted') return fight.stats?.groundStrikesAttempted?.toString() || '0';
    if (fieldId === 'round_time_format') return fight.round_time_format || '';
    if (fieldId === 'opponent_linked') return fight.opponentLinked === false ? 'false' : 'true';

    const roundMatch = fieldId.match(/^r(\d)_(.+)$/);
    if (roundMatch && fight.per_round_stats) {
      const roundNum = parseInt(roundMatch[1], 10);
      const statKey = roundMatch[2];
      const roundData = fight.per_round_stats.find(r => r.round === roundNum);
      if (!roundData) return '';
      const keyMap: Record<string, keyof typeof roundData> = {
        sig_str_landed: 'sig_str_landed',
        sig_str_attempted: 'sig_str_attempted',
        sig_str_pct: 'sig_str_pct',
        head_str_landed: 'head_str_landed',
        head_str_attempted: 'head_str_attempted',
        body_str_landed: 'body_str_landed',
        body_str_attempted: 'body_str_attempted',
        leg_str_landed: 'leg_str_landed',
        leg_str_attempted: 'leg_str_attempted',
        distance_str_landed: 'distance_str_landed',
        distance_str_attempted: 'distance_str_attempted',
        clinch_str_landed: 'clinch_str_landed',
        clinch_str_attempted: 'clinch_str_attempted',
        ground_str_landed: 'ground_str_landed',
        ground_str_attempted: 'ground_str_attempted',
        kd: 'knockdowns',
        td_landed: 'td_landed',
        td_attempted: 'td_attempted',
        td_pct: 'td_pct',
        sub_attempts: 'sub_attempts',
        reversals: 'reversals',
        control_time: 'control_time',
        landed_by_target_pct: 'landed_by_target_pct',
        landed_by_position_pct: 'landed_by_position_pct',
      };
      const mappedKey = keyMap[statKey];
      if (mappedKey) {
        const val = roundData[mappedKey];
        return val !== undefined && val !== null ? String(val) : '';
      }
    }

    return '';
  };

  // Generate CSV content
  const generateCSV = (): string => {
    const selectedFieldsArray = Array.from(selectedFields);
    const headers = selectedFieldsArray.map((fieldId) => {
      for (const group of currentFieldGroups) {
        const field = group.fields.find((f) => f.id === fieldId);
        if (field) return field.label;
      }
      return fieldId;
    });

    if (dataSource === 'fights') {
      const rows = filteredFights.map((fight) => {
        return selectedFieldsArray.map((fieldId) => {
          const value = getFightFieldValue(fight as ImportableFightRecord, fieldId);
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
      });
      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    const rows = filteredFighters.map((fighter) => {
      return selectedFieldsArray.map((fieldId) => {
        const value = getFighterFieldValue(fighter, fieldId);
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
    });

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  const handleExportCSV = () => {
    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const prefix = dataSource === 'fights' ? 'fight-history' : 'fighter';
    link.download = `${prefix}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const count = dataSource === 'fights' ? filteredFights.length : filteredFighters.length;
    toast.success(`Exported ${count} records to CSV`);
  };

  const handleExportXLSX = () => {
    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const prefix = dataSource === 'fights' ? 'fight-history' : 'fighter';
    link.download = `${prefix}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const count = dataSource === 'fights' ? filteredFights.length : filteredFighters.length;
    toast.success(`Exported ${count} records to XLSX`);
  };

  // Empty state - no data to export
  const hasNoData = isLoaded && fightsLoaded && fighters.length === 0 && fights.length === 0;
  
  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Data to Export</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Import fighter or fight history data first to enable export functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Picks Export — Premium gated API call */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {isPremium ? (
            <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">Export My Picks</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPremium
                ? 'Download your full pick history as a CSV file.'
                : 'Upgrade to Premium to export your personal pick history.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleExportMyPicks}
          disabled={!isPremium || picksExporting}
          className="shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {picksExporting ? 'Exporting…' : 'Download CSV'}
        </button>
      </div>

      {/* Existing fighter / fight history export */}
      <div className="h-full flex gap-4">
      {/* Left Panel - Field Selection */}
      <div className="w-72 shrink-0 overflow-y-auto">
        <ExportFieldSelector
          selectedFields={selectedFields}
          onFieldToggle={handleFieldToggle}
          onGroupToggle={handleGroupToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dataSource={dataSource}
          onDataSourceChange={handleDataSourceChange}
          fieldGroups={currentFieldGroups}
          hasFightHistory={fights.length > 0}
        />
      </div>

      {/* Main Area - Data Preview */}
      <div className="flex-1 min-w-0">
        <ExportDataPreview
          fighters={dataSource === 'fighters' ? filteredFighters : []}
          fights={dataSource === 'fights' ? filteredFights as ImportableFightRecord[] : []}
          selectedFields={selectedFields}
          dataSource={dataSource}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportXLSX}
        />
      </div>
    </div>
    </div>
  );
};
