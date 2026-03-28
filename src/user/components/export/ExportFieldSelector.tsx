import React from 'react';
import { Search, Database } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';

export interface FieldGroup {
  id: string;
  label: string;
  fields: { id: string; label: string }[];
}

export const fieldGroups: FieldGroup[] = [
  {
    id: 'identity',
    label: 'Identity',
    fields: [
      { id: 'id', label: 'Fighter ID' },
      { id: 'firstName', label: 'First Name' },
      { id: 'lastName', label: 'Last Name' },
      { id: 'nickname', label: 'Nickname' },
      { id: 'dateOfBirth', label: 'Date of Birth' },
      { id: 'nationality', label: 'Nationality' },
      { id: 'gender', label: 'Gender' },
    ],
  },
  {
    id: 'division',
    label: 'Division Info',
    fields: [
      { id: 'organization', label: 'Organization' },
      { id: 'weightClass', label: 'Weight Class' },
      { id: 'stance', label: 'Stance' },
      { id: 'gym', label: 'Gym' },
      { id: 'headCoach', label: 'Head Coach' },
      { id: 'team', label: 'Team' },
      { id: 'fighting_out_of', label: 'Fighting Out Of' },
    ],
  },
  {
    id: 'physical',
    label: 'Physical Stats',
    fields: [
      { id: 'age', label: 'Age' },
      { id: 'height', label: 'Height' },
      { id: 'reach', label: 'Reach' },
      { id: 'leg_reach', label: 'Leg Reach' },
      { id: 'weight', label: 'Weight' },
    ],
  },
  {
    id: 'record',
    label: 'Record',
    fields: [
      { id: 'wins', label: 'Wins' },
      { id: 'losses', label: 'Losses' },
      { id: 'draws', label: 'Draws' },
      { id: 'noContests', label: 'No Contests' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance Metrics',
    fields: [
      { id: 'ko_wins', label: 'KO Wins' },
      { id: 'tko_wins', label: 'TKO Wins' },
      { id: 'submission_wins', label: 'Submission Wins' },
      { id: 'decision_wins', label: 'Decision Wins' },
      { id: 'finish_rate', label: 'Finish Rate' },
      { id: 'avg_fight_time', label: 'Avg Fight Time' },
      { id: 'strike_accuracy', label: 'Strike Accuracy' },
      { id: 'takedown_accuracy', label: 'Takedown Accuracy' },
      { id: 'strikes_landed_per_min', label: 'Strikes Landed/Min' },
      { id: 'strikes_absorbed_per_min', label: 'Strikes Absorbed/Min' },
      { id: 'takedown_defense', label: 'Takedown Defense' },
      { id: 'submission_defense', label: 'Submission Defense' },
      { id: 'win_streak', label: 'Win Streak' },
      { id: 'loss_streak', label: 'Loss Streak' },
      { id: 'longest_win_streak', label: 'Longest Win Streak' },
    ],
  },
  {
    id: 'performance_losses',
    label: 'Performance - Losses',
    fields: [
      { id: 'losses_by_ko', label: 'KO/TKO Losses' },
      { id: 'losses_by_submission', label: 'Submission Losses' },
      { id: 'losses_by_decision', label: 'Decision Losses' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    fields: [
      { id: 'isActive', label: 'Active/Inactive' },
      { id: 'ranking', label: 'Ranking' },
      { id: 'isChampion', label: 'Champion Status' },
      { id: 'rank_global', label: 'Global Ranking' },
      { id: 'rank_promotion', label: 'Promotion Ranking' },
    ],
  },
  {
    id: 'betting',
    label: 'Betting Odds',
    fields: [
      { id: 'moneyline', label: 'Moneyline' },
      { id: 'overUnder', label: 'Over/Under' },
      { id: 'methodKo', label: 'Method KO' },
      { id: 'methodSub', label: 'Method Sub' },
      { id: 'methodDec', label: 'Method Dec' },
      { id: 'impliedProbability', label: 'Implied Probability' },
    ],
  },
];

interface ExportFieldSelectorProps {
  selectedFields: Set<string>;
  onFieldToggle: (fieldId: string) => void;
  onGroupToggle: (groupId: string, fields: string[]) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dataSource: string;
  onDataSourceChange: (source: string) => void;
  fieldGroups?: FieldGroup[];
  hasFightHistory?: boolean;
}

export const ExportFieldSelector: React.FC<ExportFieldSelectorProps> = ({
  selectedFields,
  onFieldToggle,
  onGroupToggle,
  onSelectAll,
  onClearAll,
  searchQuery,
  onSearchChange,
  dataSource,
  onDataSourceChange,
  fieldGroups: customFieldGroups,
  hasFightHistory = false,
}) => {
  const activeFieldGroups = customFieldGroups || fieldGroups;
  const allFieldIds = activeFieldGroups.flatMap((g) => g.fields.map((f) => f.id));
  const allSelected = allFieldIds.every((id) => selectedFields.has(id));

  const isGroupFullySelected = (group: FieldGroup) =>
    group.fields.every((f) => selectedFields.has(f.id));

  const isGroupPartiallySelected = (group: FieldGroup) =>
    group.fields.some((f) => selectedFields.has(f.id)) && !isGroupFullySelected(group);

  return (
    <div className="glass-card p-4 space-y-4 h-fit">
      <div className="flex items-center gap-2 text-primary">
        <Database className="h-5 w-5" />
        <h3 className="font-semibold text-foreground">Export Configuration</h3>
      </div>

      {/* Data Source */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Data Source
        </Label>
        <Select value={dataSource} onValueChange={onDataSourceChange}>
          <SelectTrigger className="bg-card/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fighters">Fighter Data</SelectItem>
            <SelectItem value="fights" disabled={!hasFightHistory}>
              Fight History {!hasFightHistory && '(No data)'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={dataSource === 'fights' ? "Filter fights..." : "Filter fighters..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card/50 border-border/50"
        />
      </div>

      {/* Select All / Clear All */}
      <div className="flex items-center justify-between py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={() => (allSelected ? onClearAll() : onSelectAll())}
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All Fields
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedFields.size} / {allFieldIds.length}
        </span>
      </div>

      {/* Field Groups */}
      <Accordion type="multiple" defaultValue={['identity', 'record', 'core']} className="space-y-1">
        {activeFieldGroups.map((group) => (
          <AccordionItem
            key={group.id}
            value={group.id}
            className="border border-border/30 rounded-lg px-3 bg-card/30"
          >
            <div className="flex items-center gap-2 py-3">
              <Checkbox
                checked={isGroupFullySelected(group)}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement).dataset.state = isGroupPartiallySelected(group)
                      ? 'indeterminate'
                      : isGroupFullySelected(group)
                        ? 'checked'
                        : 'unchecked';
                  }
                }}
                onCheckedChange={() =>
                  onGroupToggle(
                    group.id,
                    group.fields.map((f) => f.id)
                  )
                }
              />
              <AccordionTrigger className="flex-1 hover:no-underline py-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{group.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({group.fields.filter((f) => selectedFields.has(f.id)).length}/{group.fields.length})
                  </span>
                </div>
              </AccordionTrigger>
            </div>
            <AccordionContent className="pb-3">
              <div className="space-y-2 pl-6">
                {group.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.has(field.id)}
                      onCheckedChange={() => onFieldToggle(field.id)}
                    />
                    <Label
                      htmlFor={field.id}
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
