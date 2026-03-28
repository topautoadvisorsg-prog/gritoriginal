import type { Express, Request } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { users, eventFights, fightResults } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from '../../utils/logger';

// Admin authorization is centralized in requireAdmin middleware

export function registerAdminFightResultsRoutes(app: Express) {
  app.get("/api/admin/fights", isAuthenticated, requireAdmin, async (req: Request, res) => {
    try {
      const currentUserId = req.user.id;
      // Admin access enforced by requireAdmin middleware

      const fights = await db.select().from(eventFights);
      const results = await db.select().from(fightResults);

      const resultsMap = new Map(results.map(r => [r.fightId, r]));

      const fightsWithResults = fights.map(fight => ({
        ...fight,
        result: resultsMap.get(fight.id) || null,
      }));

      res.json(fightsWithResults);
    } catch (error) {
      logger.error("Error fetching admin fights:", error);
      res.status(500).json({ message: "Failed to fetch fights" });
    }
  });
}
