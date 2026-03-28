import type { Express } from "express";

import { db } from "../../db";
import { fightResults } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from '../../utils/logger';

/**
 * Public fight result read endpoints.
 * Admin fight result finalization has been moved to admin/routes/adminFightResolutionRoutes.ts
 */
export function registerFightResultsRoutes(app: Express): void {

  // Get fight result for a specific fight
  app.get("/api/fights/:fightId/result", async (req, res) => {
    try {
      const { fightId } = req.params;

      const [result] = await db
        .select()
        .from(fightResults)
        .where(eq(fightResults.fightId, fightId));

      res.json(result || null);
    } catch (error) {
      logger.error("Error fetching fight result:", error);
      res.status(500).json({ message: "Failed to fetch fight result" });
    }
  });

  // Get all fight results
  app.get("/api/fights/results", async (_req, res) => {
    try {
      const results = await db.select().from(fightResults);
      res.json(results);
    } catch (error) {
      logger.error("Error fetching fight results:", error);
      res.status(500).json({ message: "Failed to fetch fight results" });
    }
  });

}
