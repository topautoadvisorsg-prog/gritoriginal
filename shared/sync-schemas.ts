import { z } from 'zod';
import { EVENT_STATUSES, normalizeInboundEventStatus } from './models/eventLifecycle';

/**
 * Zod schemas for Data Engine Synchronization (The Bible v2.0)
 */

export const syncFighterSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  nickname: z.string().max(255).optional(),
  dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  nationality: z.string().min(1).max(255),
  gender: z.enum(['Male', 'Female']),
  weightClass: z.string().min(1).max(100),
  stance: z.enum(['Orthodox', 'Southpaw', 'Switch']).optional(), // optional — may be unknown
  style: z.string().max(100).optional(),
  gym: z.string().max(255).optional(),
  headCoach: z.string().max(255).optional(),
  team: z.string().max(255).optional(),
  fightingOutOf: z.string().max(255).optional(),
  height: z.number().optional(), // In inches
  reach: z.number().optional(),   // In inches
  legReach: z.number().optional(),
  weight: z.number().optional(),  // In LBS
  wins: z.number().int().nonnegative().default(0),
  losses: z.number().int().nonnegative().default(0),
  draws: z.number().int().nonnegative().default(0),
  nc: z.number().int().nonnegative().default(0),
  imageUrl: z.string().url().optional().nullable(),
  bodyImageUrl: z.string().url().optional(),
  organization: z.string().max(50).default('UFC'),
  ranking: z.number().int().optional(),
  rankGlobal: z.number().int().optional(),
  rankPromotion: z.number().int().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
  isChampion: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  needsImage: z.boolean().default(false),
  status: z.enum(['active', 'retired', 'inactive']).default('active'),
  performance: z.object({
    ko_wins: z.number().int().optional(),
    tko_wins: z.number().int().optional(),
    submission_wins: z.number().int().optional(),
    decision_wins: z.number().int().optional(),
    finish_rate: z.number().optional(),
    strike_accuracy: z.number().optional(),
    strike_defense: z.number().optional(),
    takedown_avg: z.number().optional(),
    takedown_accuracy: z.number().optional(),
    takedown_defense: z.number().optional(),
    strikes_landed_per_min: z.number().optional(),
    strikes_absorbed_per_min: z.number().optional(),
    submission_avg: z.number().optional(),
    losses_by_ko: z.number().int().optional(),
    losses_by_submission: z.number().int().optional(),
    losses_by_decision: z.number().int().optional(),
    longest_win_streak: z.number().int().optional(),
  }).optional(),
});

/**
 * Schema for a single fight matchup embedded in an event payload.
 * All result fields are optional — they are only present when the fight is complete.
 */
export const syncEventFightSchema = z.object({
  fighter1Id: z.string().uuid(),
  fighter2Id: z.string().uuid(),
  cardPlacement: z.string().max(50).default('Main Card'),
  boutOrder: z.number().int().nonnegative().default(0),
  weightClass: z.string().max(100),
  isTitleFight: z.boolean().default(false),
  rounds: z.number().int().min(1).max(5).default(3),
  scheduledTime: z.string().max(20).optional(),
  // Result fields (optional — set when finalized)
  status: z.enum(['OPEN', 'LIVE', 'CLOSED', 'Completed', 'Cancelled']).optional(),
  winnerId: z.string().uuid().nullable().optional(),
  method: z.string().max(100).optional(),
  roundEnd: z.number().int().optional(),
  timeEnd: z.string().max(20).optional(),
  referee: z.string().max(255).optional(),
  fighter1Result: z.string().max(10).optional(),
  fighter2Result: z.string().max(10).optional(),
});

/**
 * Fight history schema — all snapshot fields (eventName, eventDate, fightType,
 * location) are optional. The DB columns are nullable so pushes succeed whether
 * or not the data engine includes them. Use "unknown"/null placeholders when
 * values are unavailable rather than omitting the field entirely.
 */
export const syncFightHistorySchema = z.object({
  fighterId: z.string().uuid(),
  eventId: z.string().uuid(),
  opponentId: z.string().uuid().optional(),
  opponentName: z.string().min(1).max(255),
  opponentNickname: z.string().max(255).optional(),
  result: z.enum(['Win', 'Loss', 'Draw', 'NC', 'Unknown']),
  method: z.string().min(1).max(100),
  methodDetail: z.string().max(255).optional(),
  round: z.number().int().min(1).max(5),
  time: z.string().regex(/^\d{1,2}:\d{2}$/),
  fightDurationSeconds: z.number().int().nonnegative().default(0).optional(), // optional — 0 when unavailable
  eventPromotion: z.string().max(100).optional(),
  boutOrder: z.number().int().nonnegative().default(0).optional(), // optional — 0 when unknown
  roundsScheduled: z.number().int().min(1).max(5).default(3),
  titleFight: z.boolean().default(false),
  billing: z.string().max(100).optional(),
  // Snapshot fields — nullable in DB, optional here; date accepts null placeholder
  eventName: z.string().max(500).optional(),
  eventDate: z.string().datetime().nullish(),
  fightType: z.string().max(50).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    venue: z.string().optional(),
  }).optional(),
  // Flat location fields — preferred over nested location object for direct DB mapping
  eventCity: z.string().max(255).optional(),
  eventState: z.string().max(100).optional(),
  eventCountry: z.string().max(100).optional(),
  eventVenue: z.string().max(255).optional(),
});

export const syncEventSchema = z.object({
  name: z.string().min(1).max(500),
  date: z.string().datetime(),
  lockTime: z.string().datetime().optional(), // optional — may be set later
  venue: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  state: z.string().max(100).optional(),
  country: z.string().min(1).max(100),
  organization: z.string().max(50).default('UFC'),
  status: z.preprocess(normalizeInboundEventStatus, z.enum(EVENT_STATUSES)).default('Upcoming'),
  imageUrl: z.string().url().optional(),
  // Embedded fights — inserted into event_fights when present
  eventFights: z.array(syncEventFightSchema).optional(),
});

export const syncOddsSchema = z.object({
  fightId: z.string().uuid(),
  fighter1Odds: z.string().max(20).optional(),
  fighter2Odds: z.string().max(20).optional(),
  overUnder: z.string().max(20).optional(),
  source: z.string().max(100).optional(),
});

export const syncNewsSchema = z.object({
  title: z.string().min(1).max(500),
  subtitle: z.string().max(500).optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  author: z.string().max(255),
  imageUrl: z.string().url().optional(),
  layer: z.enum(['standard', 'intelligence']).default('standard'),
  fighterReference: z.string().uuid().optional(),
  eventReference: z.string().uuid().optional(),
  publishedAt: z.string().datetime(),
});

export const syncPayloadSchema = z.object({
  sourceType: z.enum(['fighter', 'fight', 'news', 'odds', 'event']),
  sourceId: z.string().uuid().optional(),
  actionType: z.enum(['create', 'update', 'delete']),
  dataType: z.string().default('mma_data'),
  data: z.any(), // Validated conditionally in webhook
});
