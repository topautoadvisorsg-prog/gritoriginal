import type { Express, Request } from "express";
import { db } from "../../db";
import { users } from "../../../shared/models/auth";
import { userKeys } from "../../../shared/schema";
import type { User } from "../../../shared/models/auth";
import { eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../../auth/guards";
import { calculateUserStreak } from "../../services/progressionService";
import { config } from "../../config/env";
import { logger } from "../../utils/logger";

/**
 * User-facing progression endpoints.
 *
 * Exposes the user's own stars/badge/keys/streak state.
 * Backend logic lives in services/progressionService.ts; these routes are the read API
 * the dashboard + profile + recap views consume.
 *
 * Per blueprint §8:
 * - Stars: 0-5, on 5th converts to next badge tier
 * - Badges: none → ninja → samurai → master → grandmaster → GOAT (grandmaster pending Week 2 migration)
 * - Keys: awarded on clean sweep events; 5 keys = Gold Key Badge
 * - Streak: only counts 2+ consecutive positive-ROI qualified events
 */
export function registerProgressionRoutes(app: Express): void {
    /**
     * GET /api/me/progression
     * Current progression snapshot for the authenticated user.
     */
    app.get("/api/me/progression", isAuthenticated, async (req: Request, res) => {
        try {
            const user = req.user as User;
            const userId = user.id;

            // 1. Fresh user row (req.user may be stale from session)
            const [u] = await db
                .select({
                    starLevel: users.starLevel,
                    progressBadge: users.progressBadge,
                    currentStreak: users.currentStreak,
                    maxStreak: users.maxStreak,
                    lastProgressionCalc: users.lastProgressionCalc,
                })
                .from(users)
                .where(eq(users.id, userId));

            if (!u) {
                return res.status(404).json({ message: "User not found" });
            }

            // 2. Keys count
            const [keysRow] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(userKeys)
                .where(eq(userKeys.userId, userId));

            const keysCount = Number(keysRow?.count ?? 0);

            // 3. Compute path-to-next-badge for UI ladder display
            const tiers = [...config.BADGE_TIERS];
            const currentBadgeIdx = tiers.indexOf(u.progressBadge as typeof tiers[number]);
            const nextBadge = currentBadgeIdx >= 0 && currentBadgeIdx < tiers.length - 1
                ? tiers[currentBadgeIdx + 1]
                : null;
            const starsToNextBadge = nextBadge ? Math.max(0, config.STAR_CAP - u.starLevel) : 0;

            // 4. Gold Key milestone progress (5 keys = unlock)
            const keysUntilGoldKey = Math.max(0, 5 - keysCount);
            const hasGoldKey = keysCount >= 5;

            res.json({
                starLevel: u.starLevel,
                progressBadge: u.progressBadge,
                currentStreak: u.currentStreak,
                maxStreak: u.maxStreak,
                lastProgressionCalc: u.lastProgressionCalc,
                keysCount,
                keysUntilGoldKey,
                hasGoldKey,
                nextBadge,
                starsToNextBadge,
                starCap: config.STAR_CAP,
            });
        } catch (error) {
            logger.error("Error fetching user progression:", error);
            res.status(500).json({ message: "Failed to fetch progression" });
        }
    });

    /**
     * GET /api/me/progression/streak
     * Recompute the user's current streak from event history.
     * Heavier than /progression — call only when streak detail is needed
     * (e.g., event recap view, profile streak widget).
     */
    app.get("/api/me/progression/streak", isAuthenticated, async (req: Request, res) => {
        try {
            const user = req.user as User;
            const streak = await calculateUserStreak(user.id);
            res.json({ currentStreak: streak });
        } catch (error) {
            logger.error("Error computing user streak:", error);
            res.status(500).json({ message: "Failed to compute streak" });
        }
    });

    /**
     * GET /api/me/keys
     * Detail list of all keys the user has earned (event id, awarded date, etc.).
     * Used by the keys collection display on the profile.
     */
    app.get("/api/me/keys", isAuthenticated, async (req: Request, res) => {
        try {
            const user = req.user as User;

            const keys = await db
                .select()
                .from(userKeys)
                .where(eq(userKeys.userId, user.id))
                .orderBy(sql`awarded_at DESC`);

            res.json({ keys, count: keys.length });
        } catch (error) {
            logger.error("Error fetching user keys:", error);
            res.status(500).json({ message: "Failed to fetch keys" });
        }
    });
}
