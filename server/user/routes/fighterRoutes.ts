import type { Express, Request, Response } from "express";
import { isAuthenticated } from '../../auth/guards';
import { eq } from "drizzle-orm";
import { fightHistory } from "../../../shared/schema";
import { db } from "../../db";
import { storage } from "../../storage";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { z } from 'zod';

const correctionSchema = z.object({
  whatIsWrong: z.string().min(10).max(1000),
  sourceLink: z.string().url().optional().or(z.literal('')),
});

export function registerFighterRoutes(app: Express) {
  // Fighters list and detail are public (read-only)
  app.get("/api/fighters", async (req: Request, res: Response) => {
    try {
      const fighters = await storage.getAllFighters();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = fighters.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, fighters.length, params));
      }
      res.json(fighters);
    } catch (error) {
      logger.error("Error fetching fighters:", error);
      res.status(500).json({ error: "Failed to fetch fighters" });
    }
  });

  app.get("/api/fighters/:id", async (req: Request, res: Response) => {
    try {
      const fighter = await storage.getFighter(req.params.id as string);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      res.json(fighter);
    } catch (error) {
      logger.error("Error fetching fighter:", error);
      res.status(500).json({ error: "Failed to fetch fighter" });
    }
  });

  // Public fight history endpoints
  app.get("/api/fights", async (req: Request, res: Response) => {
    try {
      const fights = await storage.getAllFightHistory();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = fights.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, fights.length, params));
      }
      res.json(fights);
    } catch (error) {
      logger.error("Error fetching all fight history:", error);
      res.status(500).json({ error: "Failed to fetch fight history" });
    }
  });

  app.get("/api/fights/unlinked", async (_req: Request, res: Response) => {
    try {
      const unlinked = await db.select().from(fightHistory).where(eq(fightHistory.opponentLinked, false));
      res.json(unlinked);
    } catch (error) {
      logger.error("Error fetching unlinked fights:", error);
      res.status(500).json({ error: "Failed to fetch unlinked fights" });
    }
  });

  app.get("/api/fighters/:id/fights", async (req: Request, res: Response) => {
    try {
      const fights = await storage.getFightHistoryByFighter(req.params.id as string);
      res.json(fights);
    } catch (error) {
      logger.error("Error fetching fight history:", error);
      res.status(500).json({ error: "Failed to fetch fight history" });
    }
  });

  app.post("/api/fighters/:id/corrections", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = correctionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission", details: parsed.error.issues });
      }
      const fighter = await storage.getFighter(req.params.id as string);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      const correction = await storage.createFighterCorrection({
        fighterId: req.params.id as string,
        submittedBy: req.user?.id ?? null,
        whatIsWrong: parsed.data.whatIsWrong,
        sourceLink: parsed.data.sourceLink || null,
        status: 'pending',
      });
      res.status(201).json(correction);
    } catch (error) {
      logger.error("Error submitting correction:", error);
      res.status(500).json({ error: "Failed to submit correction" });
    }
  });
}
