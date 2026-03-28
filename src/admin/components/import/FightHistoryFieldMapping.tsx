import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { FieldMapping } from "@/shared/types/fighter";

interface FightHistoryFieldMappingProps {
  csvHeaders: string[];
  mappings: FieldMapping[];
  onMappingChange: (csvField: string, systemField: string | null) => void;
}

const PER_ROUND_FIELDS = [
  "sig_str_landed", "sig_str_attempted", "sig_str_pct",
  "head_str_landed", "head_str_attempted",
  "body_str_landed", "body_str_attempted",
  "leg_str_landed", "leg_str_attempted",
  "distance_str_landed", "distance_str_attempted",
  "clinch_str_landed", "clinch_str_attempted",
  "ground_str_landed", "ground_str_attempted",
  "kd", "td_landed", "td_attempted", "td_pct",
  "sub_attempts", "reversals", "control_time",
];

const generateRoundFields = (): { group: string; fields: string[] }[] => {
  const groups: { group: string; fields: string[] }[] = [];
  for (let r = 1; r <= 5; r++) {
    groups.push({
      group: `Round ${r} Stats`,
      fields: [
        `r${r}_sig_str`,
        `r${r}_landed_by_target`,
        `r${r}_landed_by_position`,
        ...PER_ROUND_FIELDS.map(f => `r${r}_${f}`),
      ],
    });
  }
  return groups;
};

const FIGHT_HISTORY_FIELDS = [
  { 
    group: "Core Identifiers", 
    fields: ["fight_id", "fighter_id", "fighter_full_name", "fighter_nickname", "opponent_full_name", "opponent_nickname"] 
  },
  { 
    group: "Event Info", 
    fields: ["event_name", "event_date", "event_promotion", "weight_class", "billing", "bout_type", "fight_order", "bout_order", "title_fight", "title_fight_detail", "scheduled_rounds", "round_duration_minutes"] 
  },
  { 
    group: "Result Info", 
    fields: ["result", "method", "method_detail", "round_finished", "time_finished", "referee"] 
  },
  { 
    group: "Decision Details", 
    fields: ["decision_type", "judges"] 
  },
  { 
    group: "Significant Strikes", 
    fields: [
      "significant_strikes_landed", 
      "significant_strikes_attempted",
      "significant_strikes_pct"
    ] 
  },
  { 
    group: "Total Strikes", 
    fields: [
      "total_strikes_landed", 
      "total_strikes_attempted"
    ] 
  },
  { 
    group: "Strike Targets", 
    fields: [
      "head_strikes_landed", 
      "head_strikes_attempted",
      "body_strikes_landed", 
      "body_strikes_attempted",
      "leg_strikes_landed", 
      "leg_strikes_attempted"
    ] 
  },
  { 
    group: "Strike Positions", 
    fields: [
      "distance_strikes_landed", 
      "distance_strikes_attempted",
      "clinch_strikes_landed", 
      "clinch_strikes_attempted",
      "ground_strikes_landed", 
      "ground_strikes_attempted"
    ] 
  },
  { 
    group: "Grappling", 
    fields: [
      "takedowns_landed", 
      "takedowns_attempted", 
      "takedown_pct",
      "submissions_attempted",
      "control_time",
      "reversals"
    ] 
  },
  { 
    group: "Damage", 
    fields: [
      "knockdowns"
    ] 
  },
  { 
    group: "Rounds & Scoring", 
    fields: ["round_time_format", "judges_scores_data"] 
  },
  ...generateRoundFields(),
];

const FightHistoryFieldMapping = ({ csvHeaders, mappings, onMappingChange }: FightHistoryFieldMappingProps) => {
  const mappedCount = mappings.filter(m => m.status === "mapped").length;
  const totalFields = csvHeaders.length;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fight History Field Mapping</CardTitle>
          <Badge variant={mappedCount === totalFields ? "default" : "secondary"}>
            {mappedCount} / {totalFields} mapped
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to fight history fields
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {mappings.map((mapping) => (
          <div
            key={mapping.csvField}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {mapping.csvField}
                </span>
                {mapping.status === "mapped" && (
                  <Check className="w-4 h-4 text-win shrink-0" />
                )}
                {mapping.status === "unmapped" && (
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

            <div className="flex-1 min-w-0">
              <Select
                value={mapping.systemField || "ignore"}
                onValueChange={(value) => 
                  onMappingChange(mapping.csvField, value === "ignore" ? null : value)
                }
              >
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ignore">
                    <span className="text-muted-foreground">— Ignore this field —</span>
                  </SelectItem>
                  {FIGHT_HISTORY_FIELDS.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {group.group}
                      </div>
                      {group.fields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FightHistoryFieldMapping;
