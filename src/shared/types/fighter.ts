// Fighter Profile Types - Core Identity & Fight History

export type Organization = 'UFC' | 'ONE' | 'PFL' | 'Bellator';

export const WEIGHT_CLASSES_MALE = [
  'Heavyweight',
  'Light Heavyweight',
  'Middleweight',
  'Welterweight',
  'Lightweight',
  'Featherweight',
  'Bantamweight',
  'Flyweight',
] as const;

export const WEIGHT_CLASSES_FEMALE = [
  "Women's Featherweight",
  "Women's Bantamweight",
  "Women's Flyweight",
  "Women's Strawweight",
] as const;

export const ALL_WEIGHT_CLASSES = [...WEIGHT_CLASSES_MALE, ...WEIGHT_CLASSES_FEMALE] as const;

export type WeightClass = typeof ALL_WEIGHT_CLASSES[number];

export interface PhysicalStats {
  age: number;
  height: string;
  height_inches: number;
  reach: string;
  reach_inches: number;
  leg_reach: string;
  leg_reach_inches: number;
  weight: number;
}

export interface FightStats {
  // Total strikes
  strikesLanded: number;
  strikesAttempted: number;
  // Significant strikes
  significantStrikesLanded: number;
  significantStrikesAttempted: number;
  // Strike targets
  headStrikesLanded: number;
  headStrikesAttempted: number;
  bodyStrikesLanded: number;
  bodyStrikesAttempted: number;
  legStrikesLanded: number;
  legStrikesAttempted: number;
  // Strike positions
  distanceStrikesLanded: number;
  distanceStrikesAttempted: number;
  clinchStrikesLanded: number;
  clinchStrikesAttempted: number;
  groundStrikesLanded: number;
  groundStrikesAttempted: number;
  // Grappling
  takedownsLanded: number;
  takedownsAttempted: number;
  submissionAttempts: number;
  controlTimeSeconds: number;
  reversals?: number;
  // Damage
  knockdowns: number;
}

/**
 * FightRecord - Immutable Ledger Entry
 * 
 * Each record represents one historical fight - an immutable record once finalized.
 * Pre-fight records are editable (picks, predictions), post-fight records are locked.
 * 
 * Key Fields:
 * - eventId: Required for Event tab integration (links to Event.id)
 * - eventName: Display name for UI convenience
 * - isLocked: When true, record is finalized and read-only
 */
export interface FightRecord {
  id: string;
  eventId: string; // Required: Links to Event.id for Event tab integration
  // Fighter info (for display convenience)
  fighterId?: string;
  fighterName?: string;
  fighterNickname?: string;
  // Opponent info
  opponentId: string | null;
  opponentName: string;
  opponentNickname?: string;
  opponentLinked?: boolean;
  // Event info
  eventName: string;
  eventDate: string;
  eventPromotion?: string;
  weightClass?: string;
  fightType: 'Main Card' | 'Prelim' | 'Early Prelim' | 'Exhibition';
  billing?: string;
  boutOrder: number;
  roundsScheduled?: number;
  roundDurationMinutes?: number;
  location: {
    city: string;
    state?: string;
    country: string;
    venue: string;
    gpsCoordinates?: { lat: number; lng: number };
  };
  // Result
  result: 'WIN' | 'LOSS' | 'DRAW' | 'NC' | 'PENDING';
  method: string;
  methodDetail?: string;
  round: number;
  time: string;
  fightDurationSeconds: number;
  titleFight: boolean;
  titleFightDetail?: string;
  referee?: string;
  round_time_format?: string;
  judges_scores_data?: Array<{
    judge_name: string;
    fighter_score: number;
    opponent_score: number;
  }>;
  per_round_stats?: Array<{
    round: number;
    sig_str_landed: number;
    sig_str_attempted: number;
    sig_str_pct?: number;
    total_str_landed?: number;
    total_str_attempted?: number;
    td_landed?: number;
    td_attempted?: number;
    td_pct?: number;
    sub_attempts?: number;
    control_time?: string;
    knockdowns?: number;
    reversals?: number;
    head_str_landed?: number;
    head_str_attempted?: number;
    body_str_landed?: number;
    body_str_attempted?: number;
    leg_str_landed?: number;
    leg_str_attempted?: number;
    distance_str_landed?: number;
    distance_str_attempted?: number;
    clinch_str_landed?: number;
    clinch_str_attempted?: number;
    ground_str_landed?: number;
    ground_str_attempted?: number;
    landed_by_target_pct?: number;
    landed_by_position_pct?: number;
  }>;
  isLocked: boolean; // When true, fight is finalized and cannot be edited
  stats?: FightStats;
  oddsSnapshot?: {
    openingMoneyline: number;
    closingMoneyline?: number;
    method?: string;
    totals?: string;
  };
  // Optional contextual fields
  travelDistance?: number;
  venueAltitude?: number;
  mediaPressure?: boolean;
  gymChanges?: boolean;
  injuryFlags?: string[];
  refereeNotes?: string[];
  penaltyDeductions?: { round: number; reason: string }[];
  weightCutSuccess?: boolean;
  adminNotes?: string[];
}

export interface PerformanceMetrics {
  ko_wins: number;
  tko_wins: number;
  submission_wins: number;
  decision_wins: number;
  losses_by_ko: number;
  losses_by_submission: number;
  losses_by_decision: number;
  finish_rate: number;
  avg_fight_time_minutes: number;
  strike_accuracy: number;
  strike_defense: number;
  takedown_avg: number;
  takedown_accuracy: number;
  strikes_landed_per_min: number;
  strikes_absorbed_per_min: number;
  takedown_defense: number;
  submission_defense: number;
  submission_avg: number;
  win_streak: number;
  loss_streak: number;
  longest_win_streak: number;
  ko_streak: number;
  sub_streak: number;
}

export interface OddsData {
  moneyline: string;
  overUnder: string;
  methodKo: string;
  methodSub: string;
  methodDec: string;
  impliedProbability?: number;
}

/**
 * FighterNote - User or Admin notes attached to a fighter
 */
export interface FighterNote {
  id: string;
  type: 'user' | 'admin' | 'system' | 'risk';
  content: string;
  createdAt: string;
  author?: string;
}

/**
 * RiskSignal - Contextual risk indicators for a fighter
 */
export interface RiskSignal {
  id: string;
  type: 'injury' | 'travel' | 'layoff' | 'weight_cut' | 'camp' | 'form';
  label: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

/**
 * Fighter - Primary Data Authority
 * 
 * The Fighter Profile is the single source of truth in the system.
 * All modules (Event, Fight Card, Picks, Analytics, Import/Export) read from this profile.
 * 
 * Image Fields:
 * - imageUrl: Primary profile/headshot image
 * - bodyImageUrl: Full body fight stance image (optional)
 * 
 * Data Ownership:
 * - notes: User and admin notes (empty array when none)
 * - riskSignals: Contextual risk indicators (empty array when none)
 * - history: Fight history ledger (empty array when none, never undefined)
 */
export interface Fighter {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  dateOfBirth: string;
  nationality: string;
  gender: 'Male' | 'Female';
  weightClass: WeightClass;
  stance: 'Orthodox' | 'Southpaw' | 'Switch';
  gym: string;
  headCoach: string;
  team?: string;
  fightingOutOf?: string;
  style?: string;
  bio?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };

  // Images (only 2: profile + body)
  imageUrl: string; // Primary profile/headshot image
  bodyImageUrl?: string; // Full body fight stance image

  organization: Organization;
  physicalStats: PhysicalStats;
  record: {
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
  };
  performance: PerformanceMetrics;

  // Fight History Ledger - immutable records
  history: FightRecord[];

  // Dynamic data fields (empty arrays when no data)
  notes: FighterNote[];
  riskSignals: RiskSignal[];

  odds?: OddsData;

  // Optional fields
  campStartDate?: string;
  trainingPartners?: string[];
  dominantHand?: 'Right' | 'Left';
  dominantFoot?: 'Right' | 'Left';
  isActive: boolean;
  ranking?: number;
  rankGlobal?: number;
  rankPromotion?: number;
  isChampion?: boolean;
  isVerified: boolean;
  lastUpdated: string;
  createdAt: string;
}

// User & Fantasy Types
export interface FantasyPick {
  id: string;
  eventId: string;
  fightId: string;
  userId: string;
  selectedFighterId: string;
  methodPrediction: 'KO' | 'TKO' | 'Submission' | 'Decision';
  roundPrediction: number;
  confidenceScore: number; // 1-10
  userNotes?: string;
  points: number;
  outcome?: 'Correct' | 'Incorrect' | 'Pending';
  badge?: 'Gold' | 'Silver' | 'Bronze';
  createdAt: string;
  lockedAt?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue?: string;
  city?: string;
  state?: string | null;
  country?: string;
  organization?: string;
  description?: string | null;
  imageUrl?: string | null;
  location: {
    city: string;
    state?: string;
    country: string;
    venue: string;
  };
  fights: EventFight[];
  status: 'OPEN' | 'LIVE' | 'CLOSED' | 'ARCHIVED' | 'Upcoming' | 'Completed' | 'Cancelled' | 'Postponed';
}

export interface EventFight {
  id: string;
  eventId: string;
  fighter1Id: string;
  fighter2Id: string;
  fightType?: 'Main Card' | 'Prelim' | 'Early Prelim' | 'Exhibition';
  cardPlacement?: string;
  boutOrder: number;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
  status: 'OPEN' | 'LIVE' | 'CLOSED' | 'ARCHIVED' | 'Scheduled' | 'Completed' | 'Cancelled';
  scheduledTime?: string | null;
}

export type UserRole = 'admin' | 'moderator' | 'user';

export interface NewsArticle {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  content: string;
  author: string;
  imageUrl: string | null;
  tags: string[];
  layer: 'standard' | 'intelligence';
  eventReference: string | null;
  fighterReference: string | null;
  readTime: string | null;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  csvField: string;
  systemField: string | null;
  status: "mapped" | "unmapped" | "ignored";
}
