import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { fightNotes, eventFights, events, fightResults } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../../auth/guards";
import { logger } from "../../utils/logger";
import { verifyFightState } from "../../middleware/fightState";

export function registerFightNotesRoutes(app: Express): void {
  // Get user's note for a specific fight
  app.get("/api/fights/:fightId/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { fightId } = req.params;
      const userId = (req.user as any).id;

      const [note] = await db
        .select()
        .from(fightNotes)
        .where(and(eq(fightNotes.fightId, fightId), eq(fightNotes.userId, userId)));

      res.json(note || null);
    } catch (error) {
      logger.error("Error fetching fight note:", error);
      res.status(500).json({ message: "Failed to fetch fight note" });
    }
  });

  // Create or update a note
  app.post("/api/fights/:fightId/notes", isAuthenticated, verifyFightState(['CLOSED']), async (req: Request, res: Response) => {
    try {
      const { fightId } = req.params;
      const userId = (req.user as any).id;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      // Enforce 24h reflection window
      const [result] = await db
        .select()
        .from(fightResults)
        .where(eq(fightResults.fightId, fightId));

      if (!result || !result.completedAt) {
        return res.status(403).json({ message: "Fight results not final, cannot add notes yet." });
      }

      const completedAt = new Date(result.completedAt);
      const now = new Date();
      const diffHours = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return res.status(403).json({ message: "Reflection window has closed." });
      }

      // Check if note exists
      const [existingNote] = await db
        .select()
        .from(fightNotes)
        .where(and(eq(fightNotes.fightId, fightId), eq(fightNotes.userId, userId)));

      let savedNote;
      if (existingNote) {
        // Update
        [savedNote] = await db
          .update(fightNotes)
          .set({ content, updatedAt: new Date() })
          .where(eq(fightNotes.id, existingNote.id))
          .returning();
      } else {
        // Insert
        [savedNote] = await db
          .insert(fightNotes)
          .values({
            userId,
            fightId,
            content,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }

      res.json(savedNote);
    } catch (error) {
      logger.error("Error saving fight note:", error);
      res.status(500).json({ message: "Failed to save fight note" });
    }
  });
}
