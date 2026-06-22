import { sql } from "drizzle-orm";
import { index, uniqueIndex, jsonb, pgTable, timestamp, varchar, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sessions table removed (Supabase Auth handles sessions)

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),

  // Extended profile fields
  username: varchar("username", { length: 50 }).unique(),
  avatarUrl: varchar("avatar_url"),
  socialLinks: jsonb("social_links").$type<{
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  }>().default({}),
  privacySettings: jsonb("privacy_settings").$type<{
    showAvatar: boolean;
    showSocialLinks: boolean;
    showUsername: boolean;
  }>().default({ showAvatar: true, showSocialLinks: true, showUsername: true }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  tier: varchar("tier", { length: 20 }).notNull().default("free"), // 'free' | 'medium' | 'premium'
  totalPoints: integer("total_points").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  country: varchar("country", { length: 100 }),
  language: varchar("language", { length: 10 }).default("en"),
  featuredInfluencer: boolean("featured_influencer").notNull().default(false),

  // Stars & Progressive Badges system
  starLevel: integer("star_level").notNull().default(0),               // 0-5
  progressBadge: varchar("progress_badge", { length: 20 }).notNull().default("none"),
  // 'none' | 'ninja' | 'samurai' | 'master' | 'goat'
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  lastProgressionCalc: timestamp("last_progression_calc"),

  // Gamification: Login Tracking (New)
  monthlyLoginCount: integer("monthly_login_count").default(0),
  lastLoginMonth: varchar("last_login_month", { length: 7 }), // Format: "YYYY-MM"
  lastLoginDate: timestamp("last_login_date"),

  // Security
  isAiChatBlocked: boolean("is_ai_chat_blocked").default(false),

  // Subscription tracking
  subscriptionId: varchar("subscription_id"),
  subscriptionStatus: varchar("subscription_status"), // 'active', 'trailing', 'past_due', 'canceled'
  currentPeriodEnd: timestamp("current_period_end"),
  subscriptionStartDate: timestamp("subscription_start_date"), // Set on first subscribe, RESET on resubscribe

  // Confidence Flag System - Event tracking
  yellowRedFlagsUsed: integer("yellow_red_flags_used").notNull().default(0),
  flagBudget: integer("flag_budget").notNull().default(0),
  currentEventId: varchar("current_event_id"),
  lastFlagResetAt: timestamp("last_flag_reset_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User picks table for fantasy predictions
export const userPicks = pgTable("user_picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fightId: varchar("fight_id").notNull(),
  pickedFighterId: varchar("picked_fighter_id").notNull(),
  pickedMethod: varchar("picked_method", { length: 50 }).notNull(),
  pickedRound: integer("picked_round"),
  units: integer("units").notNull().default(1), // 1-5 unit scale
  lockedOdds: varchar("locked_odds"), // American odds locked at submission: "+200", "-150"
  pointsAwarded: integer("points_awarded").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'voided'
  confidenceFlag: varchar("confidence_flag", { length: 20 }).notNull().default('none'), // 'none' | 'yellow' | 'red' | 'green'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userFightUniq: uniqueIndex("user_picks_user_id_fight_id_idx").on(table.userId, table.fightId),
  fightPickedIdx: index("user_picks_fight_id_picked_id_idx").on(table.fightId, table.pickedFighterId),
}));

// Fight results table for scoring
export const fightResults = pgTable("fight_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fightId: varchar("fight_id").notNull().unique(),
  winnerId: varchar("winner_id"),
  method: varchar("method", { length: 50 }),
  methodDetail: varchar("method_detail", { length: 255 }),
  round: integer("round"),
  time: varchar("time", { length: 20 }),
  referee: varchar("referee", { length: 255 }),
  stats: jsonb("stats").$type<{
    fighter1Stats?: Record<string, any>;
    fighter2Stats?: Record<string, any>;
  }>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== MODERATION TABLES ==========

// User Blocks - Server-enforced blocking
export const userBlocks = pgTable("user_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  blockerId: varchar("blocker_id").notNull(), // User who blocks
  blockedId: varchar("blocked_id").notNull(), // User who is blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// User Mutes - User-level suppression (soft)
export const userMutes = pgTable("user_mutes", {
  id: uuid("id").defaultRandom().primaryKey(),
  muterId: varchar("muter_id").notNull(), // User who mutes
  mutedId: varchar("muted_id").notNull(), // User who is muted
  expiresAt: timestamp("expires_at"), // null = permanent
  createdAt: timestamp("created_at").defaultNow(),
});

// User Reports - Admin review queue
export const userReports = pgTable("user_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterId: varchar("reporter_id").notNull(), // User who reports
  reportedId: varchar("reported_id").notNull(), // User who is reported
  reason: varchar("reason", { length: 500 }).notNull(),
  details: varchar("details", { length: 2000 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  adminNotes: varchar("admin_notes", { length: 2000 }),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== LEADERBOARD SNAPSHOTS ==========

// Leaderboard Snapshots - Historical rankings preservation
export const leaderboardSnapshots = pgTable("leaderboard_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotType: varchar("snapshot_type", { length: 20 }).notNull(), // 'event' | 'monthly' | 'yearly'
  eventId: uuid("event_id"), // null for monthly/yearly snapshots
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  snapshotDate: timestamp("snapshot_date").notNull(),
  rankings: jsonb("rankings").$type<{
    userId: string;
    rank: number;
    totalPoints?: number;
    netUnits?: number;
    username?: string;
    currentStreak?: number;
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  idempotencyKeyUniq: uniqueIndex("leaderboard_snapshots_idempotency_key_idx").on(table.idempotencyKey),
}));
// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatarUrl: z.string().optional().nullable(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    tiktok: z.string().url().optional().or(z.literal("")),
  }).optional(),
  privacySettings: z.object({
    showAvatar: z.boolean(),
    showSocialLinks: z.boolean(),
    showUsername: z.boolean(),
  }).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
});

export const insertUserPickSchema = createInsertSchema(userPicks).omit({ id: true, createdAt: true, updatedAt: true, pointsAwarded: true, isLocked: true });

// Canonical browser -> API contract for competitive picks. GRIT rankings use a
// fixed one-unit stake; method and round are non-scoring prediction metadata.
export const createPickRequestSchema = z.object({
  fightId: z.string().min(1),
  pickedFighterId: z.string().min(1),
  pickedMethod: z.enum(['KO/TKO', 'Submission', 'Decision', 'DQ']).default('Decision'),
  pickedRound: z.number().int().min(1).max(5).nullable().optional().default(null),
  units: z.literal(1).optional().default(1),
  confidenceFlag: z.enum(['none', 'yellow', 'red', 'green']).optional().default('none'),
});

export type CreatePickRequest = z.infer<typeof createPickRequestSchema>;
export const insertFightResultSchema = createInsertSchema(fightResults).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AuthUser = User & { permissions: string[] };
export type UserPick = typeof userPicks.$inferSelect;
export type InsertUserPick = typeof userPicks.$inferInsert;
export type FightResult = typeof fightResults.$inferSelect;
export type InsertFightResult = typeof fightResults.$inferInsert;
