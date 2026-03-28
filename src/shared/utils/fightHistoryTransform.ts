import { FightRecord, FightStats } from '@/shared/types/fighter';
import { FieldMapping } from '@/shared/types/fighter';

/**
 * Extended FightRecord with fighter linkage for import/export
 * Note: fighterId, fighterName, fighterNickname, opponentNickname, referee 
 * are now part of the base FightRecord interface
 */
export interface ImportableFightRecord extends FightRecord {
  fighterId: string;
  decisionType?: string;
  judges?: string;
}

/**
 * Generate a unique fight ID if not provided
 */
const generateFightId = (fighterId: string, eventDate: string, opponentName: string): string => {
  const base = `${fighterId}-${eventDate}-${opponentName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const timestamp = Date.now().toString(36);
  return `fight-${base}-${timestamp}`;
};

/**
 * Parse numeric value with fallback
 */
const parseNumber = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse integer value with fallback
 */
const parseIntValue = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ''), 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseOptionalInt = (value: string | undefined): number | undefined => {
  if (!value || value === 'NULL' || value.trim() === '') return undefined;
  const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ''), 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Parse boolean value
 */
const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return ['true', 'yes', '1', 'y'].includes(normalized);
};

/**
 * Normalize result to valid FightRecord result
 */
const normalizeResult = (value: string): 'WIN' | 'LOSS' | 'DRAW' | 'NC' | 'PENDING' => {
  if (!value) return 'PENDING';
  const normalized = value.toUpperCase().trim();
  if (['WIN', 'W'].includes(normalized)) return 'WIN';
  if (['LOSS', 'L', 'LOST'].includes(normalized)) return 'LOSS';
  if (['DRAW', 'D'].includes(normalized)) return 'DRAW';
  if (['NC', 'NO CONTEST'].includes(normalized)) return 'NC';
  return 'PENDING';
};

/**
 * Normalize method to valid FightRecord method
 */
const normalizeMethod = (value: string): string => {
  if (!value) return 'TBD';
  const trimmed = value.trim();
  if (trimmed.includes(' - ') || trimmed.includes('Decision')) return trimmed;
  const normalized = trimmed.toUpperCase();
  if (normalized === 'KO' || normalized === 'KNOCKOUT') return 'KO';
  if (normalized === 'TKO' || normalized === 'TECHNICAL KNOCKOUT') return 'TKO';
  if (['SUB', 'SUBMISSION'].includes(normalized)) return 'Submission';
  if (['DEC', 'DECISION'].includes(normalized)) return 'Decision';
  if (['UD', 'UNANIMOUS', 'UNANIMOUS DECISION'].includes(normalized)) return 'Decision - Unanimous';
  if (['SD', 'SPLIT', 'SPLIT DECISION'].includes(normalized)) return 'Decision - Split';
  if (normalized === 'DQ' || normalized === 'DISQUALIFICATION') return 'DQ';
  if (normalized === 'NC' || normalized === 'NO CONTEST') return 'NC';
  return trimmed || 'TBD';
};

/**
 * Normalize fight type
 */
const normalizeFightType = (value: string): FightRecord['fightType'] => {
  if (!value) return 'Main Card';
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('main')) return 'Main Card';
  if (normalized.includes('co-main') || normalized.includes('comain')) return 'Main Card';
  if (normalized.includes('prelim') && normalized.includes('early')) return 'Early Prelim';
  if (normalized.includes('prelim')) return 'Prelim';
  if (normalized.includes('exhibition')) return 'Exhibition';
  return 'Main Card';
};

/**
 * Parse time string (e.g., "4:23" or "4m23s")
 */
const parseTime = (value: string): string => {
  if (!value) return '0:00';
  // Already in MM:SS format
  if (value.includes(':')) return value.trim();
  // Convert from seconds
  const seconds = parseIntValue(value, 0);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get mapped value from row data based on field mappings
 */
const getMappedValue = (
  row: Record<string, string>,
  mappings: FieldMapping[],
  systemField: string
): string | undefined => {
  const mapping = mappings.find(m => m.systemField === systemField);
  if (!mapping) return undefined;
  return row[mapping.csvField]?.trim();
};

/**
 * Transform a CSV row to a FightRecord (with fighter linkage)
 */
export const transformCsvToFightRecord = (
  row: Record<string, string>,
  mappings: FieldMapping[],
  fighterLookup?: (name: string) => string | undefined
): ImportableFightRecord | null => {
  // Get fighter linkage
  const fighterId = getMappedValue(row, mappings, 'fighter_id');
  const fighterFullName = getMappedValue(row, mappings, 'fighter_full_name');
  const opponentName = getMappedValue(row, mappings, 'opponent_full_name') || '';
  const eventDate = getMappedValue(row, mappings, 'event_date') || '';
  const eventName = getMappedValue(row, mappings, 'event_name') || '';

  // Validate required fields (event_date is optional)
  if (!opponentName || !eventName) {
    console.warn('Skipping row: missing required fight history fields', row);
    return null;
  }

  // Determine fighter ID (primary fighter must be resolved)
  let resolvedFighterId = fighterId;
  if (!resolvedFighterId && fighterFullName && fighterLookup) {
    resolvedFighterId = fighterLookup(fighterFullName);
  }

  if (!resolvedFighterId) {
    console.warn('Skipping row: cannot resolve fighter ID', row);
    return null;
  }

  // Attempt to resolve opponent ID (allowed to be empty for partial uploads)
  let resolvedOpponentId: string | null = null;
  let opponentLinked = false;
  if (fighterLookup && opponentName) {
    const foundId = fighterLookup(opponentName);
    if (foundId) {
      resolvedOpponentId = foundId;
      opponentLinked = true;
    }
  }

  // Get or generate fight ID
  const id = getMappedValue(row, mappings, 'fight_id') || generateFightId(resolvedFighterId, eventDate, opponentName);

  // Parse control time (handles "1:37" format or seconds)
  const parseControlTime = (value: string | undefined): number => {
    if (!value) return 0;
    if (value.includes(':')) {
      const parts = value.split(':');
      const mins = parseIntValue(parts[0], 0);
      const secs = parseIntValue(parts[1], 0);
      return mins * 60 + secs;
    }
    return parseIntValue(value, 0);
  };

  // Parse stats - all fields from the comprehensive schema
  const stats: FightStats = {
    // Total strikes
    strikesLanded: parseIntValue(getMappedValue(row, mappings, 'total_strikes_landed'), 0),
    strikesAttempted: parseIntValue(getMappedValue(row, mappings, 'total_strikes_attempted'), 0),
    // Significant strikes
    significantStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'significant_strikes_landed'), 0),
    significantStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'significant_strikes_attempted'), 0),
    // Strike targets
    headStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'head_strikes_landed'), 0),
    headStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'head_strikes_attempted'), 0),
    bodyStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'body_strikes_landed'), 0),
    bodyStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'body_strikes_attempted'), 0),
    legStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'leg_strikes_landed'), 0),
    legStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'leg_strikes_attempted'), 0),
    // Strike positions
    distanceStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'distance_strikes_landed'), 0),
    distanceStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'distance_strikes_attempted'), 0),
    clinchStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'clinch_strikes_landed'), 0),
    clinchStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'clinch_strikes_attempted'), 0),
    groundStrikesLanded: parseIntValue(getMappedValue(row, mappings, 'ground_strikes_landed'), 0),
    groundStrikesAttempted: parseIntValue(getMappedValue(row, mappings, 'ground_strikes_attempted'), 0),
    // Grappling
    takedownsLanded: parseIntValue(getMappedValue(row, mappings, 'takedowns_landed'), 0),
    takedownsAttempted: parseIntValue(getMappedValue(row, mappings, 'takedowns_attempted'), 0),
    submissionAttempts: parseIntValue(getMappedValue(row, mappings, 'submissions_attempted'), 0),
    controlTimeSeconds: parseControlTime(getMappedValue(row, mappings, 'control_time')),
    reversals: parseIntValue(getMappedValue(row, mappings, 'reversals'), 0),
    // Damage
    knockdowns: parseIntValue(getMappedValue(row, mappings, 'knockdowns'), 0),
  };

  const hasStats = Object.values(stats).some(v => v > 0);

  const parseRoundControlTime = (value: string | undefined): string | undefined => {
    if (!value || value === 'NULL' || value === '') return undefined;
    return value.trim();
  };

  const parseCombinedSigStr = (value: string | undefined): { landed: number; attempted: number; pct: number } | null => {
    if (!value || value === 'NULL' || value.trim() === '') return null;
    const match = value.match(/(\d+)\s*of\s*(\d+)\s*-?\s*(\d+)%?/i);
    if (match) {
      return { landed: parseInt(match[1], 10), attempted: parseInt(match[2], 10), pct: parseInt(match[3], 10) };
    }
    return null;
  };

  const parsePercentValue = (value: string | undefined): number | undefined => {
    if (!value || value === 'NULL' || value.trim() === '') return undefined;
    const match = value.match(/(\d+)%?/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  const perRoundStats: FightRecord['per_round_stats'] = [];
  const allPerRoundSuffixes = [
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
  const combinedRoundFields = ["sig_str", "landed_by_target", "landed_by_position"];

  for (let r = 1; r <= 5; r++) {
    const prefix = `r${r}_`;

    const hasIndividualData = allPerRoundSuffixes.some(suffix => {
      const v = getMappedValue(row, mappings, `${prefix}${suffix}`);
      return v && v !== '0' && v !== 'NULL' && v.trim() !== '';
    });
    const hasCombinedData = combinedRoundFields.some(f => {
      const v = getMappedValue(row, mappings, `${prefix}${f}`);
      return v && v !== 'NULL' && v.trim() !== '';
    });
    if (!hasIndividualData && !hasCombinedData) continue;

    const combinedSigStr = parseCombinedSigStr(getMappedValue(row, mappings, `${prefix}sig_str`));
    const sigLandedVal = combinedSigStr?.landed ?? parseIntValue(getMappedValue(row, mappings, `${prefix}sig_str_landed`), 0);
    const sigAttemptedVal = combinedSigStr?.attempted ?? parseIntValue(getMappedValue(row, mappings, `${prefix}sig_str_attempted`), 0);
    const sigPctVal = combinedSigStr?.pct ?? parseOptionalInt(getMappedValue(row, mappings, `${prefix}sig_str_pct`));

    const landedByTarget = parsePercentValue(getMappedValue(row, mappings, `${prefix}landed_by_target`));
    const landedByPosition = parsePercentValue(getMappedValue(row, mappings, `${prefix}landed_by_position`));

    perRoundStats.push({
      round: r,
      sig_str_landed: sigLandedVal,
      sig_str_attempted: sigAttemptedVal,
      sig_str_pct: sigPctVal,
      head_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}head_str_landed`)),
      head_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}head_str_attempted`)),
      body_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}body_str_landed`)),
      body_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}body_str_attempted`)),
      leg_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}leg_str_landed`)),
      leg_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}leg_str_attempted`)),
      distance_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}distance_str_landed`)),
      distance_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}distance_str_attempted`)),
      clinch_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}clinch_str_landed`)),
      clinch_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}clinch_str_attempted`)),
      ground_str_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}ground_str_landed`)),
      ground_str_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}ground_str_attempted`)),
      knockdowns: parseOptionalInt(getMappedValue(row, mappings, `${prefix}kd`)),
      td_landed: parseOptionalInt(getMappedValue(row, mappings, `${prefix}td_landed`)),
      td_attempted: parseOptionalInt(getMappedValue(row, mappings, `${prefix}td_attempted`)),
      td_pct: parseOptionalInt(getMappedValue(row, mappings, `${prefix}td_pct`)),
      sub_attempts: parseOptionalInt(getMappedValue(row, mappings, `${prefix}sub_attempts`)),
      reversals: parseOptionalInt(getMappedValue(row, mappings, `${prefix}reversals`)),
      control_time: parseRoundControlTime(getMappedValue(row, mappings, `${prefix}control_time`)),
      landed_by_target_pct: landedByTarget,
      landed_by_position_pct: landedByPosition,
    });
  }

  // Get nicknames
  const fighterNickname = getMappedValue(row, mappings, 'fighter_nickname');
  const opponentNickname = getMappedValue(row, mappings, 'opponent_nickname');

  const boutType = getMappedValue(row, mappings, 'bout_type') || '';
  const titleFightRaw = getMappedValue(row, mappings, 'title_fight') || '';
  const titleFightDetail = getMappedValue(row, mappings, 'title_fight_detail') || titleFightRaw;
  const boutTypeIsTitle = boutType.toLowerCase().includes('title');
  const isTitleFight = boutTypeIsTitle || parseBoolean(titleFightRaw) || (titleFightDetail.length > 0 && titleFightDetail.toLowerCase() !== 'false' && titleFightDetail.toLowerCase() !== 'no');

  const fightRecord: ImportableFightRecord = {
    id,
    fighterId: resolvedFighterId,
    fighterName: fighterFullName,
    fighterNickname,
    eventId: `event-${eventDate}`,
    opponentId: resolvedOpponentId,
    opponentName,
    opponentNickname,
    opponentLinked,
    eventName,
    eventDate,
    eventPromotion: getMappedValue(row, mappings, 'event_promotion'),
    weightClass: getMappedValue(row, mappings, 'weight_class'),
    fightType: normalizeFightType(getMappedValue(row, mappings, 'fight_order') || getMappedValue(row, mappings, 'billing') || boutType || ''),
    billing: getMappedValue(row, mappings, 'billing') || boutType || undefined,
    boutOrder: parseIntValue(getMappedValue(row, mappings, 'bout_order'), 0),
    roundsScheduled: parseIntValue(getMappedValue(row, mappings, 'scheduled_rounds'), 3),
    roundDurationMinutes: parseIntValue(getMappedValue(row, mappings, 'round_duration_minutes'), 5),
    location: {
      city: '',
      country: '',
      venue: '',
    },
    result: normalizeResult(getMappedValue(row, mappings, 'result') || ''),
    method: normalizeMethod(getMappedValue(row, mappings, 'method') || ''),
    methodDetail: getMappedValue(row, mappings, 'method_detail'),
    round: parseIntValue(getMappedValue(row, mappings, 'round_finished'), 0),
    time: parseTime(getMappedValue(row, mappings, 'time_finished') || ''),
    fightDurationSeconds: 0,
    titleFight: isTitleFight,
    titleFightDetail: isTitleFight ? (titleFightDetail || boutType || undefined) : undefined,
    referee: getMappedValue(row, mappings, 'referee'),
    round_time_format: getMappedValue(row, mappings, 'round_time_format') || undefined,
    isLocked: true,
    stats: hasStats ? stats : undefined,
    per_round_stats: perRoundStats.length > 0 ? perRoundStats : undefined,
    decisionType: getMappedValue(row, mappings, 'decision_type'),
    judges: getMappedValue(row, mappings, 'judges'),
  };

  return fightRecord;
};

/**
 * Transform multiple CSV rows to FightRecord objects
 */
export const transformCsvDataToFightRecords = (
  data: Record<string, string>[],
  mappings: FieldMapping[],
  fighterLookup?: (name: string) => string | undefined
): ImportableFightRecord[] => {
  return data
    .map(row => transformCsvToFightRecord(row, mappings, fighterLookup))
    .filter((f): f is ImportableFightRecord => f !== null);
};

/**
 * Validate that required fields are mapped for fight history
 */
export const validateFightHistoryMappings = (mappings: FieldMapping[]): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['opponent_full_name', 'event_name', 'result'];
  const hasIdentifier = mappings.some(m => 
    m.systemField === 'fighter_id' || m.systemField === 'fighter_full_name'
  );
  
  const mappedFields = mappings
    .filter(m => m.systemField && m.status === 'mapped')
    .map(m => m.systemField);
  
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));
  
  if (!hasIdentifier) {
    missingFields.unshift('fighter_id or fighter_full_name');
  }
  
  return {
    isValid: missingFields.length === 0 && hasIdentifier,
    missingFields,
  };
};

/**
 * Fight history field groups for export
 */
export const fightHistoryFieldGroups = [
  {
    id: 'core',
    label: 'Core Identifiers',
    fields: [
      { id: 'fight_id', label: 'Fight ID' },
      { id: 'fighter_id', label: 'Fighter ID' },
      { id: 'fighter_name', label: 'Fighter Name' },
      { id: 'fighter_nickname', label: 'Fighter Nickname' },
      { id: 'opponent_name', label: 'Opponent Name' },
      { id: 'opponent_nickname', label: 'Opponent Nickname' },
      { id: 'opponent_linked', label: 'Opponent Linked' },
    ],
  },
  {
    id: 'event',
    label: 'Event Info',
    fields: [
      { id: 'event_name', label: 'Event Name' },
      { id: 'event_date', label: 'Event Date' },
      { id: 'event_promotion', label: 'Promotion' },
      { id: 'weight_class', label: 'Weight Class' },
      { id: 'billing', label: 'Billing (Card Placement)' },
      { id: 'bout_type', label: 'Bout Type' },
      { id: 'fight_order', label: 'Fight Order' },
      { id: 'title_fight', label: 'Title Fight' },
      { id: 'title_fight_detail', label: 'Title Fight Detail' },
      { id: 'scheduled_rounds', label: 'Rounds Scheduled' },
      { id: 'round_duration_minutes', label: 'Round Duration (min)' },
    ],
  },
  {
    id: 'result',
    label: 'Result Info',
    fields: [
      { id: 'result', label: 'Result' },
      { id: 'method', label: 'Method' },
      { id: 'method_detail', label: 'Method Detail' },
      { id: 'round_finished', label: 'Round Finished' },
      { id: 'time_finished', label: 'Time Finished' },
      { id: 'decision_type', label: 'Decision Type' },
      { id: 'referee', label: 'Referee' },
    ],
  },
  {
    id: 'sig_strikes',
    label: 'Significant Strikes',
    fields: [
      { id: 'significant_strikes_landed', label: 'Sig. Strikes Landed' },
      { id: 'significant_strikes_attempted', label: 'Sig. Strikes Attempted' },
      { id: 'significant_strikes_pct', label: 'Sig. Strikes %' },
    ],
  },
  {
    id: 'total_strikes',
    label: 'Total Strikes',
    fields: [
      { id: 'total_strikes_landed', label: 'Total Strikes Landed' },
      { id: 'total_strikes_attempted', label: 'Total Strikes Attempted' },
    ],
  },
  {
    id: 'strike_targets',
    label: 'Strike Targets',
    fields: [
      { id: 'head_strikes_landed', label: 'Head Strikes Landed' },
      { id: 'head_strikes_attempted', label: 'Head Strikes Attempted' },
      { id: 'body_strikes_landed', label: 'Body Strikes Landed' },
      { id: 'body_strikes_attempted', label: 'Body Strikes Attempted' },
      { id: 'leg_strikes_landed', label: 'Leg Strikes Landed' },
      { id: 'leg_strikes_attempted', label: 'Leg Strikes Attempted' },
    ],
  },
  {
    id: 'strike_positions',
    label: 'Strike Positions',
    fields: [
      { id: 'distance_strikes_landed', label: 'Distance Strikes Landed' },
      { id: 'distance_strikes_attempted', label: 'Distance Strikes Attempted' },
      { id: 'clinch_strikes_landed', label: 'Clinch Strikes Landed' },
      { id: 'clinch_strikes_attempted', label: 'Clinch Strikes Attempted' },
      { id: 'ground_strikes_landed', label: 'Ground Strikes Landed' },
      { id: 'ground_strikes_attempted', label: 'Ground Strikes Attempted' },
    ],
  },
  {
    id: 'grappling',
    label: 'Grappling',
    fields: [
      { id: 'takedowns_landed', label: 'Takedowns Landed' },
      { id: 'takedowns_attempted', label: 'Takedowns Attempted' },
      { id: 'takedown_pct', label: 'Takedown %' },
      { id: 'submissions_attempted', label: 'Submissions Attempted' },
      { id: 'control_time', label: 'Control Time (sec)' },
      { id: 'reversals', label: 'Reversals' },
    ],
  },
  {
    id: 'damage',
    label: 'Damage',
    fields: [
      { id: 'knockdowns', label: 'Knockdowns' },
    ],
  },
  {
    id: 'rounds_scoring',
    label: 'Rounds & Scoring',
    fields: [
      { id: 'round_time_format', label: 'Round Time Format' },
    ],
  },
  ...(() => {
    const roundGroups = [];
    for (let r = 1; r <= 5; r++) {
      roundGroups.push({
        id: `round_${r}`,
        label: `Round ${r} Stats`,
        fields: [
          { id: `r${r}_sig_str_landed`, label: `R${r} Sig Str Landed` },
          { id: `r${r}_sig_str_attempted`, label: `R${r} Sig Str Attempted` },
          { id: `r${r}_sig_str_pct`, label: `R${r} Sig Str %` },
          { id: `r${r}_head_str_landed`, label: `R${r} Head Str Landed` },
          { id: `r${r}_head_str_attempted`, label: `R${r} Head Str Attempted` },
          { id: `r${r}_body_str_landed`, label: `R${r} Body Str Landed` },
          { id: `r${r}_body_str_attempted`, label: `R${r} Body Str Attempted` },
          { id: `r${r}_leg_str_landed`, label: `R${r} Leg Str Landed` },
          { id: `r${r}_leg_str_attempted`, label: `R${r} Leg Str Attempted` },
          { id: `r${r}_distance_str_landed`, label: `R${r} Distance Str Landed` },
          { id: `r${r}_distance_str_attempted`, label: `R${r} Distance Str Attempted` },
          { id: `r${r}_clinch_str_landed`, label: `R${r} Clinch Str Landed` },
          { id: `r${r}_clinch_str_attempted`, label: `R${r} Clinch Str Attempted` },
          { id: `r${r}_ground_str_landed`, label: `R${r} Ground Str Landed` },
          { id: `r${r}_ground_str_attempted`, label: `R${r} Ground Str Attempted` },
          { id: `r${r}_kd`, label: `R${r} Knockdowns` },
          { id: `r${r}_td_landed`, label: `R${r} TD Landed` },
          { id: `r${r}_td_attempted`, label: `R${r} TD Attempted` },
          { id: `r${r}_td_pct`, label: `R${r} TD %` },
          { id: `r${r}_sub_attempts`, label: `R${r} Sub Attempts` },
          { id: `r${r}_reversals`, label: `R${r} Reversals` },
          { id: `r${r}_control_time`, label: `R${r} Control Time` },
          { id: `r${r}_landed_by_target_pct`, label: `R${r} Target %` },
          { id: `r${r}_landed_by_position_pct`, label: `R${r} Position %` },
        ],
      });
    }
    return roundGroups;
  })(),
];
