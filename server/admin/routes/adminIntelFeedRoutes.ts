import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { intelFeedItems } from "../../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from '../../utils/logger';

export function registerAdminIntelFeedRoutes(app: Express) {
  // List all intel feed items (admin)
  app.get("/api/admin/intel-feed", isAuthenticated, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const items = await db.select().from(intelFeedItems).orderBy(asc(intelFeedItems.sortOrder));
      res.json(items);
    } catch (error) {
      logger.error("Error fetching intel feed items:", error);
      res.status(500).json({ error: "Failed to fetch intel feed items" });
    }
  });

  // Create a new intel feed item
  app.post("/api/admin/intel-feed", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { content, emoji, sortOrder } = req.body;
      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      const [created] = await db.insert(intelFeedItems).values({
        content: content.trim(),
        emoji: (emoji && typeof emoji === 'string') ? emoji.trim() : '⚡',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: true,
        createdBy: req.user?.id,
      }).returning();
      res.json(created);
    } catch (error) {
      logger.error("Error creating intel feed item:", error);
      res.status(500).json({ error: "Failed to create intel feed item" });
    }
  });

  // Update an intel feed item
  app.patch("/api/admin/intel-feed/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (req.body.content !== undefined) {
        if (typeof req.body.content !== 'string' || !req.body.content.trim()) {
          return res.status(400).json({ error: "Content must be a non-empty string" });
        }
        updates.content = req.body.content.trim();
      }
      if (req.body.emoji !== undefined) {
        updates.emoji = req.body.emoji;
      }
      if (req.body.sortOrder !== undefined) {
        updates.sortOrder = Number(req.body.sortOrder);
      }
      if (req.body.isActive !== undefined) {
        updates.isActive = Boolean(req.body.isActive);
      }

      const [updated] = await db.update(intelFeedItems)
        .set(updates)
        .where(eq(intelFeedItems.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: "Item not found" });
      res.json(updated);
    } catch (error) {
      logger.error("Error updating intel feed item:", error);
      res.status(500).json({ error: "Failed to update intel feed item" });
    }
  });

  // Delete an intel feed item
  app.delete("/api/admin/intel-feed/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(intelFeedItems)
        .where(eq(intelFeedItems.id, id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting intel feed item:", error);
      res.status(500).json({ error: "Failed to delete intel feed item" });
    }
  });
}
