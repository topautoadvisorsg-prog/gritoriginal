import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { users } from "../../../shared/models/auth";
import { eq, desc } from "drizzle-orm";
import { logger } from '../../utils/logger';

// Admin authorization is centralized in requireAdmin middleware

export function registerVerificationRoutes(app: Express) {

    // Get all verified users (influencer tab - public)
    app.get("/api/influencers", async (_req, res: Response) => {
        try {
            const influencers = await db.select({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                avatarUrl: users.avatarUrl,
                profileImageUrl: users.profileImageUrl,
                socialLinks: users.socialLinks,
                isVerified: users.isVerified,
                featuredInfluencer: users.featuredInfluencer,
                totalPoints: users.totalPoints,
                tier: users.tier,
            })
                .from(users)
                .where(eq(users.isVerified, true))
                .orderBy(desc(users.featuredInfluencer));

            res.json(influencers);
        } catch (error) {
            logger.error("Error fetching influencers:", error);
            res.status(500).json({ error: "Failed to fetch influencers" });
        }
    });

    // Admin: Verify/unverify a user
    app.post("/api/admin/users/:id/verify", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { id } = req.params;
            const { verified } = req.body; // boolean

            const [updatedUser] = await db.update(users)
                .set({
                    isVerified: verified !== false,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, id))
                .returning();

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error updating verification:", error);
            res.status(500).json({ error: "Failed to update verification" });
        }
    });

    // Admin: Pin/unpin as featured influencer
    app.post("/api/admin/users/:id/feature", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            // Admin access enforced by requireAdmin middleware

            const { id } = req.params;
            const { featured } = req.body; // boolean

            const [updatedUser] = await db.update(users)
                .set({
                    featuredInfluencer: featured !== false,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, id))
                .returning();

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error updating featured status:", error);
            res.status(500).json({ error: "Failed to update featured status" });
        }
    });
}
