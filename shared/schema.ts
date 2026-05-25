import { pgTable, text, varchar, boolean, integer, jsonb, timestamp, uuid, real, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

/**
 * Fighters table - Primary Data Authority
 * 
 * Stores all fighter profile data. 
 * Normalized for AI readiness and SQL queryability.
 */
export const fighters = pgTable("fighters", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 255 }),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: varchar("nationality", { length: 255 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  weightClass: varchar("weight_class", { length: 100 }).notNull(),
  stance: varchar("stance", { length: 50 }), // nullable — may be unknown
  gym: varchar("gym", { length: 255 }), // nullable — data engine may omit when unknown
  headCoach: varchar("head_coach", { length: 255 }),
  team: varchar("team", { length: 255 }),
  fightingOutOf: varchar("fighting_out_of", { length: 255 }),
  style: varchar("style", { length: 100 }),
  bio: text("bio"), // User biography
  aiPreferences: jsonb("ai_preferences").$type<{
    enabled: boolean;
    tier?: string;
  }>().default({ enabled: true }),
  socialMedia: jsonb("social_media").$type<{
    twitter?: string;
    instagram?: string;
    website?: string;
  }>(),

  // Physical Stats (Normalized from JSONB)
  height: real("height_inch"), // stored in inches
  reach: real("reach_inch"),   // stored in inches
  legReach: real("leg_reach_inch"),
  weight: real("weight"),      // stored in lbs

  // Record (Normalized from JSONB)
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  nc: integer("nc").notNull().default(0),

  // Images
  imageUrl: text("image_url").notNull(),
  bodyImageUrl: text("body_image_url"),

  organization: varchar("organization", { length: 50 }).notNull(),

  // Legacy/Complex Nested objects as JSONB (Deprecating core stats)
  physicalStats: jsonb("physical_stats").notNull().default({}), // Deprecated
  record: jsonb("record").notNull().default({}),        // Deprecated
  performance: jsonb("performance").notNull().default({}),
  odds: jsonb("odds"),
  notes: jsonb("notes").notNull().default([]),
  riskSignals: jsonb("risk_signals").notNull().default([]),

  // Optional fields
  campStartDate: timestamp("camp_start_date"),
  trainingPartners: jsonb("training_partners"),
  dominantHand: varchar("dominant_hand", { length: 20 }),
  dominantFoot: varchar("dominant_foot", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  ranking: integer("ranking"),
  rankGlobal: integer("rank_global"),
  rankPromotion: integer("rank_promotion"),
  isChampion: boolean("is_champion").default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  needsImage: boolean("needs_image").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, retired, inactive

  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  nameUnique: uniqueIndex("fighters_name_idx").on(sql`lower(${table.firstName})`, sql`lower(${table.lastName})`),
}));

/**
 * Fight History table - Immutable Ledger
 */
export const fightHistory = pgTable("fight_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  fighterId: uuid("fighter_id").notNull().references(() => fighters.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  // Fighter info (Snapshot)
  fighterName: varchar("fighter_name", { length: 255 }),
  fighterNickname: varchar("fighter_nickname", { length: 255 }),

  // Opponent info
  opponentId: uuid("opponent_id"),
  opponentName: varchar("opponent_name", { length: 255 }).notNull(),
  opponentNickname: varchar("opponent_nickname", { length: 255 }),
  opponentLinked: boolean("opponent_linked").notNull().default(true),

  // Event info — snapshot fields, nullable for data engine compatibility
  eventName: varchar("event_name", { length: 500 }),
  eventDate: timestamp("event_date"),
  eventPromotion: varchar("event_promotion", { length: 100 }),
  weightClass: varchar("weight_class", { length: 100 }),
  fightType: varchar("fight_type", { length: 50 }),
  billing: varchar("billing", { length: 100 }),
  boutOrder: integer("bout_order").notNull(),
  roundsScheduled: integer("rounds_scheduled"),
  roundDurationMinutes: integer("round_duration_minutes"),
  location: jsonb("location"), // nullable — { city, state, country, venue } kept as raw snapshot

  // Flat location fields — promoted for direct queryability and indexing
  eventCity: text("event_city"),
  eventState: text("event_state"),
  eventCountry: text("event_country"),
  eventVenue: text("event_venue"),

  // Result
  result: varchar("result", { length: 20 }).notNull(),
  method: varchar("method", { length: 100 }).notNull(),
  methodDetail: varchar("method_detail", { length: 255 }),
  round: integer("round").notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  fightDurationSeconds: integer("fight_duration_seconds").notNull(),
  titleFight: boolean("title_fight").notNull().default(false),
  titleFightDetail: varchar("title_fight_detail", { length: 255 }),
  referee: varchar("referee", { length: 255 }),
  roundTimeFormat: varchar("round_time_format", { length: 50 }),
  judgesScoresData: jsonb("judges_scores_data"),
  perRoundStats: jsonb("per_round_stats"),
  isLocked: boolean("is_locked").notNull().default(false),

  // Stats and odds as JSONB (could be normalized in future)
  stats: jsonb("stats"),
  oddsSnapshot: jsonb("odds_snapshot"),

  // Optional contextual fields
  travelDistance: integer("travel_distance"),
  venueAltitude: integer("venue_altitude"),
  mediaPressure: boolean("media_pressure"),
  gymChanges: boolean("gym_changes"),
  injuryFlags: jsonb("injury_flags"),
  refereeNotes: jsonb("referee_notes"),
  penaltyDeductions: jsonb("penalty_deductions"),
  weightCutSuccess: boolean("weight_cut_success"),
  adminNotes: jsonb("admin_notes"),

  // Versioning for audit trail
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  fighterEventUnique: uniqueIndex("fight_history_fighter_event_idx").on(table.fighterId, table.eventId),
  fighterIdx: index("fight_history_fighter_idx").on(table.fighterId),
  eventDateIdx: index("fight_history_event_date_idx").on(table.eventDate),
  eventCityIdx: index("fight_history_event_city_idx").on(table.eventCity),
  eventCountryIdx: index("fight_history_event_country_idx").on(table.eventCountry),
}));

/**
 * Events table - Stores MMA event metadata
 */
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  date: timestamp("date").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull(),
  organization: varchar("organization", { length: 50 }).notNull().default('UFC'),
  description: text("description"),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, ready
  lockTime: timestamp("lock_time"), // When picks lock for the event
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Event Fights table - Stores fights for each event
 */
export const eventFights = pgTable("event_fights", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  fighter1Id: uuid("fighter1_id").notNull(),
  fighter2Id: uuid("fighter2_id").notNull(),
  cardPlacement: varchar("card_placement", { length: 50 }).notNull(),
  boutOrder: integer("bout_order").notNull(),
  weightClass: varchar("weight_class", { length: 100 }).notNull(),
  isTitleFight: boolean("is_title_fight").notNull().default(false),
  rounds: integer("rounds").notNull().default(3),
  status: varchar("status", { length: 50 }).notNull().default('OPEN'), // OPEN, LIVE, CLOSED, ARCHIVED
  scheduledTime: varchar("scheduled_time", { length: 20 }),

  // Odds set by admin for this specific fight
  odds: jsonb("odds").$type<{
    fighter1Odds?: string; // e.g. "-150", "+200"
    fighter2Odds?: string;
    overUnder?: string;
    source?: string;
  }>(),

  // Fight result fields
  timeFormat: varchar("time_format", { length: 50 }),
  roundEnd: integer("round_end"),
  timeEnd: varchar("time_end", { length: 20 }),
  method: varchar("method", { length: 100 }),
  referee: varchar("referee", { length: 255 }),
  winnerId: uuid("winner_id"),
  fighter1Result: varchar("fighter1_result", { length: 10 }),
  fighter2Result: varchar("fighter2_result", { length: 10 }),
});

/**
 * Judges Scores table
 */
export const judgesScores = pgTable("judges_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  judgeName: varchar("judge_name", { length: 255 }).notNull(),
  fighter1Score: integer("fighter1_score").notNull(),
  fighter2Score: integer("fighter2_score").notNull(),
});

/**
 * Fight Totals table
 */
export const fightTotals = pgTable("fight_totals", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),

  // Striking
  knockdowns: integer("knockdowns"),
  sigStrLanded: integer("sig_str_landed"),
  sigStrAttempted: integer("sig_str_attempted"),
  sigStrPercentage: integer("sig_str_percentage"),
  totalStrLanded: integer("total_str_landed"),
  totalStrAttempted: integer("total_str_attempted"),

  // Grappling
  takedownsLanded: integer("takedowns_landed"),
  takedownsAttempted: integer("takedowns_attempted"),
  takedownPercentage: integer("takedown_percentage"),
  submissionAttempts: integer("submission_attempts"),
  reversals: integer("reversals"),
  controlTime: varchar("control_time", { length: 20 }),
});

/**
 * Significant Strikes Breakdown table
 */
export const sigStrikesBreakdown = pgTable("sig_strikes_breakdown", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),

  // By Target
  headLanded: integer("head_landed"),
  headAttempted: integer("head_attempted"),
  bodyLanded: integer("body_landed"),
  bodyAttempted: integer("body_attempted"),
  legLanded: integer("leg_landed"),
  legAttempted: integer("leg_attempted"),

  // By Position
  distanceLanded: integer("distance_landed"),
  distanceAttempted: integer("distance_attempted"),
  clinchLanded: integer("clinch_landed"),
  clinchAttempted: integer("clinch_attempted"),
  groundLanded: integer("ground_landed"),
  groundAttempted: integer("ground_attempted"),
});

/**
 * Round Stats table - Per-round fight statistics
 */
export const roundStats = pgTable("round_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  fighterId: uuid("fighter_id").notNull(),
  roundNumber: integer("round_number").notNull(),

  // Significant Strikes
  sigStrLanded: integer("sig_str_landed"),
  sigStrAttempted: integer("sig_str_attempted"),
  sigStrPercentage: integer("sig_str_percentage"),

  // Total Strikes
  totalStrLanded: integer("total_str_landed"),
  totalStrAttempted: integer("total_str_attempted"),

  // Takedowns
  tdLanded: integer("td_landed"),
  tdAttempted: integer("td_attempted"),

  // Grappling
  subAttempts: integer("sub_attempts"),
  controlTime: varchar("control_time", { length: 20 }),

  // Knockdowns
  knockdowns: integer("knockdowns"),
});

// Card placement enum values for validation
export const CARD_PLACEMENTS = ['Main Event', 'Co-Main Event', 'Main Card', 'Preliminary', 'Pre-Prelims'] as const;
export type CardPlacement = typeof CARD_PLACEMENTS[number];

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]), // Array of tags.id UUIDs
  layer: varchar("layer", { length: 20 }).notNull().default('standard'), // 'standard' | 'intelligence'
  eventReference: uuid("event_reference"),   // FK to events
  fighterReference: uuid("fighter_reference"), // FK to fighters
  readTime: varchar("read_time", { length: 50 }),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Fight Odds History table - Tracks line movement over time
 */
export const fightOddsHistory = pgTable("fight_odds_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull().references(() => eventFights.id, { onDelete: "cascade" }),
  fighter1Odds: varchar("fighter1_odds", { length: 20 }),
  fighter2Odds: varchar("fighter2_odds", { length: 20 }),
  overUnder: varchar("over_under", { length: 20 }),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Chat Messages table - Supports global, event, and country chat
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  eventId: uuid("event_id"), // Nullable - used for event chat
  chatType: varchar("chat_type", { length: 20 }).notNull().default('global'), // 'global' | 'event' | 'country'
  countryCode: varchar("country_code", { length: 10 }), // For country chat filtering
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 10 }).notNull().default('text'), // 'text' | 'slip'
  slipId: uuid("slip_id"), // Nullable — set when messageType === 'slip'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fight History Audit Log - tracks admin edits for immutability
export const fightHistoryAudit = pgTable("fight_history_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightHistoryId: uuid("fight_history_id").notNull(),
  previousData: jsonb("previous_data").notNull(),
  changedBy: varchar("changed_by").notNull(),
  changeType: text("change_type").notNull(), // 'edit', 'stats_update', 'result_correction'
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Unmatched Opponents Log - for fuzzy matching fallback
export const unmatchedOpponents = pgTable("unmatched_opponents", {
  id: uuid("id").defaultRandom().primaryKey(),
  importedName: text("imported_name").notNull(),
  candidates: jsonb("candidates"),
  resolvedFighterId: uuid("resolved_fighter_id"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Prediction Cache - stores AI predictions with TTL
export const aiPredictionCache = pgTable("ai_prediction_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  model: text("model").notNull(),
  prediction: jsonb("prediction").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * AI Fight Q&A Cache — per-fight cached answers for reuse across users
 * Suggested questions are seeded on first interaction; custom questions stored on miss.
 * Archived when the event completes (kept as historical analysis).
 */
export const aiFightQaCache = pgTable("ai_fight_qa_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  fightId: uuid("fight_id").notNull(),
  question: text("question").notNull(),
  questionKey: varchar("question_key", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  hitCount: integer("hit_count").notNull().default(0),
  isSuggested: boolean("is_suggested").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastHitAt: timestamp("last_hit_at"),
});

/**
 * AI Fight Chat Stats — engagement analytics per fight (chat opens)
 */
export const aiFightStats = pgTable("ai_fight_stats", {
  fightId: uuid("fight_id").primaryKey(),
  openCount: integer("open_count").notNull().default(0),
  lastOpenAt: timestamp("last_open_at"),
});

/**
 * AI Suggested Questions — admin-managed global question templates for fight analyst chat
 */
export const aiSuggestedQuestions = pgTable("ai_suggested_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== NEW FEATURE TABLES ==========

/**
 * News Tags — proper dynamic tags for news articles and intelligence signals
 */
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 20 }).notNull().default('#6b7280'), // Hex color string
  category: varchar("category", { length: 50 }).notNull().default('standard'), // 'standard' | 'intelligence'
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Fighter Tag Definitions — catalog of available tag types
 * Examples: Striking, Grappling, Aggressiveness, Cardio, Fight IQ
 */
export const fighterTagDefinitions = pgTable("fighter_tag_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull().default('Intangibles'), // Striking, Grappling, Athleticism, Fight IQ, Intangibles
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Fighter Tags — admin-assigned tag values per fighter
 * Each tag has a numeric value (1-10) and an admin-set color for visual signaling.
 * Future: AI will read these values + colors for analysis.
 */
export const fighterTags = pgTable("fighter_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  fighterId: uuid("fighter_id").notNull(),
  tagDefinitionId: uuid("tag_definition_id").notNull(),
  value: integer("value").notNull().default(5), // 1-10 scale
  color: varchar("color", { length: 20 }).notNull().default('#3b82f6'), // hex color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * AI Chat Messages — conversational chat with AI (premium feature)
 * Can reference fighters, blogs, and tag data.
 */
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  message: text("message").notNull(),
  context: jsonb("context").$type<{
    fighterIds?: string[];
    articleIds?: string[];
    tagIds?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Raffle Pool — subscriber contributions for event-based raffles
 */
export const rafflePool = pgTable("raffle_pool", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  contributionAmount: integer("contribution_amount").notNull().default(50), // cents, default $0.50
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEventUser: uniqueIndex("raffle_pool_event_user_idx").on(table.eventId, table.userId),
}));

/**
 * Raffle Tickets — admin-allocated tickets for subscription-verified users
 */
export const raffleTickets = pgTable("raffle_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  source: varchar("source", { length: 50 }).notNull().default('admin'), // 'admin' | 'subscription'
  eventId: uuid("event_id"), // Optional: tied to specific event
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Raffle Draws — results of raffle draws with notification tracking
 */
export const raffleDraws = pgTable("raffle_draws", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  winnerId: varchar("winner_id").notNull(),
  poolTotal: integer("pool_total").notNull(), // total amount in cents
  totalTickets: integer("total_tickets").notNull(),
  notified: boolean("notified").notNull().default(false),
  drawnAt: timestamp("drawn_at").defaultNow().notNull(),
});

/**
 * User Badges — badge framework for gamification (admin-assigned)
 */
export const userBadges = pgTable("user_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  badgeType: varchar("badge_type", { length: 100 }).notNull().default('custom'),
  badgeName: varchar("badge_name", { length: 100 }).notNull().default('Badge'),
  badgeIcon: varchar("badge_icon", { length: 20 }).default('🏆'),
  reason: text("reason"),
  awardedBy: varchar("awarded_by"), // admin who assigned
  metadata: jsonb("metadata").default({}),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * AI Chat Configuration — Dynamic system instructions
 */
export const aiChatConfig = pgTable("ai_chat_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  section: varchar("section", { length: 50 }).notNull(), // 'behavior', 'functional', 'policy'
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // admin id
});

/**
 * AI Chat Logs — Security and audit logs for blocked/flagged messages
 */
export const aiChatLogs = pgTable("ai_chat_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'allowed', 'blocked', 'flagged'
  violationReason: text("violation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Admin Audit Logs — tracks admin actions for accountability
 */
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: varchar("admin_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: varchar("target_id", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * System Settings — key-value store for global config
 */
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * User Settings — gamification and notification preferences
 */
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().unique(),

  // Notification Preferences
  enableSounds: boolean("enable_sounds").notNull().default(true),
  enableCelebrations: boolean("enable_celebrations").notNull().default(true),
  
  // Display Preferences
  showStreaks: boolean("show_streaks").notNull().default(true),
  showBadges: boolean("show_badges").notNull().default(true),

  // Betting Tracker Preferences
  showBettingTracker: boolean("show_betting_tracker").notNull().default(false),
  unitSize: integer("unit_size").default(0),

  // Email/Push Configurations
  enablePushNotifications: boolean("enable_push_notifications").notNull().default(true),
  enableEventReminders: boolean("enable_event_reminders").notNull().default(true),
  enableResultAlerts: boolean("enable_result_alerts").notNull().default(true),
  enableLeaderboardUpdates: boolean("enable_leaderboard_updates").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * User Keys - awarded for "Clean Sweeps" (100% accuracy on an event)
 * Prestige currency for unlocking special badges.
 */
export const userKeys = pgTable("user_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  eventId: uuid("event_id").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  prizeClaimed: boolean("prize_claimed").notNull().default(false),
  prizeAmount: integer("prize_amount"), // cents, null until admin sets
  adminNotifiedAt: timestamp("admin_notified_at"),
}, (table) => {
  return {
    userEventUnique: sql`unique(${table.userId}, ${table.eventId})`
  };
});

/**
 * Badge Audit - tracks when and why a badge was awarded
 */
export const badgeAudit = pgTable("badge_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  badgeType: varchar("badge_type", { length: 100 }).notNull(),
  triggerEventId: uuid("trigger_event_id"), // event that triggered the milestone
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
}, (table) => {
  return {
    userBadgeUnique: sql`unique(${table.userId}, ${table.badgeType})`
  };
});

/**
 * Fighter Corrections — user-submitted data correction requests
 */
export const fighterCorrections = pgTable("fighter_corrections", {
  id: uuid("id").defaultRandom().primaryKey(),
  fighterId: uuid("fighter_id").notNull().references(() => fighters.id, { onDelete: 'cascade' }),
  submittedBy: varchar("submitted_by", { length: 255 }),
  whatIsWrong: text("what_is_wrong").notNull(),
  sourceLink: varchar("source_link", { length: 1000 }),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const insertFighterSchema = createInsertSchema(fighters, {
  dateOfBirth: z.coerce.date().optional(),
  campStartDate: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true, lastUpdated: true });

export const insertFightHistorySchema = createInsertSchema(fightHistory, {
  eventDate: z.coerce.date(),
}).omit({ id: true });

export const insertEventSchema = createInsertSchema(events, {
  date: z.coerce.date(),
}).omit({ id: true, createdAt: true });

export const insertEventFightSchema = createInsertSchema(eventFights).omit({ id: true });

export const insertNewsArticleSchema = createInsertSchema(newsArticles, {
  publishedAt: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertJudgesScoreSchema = createInsertSchema(judgesScores).omit({ id: true });
export const insertFightTotalsSchema = createInsertSchema(fightTotals).omit({ id: true });
export const insertSigStrikesBreakdownSchema = createInsertSchema(sigStrikesBreakdown).omit({ id: true });
export const insertRoundStatsSchema = createInsertSchema(roundStats).omit({ id: true });

// New table insert schemas
export const insertFighterTagDefinitionSchema = createInsertSchema(fighterTagDefinitions).omit({ id: true, createdAt: true });
export const insertFighterTagSchema = createInsertSchema(fighterTags).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({ id: true, createdAt: true });
export const insertRaffleTicketSchema = createInsertSchema(raffleTickets).omit({ id: true, createdAt: true });
export const insertRaffleDrawSchema = createInsertSchema(raffleDraws).omit({ id: true, drawnAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, createdAt: true });
export const insertAiChatConfigSchema = createInsertSchema(aiChatConfig).omit({ id: true, updatedAt: true });
export const insertAiChatLogSchema = createInsertSchema(aiChatLogs).omit({ id: true, createdAt: true });
export const insertUserKeySchema = createInsertSchema(userKeys).omit({ id: true, awardedAt: true });
export const insertBadgeAuditSchema = createInsertSchema(badgeAudit).omit({ id: true, triggeredAt: true });
export const insertFighterCorrectionSchema = createInsertSchema(fighterCorrections).omit({ id: true, createdAt: true });
export const insertAiFightQaCacheSchema = createInsertSchema(aiFightQaCache).omit({ id: true, createdAt: true });
export const insertAiFightStatsSchema = createInsertSchema(aiFightStats);

// Navigation / Gamification / Reflection
export const fightNotes = pgTable("fight_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  fightId: uuid("fight_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userFightNoteUnique: uniqueIndex("fight_notes_user_fight_idx").on(table.userId, table.fightId),
}));

export const insertFightNoteSchema = createInsertSchema(fightNotes).omit({ id: true, createdAt: true, updatedAt: true });

// ===========================
// COMMUNITY CHAT & SLIP SYSTEM
// ===========================

/**
 * Chat Config — single-row global settings for the community chat
 */
export const chatConfig = pgTable("chat_config", {
  id: integer("id").primaryKey().default(1),
  isOpen: boolean("is_open").notNull().default(true),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(30),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"),
});

/**
 * Chat Mutes — admin-issued mutes that suppress a user's ability to post
 */
export const chatMutes = pgTable("chat_mutes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  moderatorId: varchar("moderator_id").notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"), // null = permanent
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Chat Bans — admin-issued bans that block a user from the chat entirely
 */
export const chatBans = pgTable("chat_bans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  moderatorId: varchar("moderator_id").notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"), // null = permanent
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Slips — community shared bet slips (images) uploaded by Challenger users
 */
export const slips = pgTable("slips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  imageUrl: text("image_url").notNull(), // local path: /uploads/slips/<userId>/<uuid>.ext
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  isFeatured: boolean("is_featured").notNull().default(false),
  caption: text("caption"), // admin-set display caption
  rejectionMessage: text("rejection_message"), // sent to user in-app notification
  expiresAt: timestamp("expires_at").notNull(), // 7 days from upload
  featuredAt: timestamp("featured_at"),
  approvedAt: timestamp("approved_at"),
  postedAt: timestamp("posted_at"), // Set when user posts the slip to chat; used for cooldown tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Chat Notifications — in-app notices sent to users (e.g. slip rejected/approved)
 */
export const chatNotifications = pgTable("chat_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'slip_approved' | 'slip_rejected' | 'slip_featured'
  message: text("message").notNull(),
  slipId: uuid("slip_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for new community tables
export const insertSlipSchema = createInsertSchema(slips).omit({ id: true, createdAt: true });
export const insertChatNotificationSchema = createInsertSchema(chatNotifications).omit({ id: true, createdAt: true });
export const insertChatMuteSchema = createInsertSchema(chatMutes).omit({ id: true, createdAt: true });
export const insertChatBanSchema = createInsertSchema(chatBans).omit({ id: true, createdAt: true });

// Types for new community tables
export type Slip = typeof slips.$inferSelect;
export type InsertSlip = z.infer<typeof insertSlipSchema>;
export type ChatConfig = typeof chatConfig.$inferSelect;
export type ChatMute = typeof chatMutes.$inferSelect;
export type ChatBan = typeof chatBans.$inferSelect;
export type ChatNotification = typeof chatNotifications.$inferSelect;

// ===========================
// INTEL FEED
// ===========================
export const intelFeedItems = pgTable("intel_feed_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  emoji: varchar("emoji", { length: 10 }).default('⚡').notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by"),
});

export const insertIntelFeedItemSchema = createInsertSchema(intelFeedItems).omit({ id: true, createdAt: true, updatedAt: true });
export type FightNote = typeof fightNotes.$inferSelect;
export type InsertFightNote = z.infer<typeof insertFightNoteSchema>;

// Types
export type Fighter = typeof fighters.$inferSelect;
export type InsertFighter = z.infer<typeof insertFighterSchema>;
export type FightHistory = typeof fightHistory.$inferSelect;
export type InsertFightHistory = z.infer<typeof insertFightHistorySchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventFight = typeof eventFights.$inferSelect;
export type InsertEventFight = z.infer<typeof insertEventFightSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type JudgesScore = typeof judgesScores.$inferSelect;
export type InsertJudgesScore = z.infer<typeof insertJudgesScoreSchema>;
export type FightTotals = typeof fightTotals.$inferSelect;
export type InsertFightTotals = z.infer<typeof insertFightTotalsSchema>;
export type SigStrikesBreakdown = typeof sigStrikesBreakdown.$inferSelect;
export type InsertSigStrikesBreakdown = z.infer<typeof insertSigStrikesBreakdownSchema>;
export type RoundStats = typeof roundStats.$inferSelect;
export type InsertRoundStats = z.infer<typeof insertRoundStatsSchema>;

// New table types
export type FighterTagDefinition = typeof fighterTagDefinitions.$inferSelect;
export type InsertFighterTagDefinition = z.infer<typeof insertFighterTagDefinitionSchema>;
export type FighterTag = typeof fighterTags.$inferSelect;
export type InsertFighterTag = z.infer<typeof insertFighterTagSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type RaffleTicket = typeof raffleTickets.$inferSelect;
export type InsertRaffleTicket = z.infer<typeof insertRaffleTicketSchema>;
export type RaffleDraw = typeof raffleDraws.$inferSelect;
export type InsertRaffleDraw = z.infer<typeof insertRaffleDrawSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type AiChatConfig = typeof aiChatConfig.$inferSelect;
export type InsertAiChatConfig = z.infer<typeof insertAiChatConfigSchema>;
export type AiChatLog = typeof aiChatLogs.$inferSelect;
export type InsertAiChatLog = z.infer<typeof insertAiChatLogSchema>;
export type UserKey = typeof userKeys.$inferSelect;
export type InsertUserKey = z.infer<typeof insertUserKeySchema>;
export type BadgeAudit = typeof badgeAudit.$inferSelect;
export type InsertBadgeAudit = z.infer<typeof insertBadgeAuditSchema>;
export type FighterCorrection = typeof fighterCorrections.$inferSelect;
export type InsertFighterCorrection = z.infer<typeof insertFighterCorrectionSchema>;
export type AiFightQaCache = typeof aiFightQaCache.$inferSelect;
export type InsertAiFightQaCache = z.infer<typeof insertAiFightQaCacheSchema>;
export type AiFightStats = typeof aiFightStats.$inferSelect;

/**
 * Data Pipeline - Incoming data from external data engine API
 * Admins review and approve/reject before it goes live
 */
export const dataPipeline = pgTable("data_pipeline", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // 'fighter' | 'fight' | 'news' | 'odds'
  sourceId: varchar("source_id"), // External system ID
  actionType: varchar("action_type", { length: 20 }).notNull(), // 'create' | 'update' | 'delete'
  dataType: varchar("data_type", { length: 50 }).notNull(), // 'fighter_profile' | 'fight_record' | etc.
  data: jsonb("data").notNull(), // The actual data to be applied
  submittedBy: varchar("submitted_by"), // External API key or system name
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'applied'
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  isPotentialDuplicate: boolean("is_potential_duplicate").notNull().default(false),
  errorLog: text("error_log"),
  appliedAt: timestamp("applied_at"),
  retryCount: integer("retry_count").notNull().default(0),
  lastRetryAt: timestamp("last_retry_at"),
});

/**
 * Data Engine Configuration - API keys and settings
 */
export const dataEngineConfig = pgTable("data_engine_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  configKey: varchar("config_key", { length: 100 }).notNull().unique(),
  configValue: text("config_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // Admin who last updated
});

/**
 * Groups - User-created private groups for competition and chat
 */
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPrivate: boolean("is_private").notNull().default(true),
  maxMembers: integer("max_members").notNull().default(50),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Group Members - Junction table linking users to groups
 */
export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default('member'), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueGroupUser: uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId),
}));

// Type exports for groups
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Group Chat - Messages within groups
 */
export const groupChat = pgTable("group_chat", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GroupChat = typeof groupChat.$inferSelect;
export type InsertGroupChat = typeof groupChat.$inferInsert;

// ════════════════════════════════════════════════════════════════════════════
// PHASE 1 WEEK 2 — SCHEMA ADDITIONS (PENDING FOUNDER REVIEW)
// ════════════════════════════════════════════════════════════════════════════
// Drafted 2026-05-23. Do NOT run drizzle-kit migrate against prod until founder
// signs off. Run `npx drizzle-kit generate` to produce the migration SQL for review.
//
// Implements blueprint v6.1.2 systems:
//   - §4 Creator (free vs paid)
//   - §5 Pick System (no new tables needed — uses existing user_picks)
//   - §9 Live Fighter Rating + 5-layer anti-spam
//   - §18 AI Token Economy ($5/$10/$20 packs + meter + per-feature cost)
//   - §24 Paid Creator Eligibility
//   - §29 1099-NEC tracking (uses users.id, no new table — see §32 legal_acceptances)
//   - §30 Multi-Account Detection (FingerprintJS + Stripe payment dedup + IP/ASN)
//   - §32 Legal pages (acceptance recording)
//   - §8 Founder badges 10/50/500/1000 atomic slot allocation
// ════════════════════════════════════════════════════════════════════════════

// ─── AI TOKEN ECONOMY (Blueprint §18) ───────────────────────────────────────

/**
 * Token Packs — admin-configurable purchase options.
 * Default seed: ($5 / 100 tokens), ($10 / 220 tokens), ($20 / 500 tokens) per blueprint.
 * Admin can edit prices, add new packs, toggle on/off via §19 Admin AI Controls.
 */
export const tokenPacks = pgTable("token_packs", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // 'pack_5', 'pack_10', 'pack_20'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  priceCents: integer("price_cents").notNull(), // 500, 1000, 2000
  tokenAmount: integer("token_amount").notNull(), // 100, 220, 500
  stripeProductId: varchar("stripe_product_id", { length: 100 }),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Token Balances — per-user current AI token state.
 * Frozen on subscription lapse (blueprint §22 — balance preserved, unfrozen on resub).
 * `meterCap` for visual display ceiling (250 per blueprint §18 — "above shows +X extra").
 */
export const tokenBalances = pgTable("token_balances", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  isFrozen: boolean("is_frozen").notNull().default(false), // true when sub lapsed
  frozenAt: timestamp("frozen_at"),
  unfrozenAt: timestamp("unfrozen_at"),
  lifetimePurchased: integer("lifetime_purchased").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Token Transactions — full ledger of purchases, spends, refunds, freezes, promos.
 * Append-only. Drives the §21 binary refund rule ("any spent tokens since last purchase = no refund").
 * `kind` values: 'purchase' | 'spend' | 'refund' | 'freeze' | 'unfreeze' | 'promo' | 'admin_revoke' | 'admin_grant'
 */
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 30 }).notNull(),
  amount: integer("amount").notNull(), // positive for credit, negative for debit
  balanceAfter: integer("balance_after").notNull(), // snapshot for audit trail
  packId: uuid("pack_id").references(() => tokenPacks.id), // populated on purchase
  stripeChargeId: varchar("stripe_charge_id", { length: 100 }), // Stripe payment intent / charge id
  aiFeature: varchar("ai_feature", { length: 50 }), // populated on spend: 'fighter_breakdown', 'matchup_analysis', etc.
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("token_tx_user_idx").on(table.userId, table.createdAt),
  packIdx: index("token_tx_pack_idx").on(table.packId),
}));

/**
 * Token Feature Costs — admin-configurable cost per AI feature.
 * Per blueprint §18: Quick Fighter Breakdown=1, Matchup Analysis=2, Scout Report=3,
 *   Custom Prediction=3, Parlay Analyzer=4, Sharp Money Detection=5.
 * Admin can edit costs, add new features, disable any feature globally (§19).
 */
export const tokenFeatureCosts = pgTable("token_feature_costs", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureCode: varchar("feature_code", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  tokenCost: integer("token_cost").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── CREATOR ECONOMY (Blueprint §4, §24, §25) ──────────────────────────────

/**
 * Creator Profiles — per-user creator state (a user is a creator if they have a row here).
 * Free Creator: row exists, isPaid=false. Day-1 eligible. Donations only.
 * Paid Creator: isPaid=true. Requires §24 trust signals (30d account age, 3+ qualified events,
 *   2FA, no active mod actions, Stripe Connect verified — paidEligibilityMetAt set when all true).
 */
export const creatorProfiles = pgTable("creator_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  isPaid: boolean("is_paid").notNull().default(false),
  monthlyPriceCents: integer("monthly_price_cents"), // null when free; min 500 ($5) per blueprint
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 100 }),
  stripeConnectChargesEnabled: boolean("stripe_connect_charges_enabled").notNull().default(false),
  stripeConnectPayoutsEnabled: boolean("stripe_connect_payouts_enabled").notNull().default(false),
  paidEligibilityMetAt: timestamp("paid_eligibility_met_at"), // when all 5 trust signals passed
  noShowCount: integer("no_show_count").notNull().default(0), // 3 = privileges removed (§4)
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  // Inactive marker timestamps for §25 termination handling
  pausedAt: timestamp("paused_at"), // 60-day inactive auto-pause
  terminatedAt: timestamp("terminated_at"),
  terminationReason: varchar("termination_reason", { length: 50 }), // 'voluntary' | 'banned' | 'inactive' | 'deceased'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Creator Subscriptions — user→creator subscriptions (separate from platform Challenger sub).
 * 85% creator / 15% platform split via Stripe Connect.
 * RLS: subscriber can only see their own subs; creator can see their own subscribers list.
 */
export const creatorSubscriptions = pgTable("creator_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriberId: varchar("subscriber_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(), // 'active' | 'past_due' | 'canceled' | 'paused'
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueSubCreator: uniqueIndex("creator_sub_unique_idx").on(table.subscriberId, table.creatorId),
  creatorIdx: index("creator_sub_creator_idx").on(table.creatorId, table.status),
  subscriberIdx: index("creator_sub_subscriber_idx").on(table.subscriberId, table.status),
}));

/**
 * Creator Donations — one-time donation log (95% creator / 5% platform).
 * Non-refundable per blueprint §21.
 */
export const creatorDonations = pgTable("creator_donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  donorId: varchar("donor_id").notNull().references(() => users.id, { onDelete: "set null" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  stripeChargeId: varchar("stripe_charge_id", { length: 100 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  creatorIdx: index("donation_creator_idx").on(table.creatorId, table.createdAt),
}));

/**
 * Chat Sessions — 1-on-1 paid creator chat (text only, Stripe escrow).
 * 80% creator / 20% platform on completion. 10-min no-show window = auto-refund.
 * Default session length 30 min, creator-set.
 * Message text stored in chat_messages with sessionId reference (extend chat_messages later).
 */
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookerId: varchar("booker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceCents: integer("price_cents").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }).notNull(), // escrow hold
  status: varchar("status", { length: 30 }).notNull().default('booked'),
  // statuses: 'booked' | 'started' | 'completed' | 'no_show_refunded' | 'cancelled' | 'disputed'
  scheduledAt: timestamp("scheduled_at").notNull(),
  startedAt: timestamp("started_at"), // creator joins → status='started'
  completedAt: timestamp("completed_at"), // session ends → escrow releases
  noShowFlaggedAt: timestamp("no_show_flagged_at"), // 10 min past scheduledAt + creator absent
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  bookerIdx: index("chat_session_booker_idx").on(table.bookerId, table.status),
  creatorIdx: index("chat_session_creator_idx").on(table.creatorId, table.status),
}));

// ─── LIVE FIGHTER RATING (Blueprint §9) ────────────────────────────────────

/**
 * Fighter Ratings — per-user per-fight ratings on 5 criteria during fights.
 * 1-10 scale per criterion. One row per (user, fighter, fight). Submits at fight end.
 * Anti-spam meta: countsTowardAggregate=false if user fails 5-layer defense
 *   (1) >5 ratings this event, (2) account <7 days old, (3) user has active mod action.
 * Recency weighting (rule 3) applied at read time, not stored.
 * Display threshold (rule 4: hide score until 10+ valid ratings) applied at read time.
 */
export const fighterRatings = pgTable("fighter_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fighterId: uuid("fighter_id").notNull().references(() => fighters.id, { onDelete: "cascade" }),
  fightId: uuid("fight_id").notNull().references(() => eventFights.id, { onDelete: "cascade" }),
  // 5 criteria per blueprint §9 — 1 to 10 stars each
  fightIq: integer("fight_iq").notNull(),
  grappling: integer("grappling").notNull(),
  striking: integer("striking").notNull(),
  cardio: integer("cardio").notNull(),
  aggressiveness: integer("aggressiveness").notNull(),
  // Anti-spam metadata
  countsTowardAggregate: boolean("counts_toward_aggregate").notNull().default(true),
  excludedReason: varchar("excluded_reason", { length: 50 }), // 'rate_limit' | 'account_age' | 'mod_action'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserFighterFight: uniqueIndex("rating_user_fighter_fight_idx").on(table.userId, table.fighterId, table.fightId),
  fighterIdx: index("rating_fighter_idx").on(table.fighterId, table.countsTowardAggregate),
}));

// ─── ANTI-FRAUD / MULTI-ACCOUNT DETECTION (Blueprint §30) ──────────────────

/**
 * Device Fingerprints — captured at signup + payment events.
 * Detection layer: FingerprintJS visitorId + Stripe card.fingerprint + IP/ASN.
 * Cross-account same-fingerprint matches drive soft/hard flags.
 * Retention: 24 months per privacy policy disclosure.
 */
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  visitorId: varchar("visitor_id", { length: 100 }), // FingerprintJS stable device ID
  stripeCardFingerprint: varchar("stripe_card_fingerprint", { length: 100 }), // card.fingerprint from Stripe
  stripeEmail: varchar("stripe_email", { length: 255 }), // Stripe customer email
  ip: varchar("ip", { length: 45 }), // supports IPv6
  asn: varchar("asn", { length: 50 }), // autonomous system number
  asnOrg: varchar("asn_org", { length: 255 }), // org name from geoip
  eventKind: varchar("event_kind", { length: 30 }).notNull(), // 'signup' | 'first_sub' | 'prize_eligible'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  visitorIdx: index("fp_visitor_idx").on(table.visitorId),
  cardIdx: index("fp_card_idx").on(table.stripeCardFingerprint),
  emailIdx: index("fp_email_idx").on(table.stripeEmail),
  userIdx: index("fp_user_idx").on(table.userId),
}));

/**
 * Multi-Account Flags — admin-visible queue of suspected sockpuppet clusters.
 * Soft flag (admin review needed before payout > $50) vs hard flag (block sub at checkout).
 */
export const multiAccountFlags = pgTable("multi_account_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkedUserId: varchar("linked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchType: varchar("match_type", { length: 30 }).notNull(), // 'visitor_id' | 'card_fingerprint' | 'stripe_email' | 'ip_asn' | 'behavioral'
  severity: varchar("severity", { length: 20 }).notNull(), // 'soft' | 'hard'
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  resolution: varchar("resolution", { length: 30 }), // 'whitelisted' | 'banned' | 'unconfirmed'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniquePair: uniqueIndex("ma_flag_unique_idx").on(table.userId, table.linkedUserId, table.matchType),
  pendingIdx: index("ma_flag_pending_idx").on(table.reviewedAt),
}));

// ─── FOUNDER BADGE SLOTS (Blueprint §8) ────────────────────────────────────

/**
 * Founder Badge Slots — atomic allocation of 10/50/500/1000 slots.
 * Atomic insertion pattern: INSERT ... ON CONFLICT DO NOTHING with slot derived from
 * COUNT(*)+1 in same transaction. Permanent on cancel (anti-gaming rule, blueprint §8).
 * One row per allocated slot. tier 1=I (10 slots), 2=II (50), 3=III (500), 4=IV (1000).
 */
export const founderBadgeSlots = pgTable("founder_badge_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tier: integer("tier").notNull(), // 1, 2, 3, 4
  slotNumber: integer("slot_number").notNull(), // 1-10 for tier 1, 1-50 for tier 2, etc.
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTierSlot: uniqueIndex("founder_tier_slot_idx").on(table.tier, table.slotNumber),
  uniqueUserTier: uniqueIndex("founder_user_tier_idx").on(table.userId, table.tier),
}));

// ─── LEGAL ACCEPTANCES (Blueprint §32) ─────────────────────────────────────

/**
 * Legal Acceptances — per-user acceptance log for ToS / Privacy / Cookie / Creator Agreement / AUP.
 * Required for §21 refund chargeback defense: "three independent records prove the user agreed".
 * Stores doc version + timestamp + IP at acceptance time.
 */
export const legalAcceptances = pgTable("legal_acceptances", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  docKind: varchar("doc_kind", { length: 30 }).notNull(), // 'tos' | 'privacy' | 'cookie' | 'creator_agreement' | 'aup'
  docVersion: varchar("doc_version", { length: 20 }).notNull(), // 'v1.0', 'v1.1', etc.
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
}, (table) => ({
  userKindIdx: index("legal_user_kind_idx").on(table.userId, table.docKind),
}));

// ─── PAYOUT TRACKING (Blueprint §29 — 1099-NEC compliance) ─────────────────

/**
 * Cash Payouts — log of cash prize payouts to users (monthly bonus, keys, raffle wins).
 * Drives 1099-NEC threshold tracking ($600+ in calendar year for US users).
 * Yellow warning at $400 lifetime; red flag at $550; block above until W-9/W-8BEN collected.
 */
export const cashPayouts = pgTable("cash_payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 30 }).notNull(), // 'monthly_bonus' | 'key_prize' | 'raffle' | 'gold_key_milestone'
  amountCents: integer("amount_cents").notNull(),
  payoutMethod: varchar("payout_method", { length: 30 }), // 'paypal' | 'usdc' | 'usdt' | 'pending'
  payoutDestination: varchar("payout_destination", { length: 255 }), // PayPal email or wallet addr
  status: varchar("status", { length: 30 }).notNull().default('pending'),
  // statuses: 'pending' | 'awaiting_w9' | 'awaiting_w8ben' | 'paid' | 'cancelled' | 'admin_review'
  taxYear: integer("tax_year").notNull(), // for 1099 batch grouping
  taxFormCollected: boolean("tax_form_collected").notNull().default(false),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userYearIdx: index("payout_user_year_idx").on(table.userId, table.taxYear),
  pendingIdx: index("payout_pending_idx").on(table.status),
}));

// ─── TYPE EXPORTS ──────────────────────────────────────────────────────────

export type TokenPack = typeof tokenPacks.$inferSelect;
export type InsertTokenPack = typeof tokenPacks.$inferInsert;
export type TokenBalance = typeof tokenBalances.$inferSelect;
export type InsertTokenBalance = typeof tokenBalances.$inferInsert;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;
export type TokenFeatureCost = typeof tokenFeatureCosts.$inferSelect;
export type InsertTokenFeatureCost = typeof tokenFeatureCosts.$inferInsert;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;
export type CreatorSubscription = typeof creatorSubscriptions.$inferSelect;
export type InsertCreatorSubscription = typeof creatorSubscriptions.$inferInsert;
export type CreatorDonation = typeof creatorDonations.$inferSelect;
export type InsertCreatorDonation = typeof creatorDonations.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type FighterRating = typeof fighterRatings.$inferSelect;
export type InsertFighterRating = typeof fighterRatings.$inferInsert;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type InsertDeviceFingerprint = typeof deviceFingerprints.$inferInsert;
export type MultiAccountFlag = typeof multiAccountFlags.$inferSelect;
export type InsertMultiAccountFlag = typeof multiAccountFlags.$inferInsert;
export type FounderBadgeSlot = typeof founderBadgeSlots.$inferSelect;
export type InsertFounderBadgeSlot = typeof founderBadgeSlots.$inferInsert;
export type LegalAcceptance = typeof legalAcceptances.$inferSelect;
export type InsertLegalAcceptance = typeof legalAcceptances.$inferInsert;
export type CashPayout = typeof cashPayouts.$inferSelect;
export type InsertCashPayout = typeof cashPayouts.$inferInsert;
