import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Fighter } from '@/shared/types/fighter';
import { ImportableFightRecord } from '@/shared/types/import';
import { fieldGroups } from './ExportFieldSelector';

export interface ExportDataPreviewProps {
  fighters: Fighter[];
  fights?: ImportableFightRecord[];
  selectedFields: Set<string>;
  dataSource?: string;
  onExportCSV: () => void;
  onExportXLSX: () => void;
}

// Helper to get field value from fighter object
const getFieldValue = (fighter: Fighter, fieldId: string): string => {
  // Identity fields
  if (fieldId === 'id') return fighter.id;
  if (fieldId === 'firstName') return fighter.firstName;
  if (fieldId === 'lastName') return fighter.lastName;
  if (fieldId === 'nickname') return fighter.nickname || '-';
  if (fieldId === 'dateOfBirth') return fighter.dateOfBirth || '-';
  if (fieldId === 'nationality') return fighter.nationality || '-';
  if (fieldId === 'gender') return fighter.gender;

  // Division fields
  if (fieldId === 'organization') return fighter.organization;
  if (fieldId === 'weightClass') return fighter.weightClass;
  if (fieldId === 'stance') return fighter.stance || '-';
  if (fieldId === 'gym') return fighter.gym || '-';
  if (fieldId === 'headCoach') return fighter.headCoach || '-';
  if (fieldId === 'team') return fighter.team || '-';

  // Physical stats
  if (fieldId === 'age') return fighter.physicalStats?.age?.toString() || '-';
  if (fieldId === 'height') return fighter.physicalStats?.height || '-';
  if (fieldId === 'reach') return fighter.physicalStats?.reach || '-';
  if (fieldId === 'leg_reach') return fighter.physicalStats?.leg_reach || '-';
  if (fieldId === 'weight') return fighter.physicalStats?.weight?.toString() || '-';

  // Record
  if (fieldId === 'wins') return fighter.record.wins.toString();
  if (fieldId === 'losses') return fighter.record.losses.toString();
  if (fieldId === 'draws') return fighter.record.draws.toString();
  if (fieldId === 'noContests') return fighter.record.noContests.toString();

  // Performance metrics (uses 'performance' field)
  if (fieldId === 'ko_wins') return fighter.performance?.ko_wins?.toString() || '-';
  if (fieldId === 'tko_wins') return fighter.performance?.tko_wins?.toString() || '-';
  if (fieldId === 'submission_wins') return fighter.performance?.submission_wins?.toString() || '-';
  if (fieldId === 'decision_wins') return fighter.performance?.decision_wins?.toString() || '-';
  if (fieldId === 'finish_rate') return fighter.performance?.finish_rate ? `${fighter.performance.finish_rate}%` : '-';
  if (fieldId === 'avg_fight_time') return fighter.performance?.avg_fight_time_minutes?.toString() || '-';
  if (fieldId === 'strike_accuracy') return fighter.performance?.strike_accuracy ? `${fighter.performance.strike_accuracy}%` : '-';
  if (fieldId === 'takedown_accuracy') return fighter.performance?.takedown_accuracy ? `${fighter.performance.takedown_accuracy}%` : '-';
  if (fieldId === 'strikes_landed_per_min') return fighter.performance?.strikes_landed_per_min?.toFixed(1) || '-';
  if (fieldId === 'strikes_absorbed_per_min') return fighter.performance?.strikes_absorbed_per_min?.toFixed(1) || '-';
  if (fieldId === 'takedown_defense') return fighter.performance?.takedown_defense ? `${fighter.performance.takedown_defense}%` : '-';
  if (fieldId === 'submission_defense') return fighter.performance?.submission_defense ? `${fighter.performance.submission_defense}%` : '-';
  if (fieldId === 'win_streak') return fighter.performance?.win_streak?.toString() || '0';
  if (fieldId === 'loss_streak') return fighter.performance?.loss_streak?.toString() || '0';

  // Status
  if (fieldId === 'isActive') return fighter.isActive ? 'Active' : 'Inactive';
  if (fieldId === 'ranking') return fighter.ranking?.toString() || 'Unranked';
  if (fieldId === 'isChampion') return fighter.isChampion ? 'Champion' : 'No';
  if (fieldId === 'rank_global') return fighter.rankGlobal?.toString() || '-';
  if (fieldId === 'rank_promotion') return fighter.rankPromotion?.toString() || '-';
  if (fieldId === 'fighting_out_of') return fighter.fightingOutOf || '-';
  if (fieldId === 'losses_by_ko') return fighter.performance?.losses_by_ko?.toString() || '-';
  if (fieldId === 'losses_by_submission') return fighter.performance?.losses_by_submission?.toString() || '-';
  if (fieldId === 'losses_by_decision') return fighter.performance?.losses_by_decision?.toString() || '-';
  if (fieldId === 'longest_win_streak') return fighter.performance?.longest_win_streak?.toString() || '-';

  // Betting odds
  if (fieldId === 'moneyline') return fighter.odds?.moneyline || '-';
  if (fieldId === 'overUnder') return fighter.odds?.overUnder || '-';
  if (fieldId === 'methodKo') return fighter.odds?.methodKo || '-';
  if (fieldId === 'methodSub') return fighter.odds?.methodSub || '-';
  if (fieldId === 'methodDec') return fighter.odds?.methodDec || '-';
  if (fieldId === 'impliedProbability') return fighter.odds?.impliedProbability ? `${fighter.odds.impliedProbability}%` : '-';

  return '-';
};

// Get field label from fieldGroups
const getFieldLabel = (fieldId: string): string => {
  for (const group of fieldGroups) {
    const field = group.fields.find((f) => f.id === fieldId);
    if (field) return field.label;
  }
  return fieldId;
};

export const ExportDataPreview: React.FC<ExportDataPreviewProps> = ({
  fighters,
  selectedFields,
  onExportCSV,
  onExportXLSX,
}) => {
  const selectedFieldsArray = Array.from(selectedFields);
  const hasFields = selectedFieldsArray.length > 0;

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Data Preview</h3>
          <p className="text-sm text-muted-foreground">
            {fighters.length} fighters · {selectedFieldsArray.length} fields selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCSV}
            disabled={!hasFields || fighters.length === 0}
          >
            <FileText className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onExportXLSX}
            disabled={!hasFields || fighters.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            XLSX
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      {!hasFields ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-border/50 rounded-lg">
          <div className="text-center text-muted-foreground">
            <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select fields to preview export data</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 border border-border/30 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 hover:bg-card/50">
                {selectedFieldsArray.map((fieldId) => (
                  <TableHead
                    key={fieldId}
                    className="text-xs font-semibold text-foreground whitespace-nowrap"
                  >
                    {getFieldLabel(fieldId)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fighters.slice(0, 50).map((fighter, index) => (
                <TableRow
                  key={fighter.id}
                  className={index % 2 === 0 ? 'bg-transparent' : 'bg-card/20'}
                >
                  {selectedFieldsArray.map((fieldId) => (
                    <TableCell
                      key={fieldId}
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      {getFieldValue(fighter, fieldId)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {fighters.length > 50 && (
            <div className="p-3 text-center text-xs text-muted-foreground border-t border-border/30">
              Showing first 50 of {fighters.length} fighters. Full data will be included in export.
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};
