import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { intelFeedItems } from "../../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from '../../utils/logger';

export function registerIntelFeedRoutes(app: Express) {
  // Public: fetch active intel feed items for the landing page ticker
  app.get("/api/intel-feed", async (_req: Request, res: Response) => {
    try {
      const items = await db.select()
        .from(intelFeedItems)
        .where(eq(intelFeedItems.isActive, true))
        .orderBy(asc(intelFeedItems.sortOrder));
      res.json(items);
    } catch (error) {
      logger.error("Error fetching public intel feed:", error);
      res.status(500).json({ error: "Failed to fetch intel feed" });
    }
  });
}
