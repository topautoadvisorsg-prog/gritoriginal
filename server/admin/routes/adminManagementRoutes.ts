import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { eventFights, userBadges } from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, ilike, or, desc } from "drizzle-orm";
import { logger } from '../../utils/logger';

// Admin authorization is centralized in requireAdmin middleware

export function registerAdminManagementRoutes(app: Express) {

    // ──────────────────────────────────────
    // User Search (for admin panels)
    // ──────────────────────────────────────
    app.get("/api/admin/users/search", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const q = (req.query.q as string || "").trim();
            if (!q) return res.json([]);

            const pattern = `%${q}%`;
            const results = await db.select({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                tier: users.tier,
                isVerified: users.isVerified,
                featuredInfluencer: users.featuredInfluencer,
            })
                .from(users)
                .where(
                    or(
                        ilike(users.username, pattern),
                        ilike(users.email, pattern),
                        ilike(users.firstName, pattern),
                        ilike(users.lastName, pattern),
                    )
                )
                .limit(25);

            res.json(results);
        } catch (error) {
            logger.error("Error searching users:", error);
            res.status(500).json({ error: "Failed to search users" });
        }
    });

    // ──────────────────────────────────────
    // Admin Badge Management
    // ──────────────────────────────────────

    // Get badges for a specific user
    app.get("/api/admin/users/:userId/badges", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { userId } = req.params;
            const badges = await db.select()
                .from(userBadges)
                .where(eq(userBadges.userId, userId))
                .orderBy(desc(userBadges.awardedAt));

            res.json(badges);
        } catch (error) {
            logger.error("Error fetching user badges:", error);
            res.status(500).json({ error: "Failed to fetch badges" });
        }
    });

    // Assign a badge to a user
    app.post("/api/admin/users/:userId/badges", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { userId } = req.params;
            const { badgeName, badgeIcon, reason } = req.body;

            if (!badgeName) {
                return res.status(400).json({ error: "Badge name is required" });
            }

            const [badge] = await db.insert(userBadges)
                .values({
                    userId,
                    badgeName,
                    badgeIcon: badgeIcon || '🏆',
                    reason: reason || null,
                })
                .returning();

            res.json(badge);
        } catch (error) {
            logger.error("Error assigning badge:", error);
            res.status(500).json({ error: "Failed to assign badge" });
        }
    });

    // Remove a badge
    app.delete("/api/admin/users/:userId/badges/:badgeId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { badgeId } = req.params;
            const [deleted] = await db.delete(userBadges)
                .where(eq(userBadges.id, badgeId))
                .returning();

            if (!deleted) {
                return res.status(404).json({ error: "Badge not found" });
            }

            res.json(deleted);
        } catch (error) {
            logger.error("Error removing badge:", error);
            res.status(500).json({ error: "Failed to remove badge" });
        }
    });

    // ──────────────────────────────────────
    // Admin Odds Editing
    // ──────────────────────────────────────

    // Update odds for a fight
    app.put("/api/admin/fights/:fightId/odds", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { fightId } = req.params;
            const { odds } = req.body;

            const [updated] = await db.update(eventFights)
                .set({ odds })
                .where(eq(eventFights.id, fightId))
                .returning();

            if (!updated) {
                return res.status(404).json({ error: "Fight not found" });
            }

            res.json(updated);
        } catch (error) {
            logger.error("Error updating odds:", error);
            res.status(500).json({ error: "Failed to update odds" });
        }
    });
}
