import { Fighter, Organization, WeightClass, ALL_WEIGHT_CLASSES } from '@/shared/types/fighter';
import { FieldMapping } from '@/shared/types/fighter';

/**
 * Generate a unique ID for a fighter if not provided.
 * Uses a deterministic approach based on name when possible.
 */
const generateFighterId = (firstName: string, lastName: string): string => {
  const base = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
};

/**
 * Normalize organization names to valid Organization type
 */
const normalizeOrganization = (value: string): Organization => {
  const normalized = value?.toUpperCase().trim();
  if (['UFC', 'ONE', 'PFL', 'BELLATOR'].includes(normalized)) {
    return normalized as Organization;
  }
  return 'UFC'; // Default
};

/**
 * Normalize weight class to valid WeightClass type
 */
const normalizeWeightClass = (value: string): WeightClass => {
  if (!value) return 'Welterweight'; // Default
  
  const normalized = value.trim().toLowerCase();
  
  // Try exact match first
  const exactMatch = ALL_WEIGHT_CLASSES.find(
    wc => wc.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch;
  
  // Try partial matches
  const partialMatch = ALL_WEIGHT_CLASSES.find(
    wc => wc.toLowerCase().includes(normalized) || normalized.includes(wc.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  return 'Welterweight'; // Default fallback
};

/**
 * Normalize stance
 */
const normalizeStance = (value: string): 'Orthodox' | 'Southpaw' | 'Switch' => {
  const normalized = value?.toLowerCase().trim();
  if (normalized === 'southpaw' || normalized === 'south paw') return 'Southpaw';
  if (normalized === 'switch') return 'Switch';
  return 'Orthodox';
};

/**
 * Normalize gender
 */
const normalizeGender = (value: string): 'Male' | 'Female' => {
  const normalized = value?.toLowerCase().trim();
  if (normalized === 'female' || normalized === 'f' || normalized === 'woman' || normalized === 'w') {
    return 'Female';
  }
  return 'Male';
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
const parseInt = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ''), 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse boolean value
 */
const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return ['true', 'yes', '1', 'y', 'active'].includes(normalized);
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
 * Transform a CSV row to a Fighter object using field mappings.
 * Applies defaults for missing optional fields.
 */
export const transformCsvToFighter = (
  row: Record<string, string>,
  mappings: FieldMapping[]
): Fighter | null => {
  // Get mapped values (using snake_case field names)
  const firstName = getMappedValue(row, mappings, 'first_name') || '';
  const lastName = getMappedValue(row, mappings, 'last_name') || '';
  const organization = getMappedValue(row, mappings, 'organization') || 'UFC';
  const weightClass = getMappedValue(row, mappings, 'weight_class') || '';
  
  // Validate required fields
  if (!firstName || !lastName) {
    console.warn('Skipping row: missing required name fields', row);
    return null;
  }
  
  if (!weightClass) {
    console.warn('Skipping row: missing weight class', row);
    return null;
  }

  // Get ID or generate one
  const id = getMappedValue(row, mappings, 'id') || generateFighterId(firstName, lastName);
  
  const now = new Date().toISOString();
  
  const fighter: Fighter = {
    id,
    firstName,
    lastName,
    nickname: getMappedValue(row, mappings, 'nickname') || undefined,
    dateOfBirth: getMappedValue(row, mappings, 'date_of_birth') || undefined,
    nationality: getMappedValue(row, mappings, 'nationality') || 'Unknown',
    gender: normalizeGender(getMappedValue(row, mappings, 'gender') || 'Male'),
    weightClass: normalizeWeightClass(weightClass),
    stance: normalizeStance(getMappedValue(row, mappings, 'stance') || 'Orthodox'),
    gym: getMappedValue(row, mappings, 'gym') || 'Unknown',
    headCoach: getMappedValue(row, mappings, 'head_coach') || 'Unknown',
    team: getMappedValue(row, mappings, 'team') || undefined,
    fightingOutOf: getMappedValue(row, mappings, 'fighting_out_of') || undefined,
    style: getMappedValue(row, mappings, 'style') || undefined,
    bio: getMappedValue(row, mappings, 'bio') || undefined,
    imageUrl: getMappedValue(row, mappings, 'image_url') || '/placeholder.svg',
    bodyImageUrl: getMappedValue(row, mappings, 'body_image_url') || undefined,
    organization: normalizeOrganization(organization),
    
    physicalStats: {
      age: parseInt(getMappedValue(row, mappings, 'age'), 0),
      height: getMappedValue(row, mappings, 'height') || '',
      height_inches: parseInt(getMappedValue(row, mappings, 'height_inches'), 0),
      reach: getMappedValue(row, mappings, 'reach') || '',
      reach_inches: parseInt(getMappedValue(row, mappings, 'reach_inches'), 0),
      leg_reach: getMappedValue(row, mappings, 'leg_reach') || '',
      leg_reach_inches: parseInt(getMappedValue(row, mappings, 'leg_reach_inches'), 0),
      weight: parseInt(getMappedValue(row, mappings, 'weight'), 0),
    },
    
    record: {
      wins: parseInt(getMappedValue(row, mappings, 'wins'), 0),
      losses: parseInt(getMappedValue(row, mappings, 'losses'), 0),
      draws: parseInt(getMappedValue(row, mappings, 'draws'), 0),
      noContests: parseInt(getMappedValue(row, mappings, 'no_contests'), 0),
    },
    
    performance: {
      ko_wins: parseInt(getMappedValue(row, mappings, 'ko_wins'), 0),
      tko_wins: parseInt(getMappedValue(row, mappings, 'tko_wins'), 0),
      submission_wins: parseInt(getMappedValue(row, mappings, 'submission_wins'), 0),
      decision_wins: parseInt(getMappedValue(row, mappings, 'decision_wins'), 0),
      losses_by_ko: parseInt(getMappedValue(row, mappings, 'losses_by_ko'), 0),
      losses_by_submission: parseInt(getMappedValue(row, mappings, 'losses_by_submission'), 0),
      losses_by_decision: parseInt(getMappedValue(row, mappings, 'losses_by_decision'), 0),
      finish_rate: parseNumber(getMappedValue(row, mappings, 'finish_rate'), 0),
      avg_fight_time_minutes: parseNumber(getMappedValue(row, mappings, 'avg_fight_time'), 0),
      strike_accuracy: parseNumber(getMappedValue(row, mappings, 'strike_accuracy'), 0),
      strike_defense: parseNumber(getMappedValue(row, mappings, 'strike_defense'), 0),
      takedown_avg: parseNumber(getMappedValue(row, mappings, 'takedown_avg'), 0),
      takedown_accuracy: parseNumber(getMappedValue(row, mappings, 'takedown_accuracy'), 0),
      strikes_landed_per_min: parseNumber(getMappedValue(row, mappings, 'strikes_landed_per_min'), 0),
      strikes_absorbed_per_min: parseNumber(getMappedValue(row, mappings, 'strikes_absorbed_per_min'), 0),
      takedown_defense: parseNumber(getMappedValue(row, mappings, 'takedown_defense'), 0),
      submission_defense: parseNumber(getMappedValue(row, mappings, 'submission_defense'), 0),
      submission_avg: parseNumber(getMappedValue(row, mappings, 'submission_avg'), 0),
      win_streak: parseInt(getMappedValue(row, mappings, 'win_streak'), 0),
      loss_streak: parseInt(getMappedValue(row, mappings, 'loss_streak'), 0),
      longest_win_streak: parseInt(getMappedValue(row, mappings, 'longest_win_streak'), 0),
      ko_streak: parseInt(getMappedValue(row, mappings, 'ko_streak'), 0),
      sub_streak: parseInt(getMappedValue(row, mappings, 'sub_streak'), 0),
      kotko_win_pct: parseNumber(getMappedValue(row, mappings, 'performance_kotko_win_pct'), 0) || undefined,
      submission_win_pct: parseNumber(getMappedValue(row, mappings, 'performance_submission_win_pct'), 0) || undefined,
      decision_win_pct: parseNumber(getMappedValue(row, mappings, 'performance_decision_win_pct'), 0) || undefined,
    },
    
    history: [],
    notes: [],
    riskSignals: [],
    
    isActive: parseBoolean(getMappedValue(row, mappings, 'is_active') || 'true'),
    ranking: parseInt(getMappedValue(row, mappings, 'ranking'), 0) || undefined,
    rankGlobal: parseInt(getMappedValue(row, mappings, 'rank_global'), 0) || undefined,
    rankPromotion: parseInt(getMappedValue(row, mappings, 'rank_promotion'), 0) || undefined,
    isChampion: parseBoolean(getMappedValue(row, mappings, 'is_champion')),
    isVerified: parseBoolean(getMappedValue(row, mappings, 'is_verified') || 'false'),
    
    lastUpdated: now,
    createdAt: now,
  };
  
  return fighter;
};

/**
 * Transform multiple CSV rows to Fighter objects.
 * Filters out invalid/null transformations.
 */
export const transformCsvDataToFighters = (
  data: Record<string, string>[],
  mappings: FieldMapping[]
): Fighter[] => {
  return data
    .map(row => transformCsvToFighter(row, mappings))
    .filter((f): f is Fighter => f !== null);
};

/**
 * Validate that required fields are mapped
 */
export const validateMappings = (mappings: FieldMapping[]): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['first_name', 'last_name', 'weight_class', 'organization'];
  const mappedFields = mappings
    .filter(m => m.systemField && m.status === 'mapped')
    .map(m => m.systemField);
  
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
