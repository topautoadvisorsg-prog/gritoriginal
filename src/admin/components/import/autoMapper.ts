import { FieldMapping } from "@/shared/types/fighter";

type DataType = "fighters" | "fightHistory";

export function autoMapFields(headers: string[], type: DataType): FieldMapping[] {
  if (type === "fighters") {
    const systemFields = [
      "id", "first_name", "last_name", "nickname", "date_of_birth", "nationality", "gender",
      "organization", "weight_class", "stance", "gym", "head_coach", "team", "fighting_out_of",
      "age", "height", "height_inches", "weight", "reach", "reach_inches", "leg_reach", "leg_reach_inches",
      "wins", "losses", "draws", "no_contests",
      "ko_wins", "tko_wins", "submission_wins", "decision_wins", "finish_rate", "avg_fight_time",
      "losses_by_ko", "losses_by_submission", "losses_by_decision",
      "strike_accuracy", "takedown_accuracy", "strikes_landed_per_min", "strikes_absorbed_per_min",
      "strike_defense", "takedown_defense", "submission_defense", "takedown_avg", "submission_avg",
      "win_streak", "loss_streak", "longest_win_streak",
      "is_active", "ranking", "is_champion", "rank_global", "rank_promotion", "image_url",
      "performance_kotko_win_pct", "performance_submission_win_pct", "performance_decision_win_pct"
    ];

    const aliases: Record<string, string[]> = {
      'first_name': ['firstname', 'first'],
      'last_name': ['lastname', 'last'],
      'weight_class': ['division', 'class', 'weightclass'],
      'organization': ['org', 'promotion'],
      'gym': ['affiliation'],
      'nationality': ['country'],
      'strikes_landed_per_min': ['slpm', 'performanceslpm'],
      'strike_accuracy': ['stracc', 'straccpct', 'performancestracc'],
      'strikes_absorbed_per_min': ['sapm', 'performancesapm'],
      'strike_defense': ['strdef', 'strdefpct', 'performancestrdef'],
      'takedown_avg': ['tdavg', 'performancetdavg'],
      'takedown_accuracy': ['tdacc', 'tdaccpct', 'performancetdacc'],
      'takedown_defense': ['tddef', 'tddefpct', 'performancetddef'],
      'submission_avg': ['subavg', 'performancesubavg'],
      'performance_kotko_win_pct': ['kotkowinpct', 'performancekotkopct', 'kotkopct', 'performancekotkowinpct'],
      'performance_submission_win_pct': ['submissionwinpct', 'performancesubwinpct', 'subwinpct', 'performancesubmissionwinpct'],
      'performance_decision_win_pct': ['decisionwinpct', 'performancedecisionpct', 'decisionpct', 'performancedecisionwinpct'],
    };

    return headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");
      
      const exactMatch = systemFields.find(sf => {
        const normalizedSf = sf.toLowerCase().replace(/_/g, "");
        return normalizedSf === normalizedHeader;
      });
      if (exactMatch) {
        return { csvField: header, systemField: exactMatch, status: "mapped" as const };
      }

      const aliasMatch = Object.entries(aliases).find(([, aliasList]) =>
        aliasList.includes(normalizedHeader)
      );
      if (aliasMatch) {
        return { csvField: header, systemField: aliasMatch[0], status: "mapped" as const };
      }

      const substringMatch = systemFields
        .filter(sf => {
          const normalizedSf = sf.toLowerCase().replace(/_/g, "");
          return normalizedHeader.includes(normalizedSf);
        })
        .sort((a, b) => b.length - a.length)[0];

      return {
        csvField: header,
        systemField: substringMatch || null,
        status: substringMatch ? "mapped" as const : "unmapped" as const,
      };
    });
  } else {
    const perRoundStatFields = [
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
    const roundSystemFields: string[] = [];
    for (let r = 1; r <= 5; r++) {
      perRoundStatFields.forEach(f => roundSystemFields.push(`r${r}_${f}`));
      roundSystemFields.push(`r${r}_sig_str`);
      roundSystemFields.push(`r${r}_landed_by_target`);
      roundSystemFields.push(`r${r}_landed_by_position`);
    }

    const systemFields = [
      "fight_id", "fighter_id", "fighter_full_name", "fighter_nickname", "opponent_full_name", "opponent_nickname",
      "event_name", "event_date", "event_promotion", "weight_class", "billing", "bout_type",
      "fight_order", "title_fight", "title_fight_detail", "scheduled_rounds", "round_duration_minutes", "bout_order",
      "result", "method", "method_detail", "round_finished", "time_finished", "referee",
      "decision_type", "judges",
      "knockdowns", "significant_strikes_landed", "significant_strikes_attempted", "significant_strikes_pct",
      "total_strikes_landed", "total_strikes_attempted",
      "takedowns_landed", "takedowns_attempted", "takedown_pct", "submissions_attempted",
      "control_time", "reversals",
      "head_strikes_landed", "head_strikes_attempted",
      "body_strikes_landed", "body_strikes_attempted",
      "leg_strikes_landed", "leg_strikes_attempted",
      "distance_strikes_landed", "distance_strikes_attempted",
      "clinch_strikes_landed", "clinch_strikes_attempted",
      "ground_strikes_landed", "ground_strikes_attempted",
      "round_time_format",
      ...roundSystemFields,
    ];

    const fightAliases: Record<string, string[]> = {
      'knockdowns': ['kd'],
      'significant_strikes_landed': ['sigstrlanded', 'sigstrikelanded'],
      'significant_strikes_attempted': ['sigstrattempted', 'sigstrikeattempted'],
      'significant_strikes_pct': ['sigstrpct', 'sigstrikepct'],
      'takedowns_landed': ['tdlanded'],
      'takedowns_attempted': ['tdattempted'],
      'takedown_pct': ['tdpct'],
      'submissions_attempted': ['subattempts', 'subatt'],
      'scheduled_rounds': ['roundsscheduled'],
      'bout_type': ['bouttype'],
    };

    return headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");
      
      const exactMatch = systemFields.find(sf => {
        const normalizedSf = sf.toLowerCase().replace(/_/g, "");
        return normalizedSf === normalizedHeader;
      });
      if (exactMatch) {
        return { csvField: header, systemField: exactMatch, status: "mapped" as const };
      }

      const aliasMatch = Object.entries(fightAliases).find(([, aliasList]) =>
        aliasList.includes(normalizedHeader)
      );
      if (aliasMatch) {
        return { csvField: header, systemField: aliasMatch[0], status: "mapped" as const };
      }

      const substringMatch = systemFields
        .filter(sf => {
          const normalizedSf = sf.toLowerCase().replace(/_/g, "");
          return normalizedHeader.includes(normalizedSf);
        })
        .sort((a, b) => b.length - a.length)[0];

      return {
        csvField: header,
        systemField: substringMatch || null,
        status: substringMatch ? "mapped" as const : "unmapped" as const,
      };
    });
  }
}
