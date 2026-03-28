import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { FieldMapping } from "@/shared/types/fighter";

interface ImportFieldMappingProps {
  csvHeaders: string[];
  mappings: FieldMapping[];
  onMappingChange: (csvField: string, systemField: string | null) => void;
}

const SYSTEM_FIELDS = [
  { group: "Identity", fields: ["id", "first_name", "last_name", "nickname", "date_of_birth", "nationality", "gender", "bio"] },
  { group: "Division", fields: ["organization", "weight_class", "stance", "gym", "head_coach", "team", "fighting_out_of", "style"] },
  { group: "Social", fields: ["social_media.twitter", "social_media.instagram", "social_media.website"] },
  { group: "Physical", fields: ["age", "height", "height_inches", "weight", "reach", "reach_inches", "leg_reach", "leg_reach_inches"] },
  { group: "Record", fields: ["wins", "losses", "draws", "no_contests"] },
  { group: "Performance - Wins", fields: ["ko_wins", "tko_wins", "submission_wins", "decision_wins", "finish_rate", "avg_fight_time", "performance_kotko_win_pct", "performance_submission_win_pct", "performance_decision_win_pct"] },
  { group: "Performance - Losses", fields: ["losses_by_ko", "losses_by_submission", "losses_by_decision"] },
  { group: "Performance - Striking", fields: ["strikes_landed_per_min", "strike_accuracy", "strikes_absorbed_per_min", "strike_defense"] },
  { group: "Performance - Grappling", fields: ["takedown_avg", "takedown_accuracy", "takedown_defense", "submission_avg", "submission_defense"] },
  { group: "Performance - Streaks", fields: ["win_streak", "loss_streak", "ko_streak", "sub_streak", "longest_win_streak"] },
  { group: "Status", fields: ["is_active", "ranking", "is_champion", "is_verified", "rank_global", "rank_promotion"] },
];

const ImportFieldMapping = ({ csvHeaders, mappings, onMappingChange }: ImportFieldMappingProps) => {
  const mappedCount = mappings.filter(m => m.status === "mapped").length;
  const totalFields = csvHeaders.length;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Field Mapping</CardTitle>
          <Badge variant={mappedCount === totalFields ? "default" : "secondary"}>
            {mappedCount} / {totalFields} mapped
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to system fields
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
                  {SYSTEM_FIELDS.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {group.group}
                      </div>
                      {group.fields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
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

export default ImportFieldMapping;
