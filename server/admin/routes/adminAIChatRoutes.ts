import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { aiChatConfig, aiChatLogs, aiSuggestedQuestions } from "../../../shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

export function registerAdminAIChatRoutes(app: Express) {
  app.get("/api/admin/ai/config", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const configs = await db.select().from(aiChatConfig);
      res.json(configs);
    } catch (error) {
      logger.error("Error fetching AI config:", error);
      res.status(500).json({ error: "Failed to fetch AI config" });
    }
  });

  app.post("/api/admin/ai/config", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { section, content } = req.body;
      if (!section || !content) return res.status(400).json({ error: "Missing section or content" });

      const existing = await db.select().from(aiChatConfig).where(eq(aiChatConfig.section, section));

      if (existing.length > 0) {
        await db.update(aiChatConfig)
          .set({ content, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(aiChatConfig.section, section));
      } else {
        await db.insert(aiChatConfig).values({
          id: uuidv4(),
          section,
          content,
          updatedBy: req.user.id
        });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error("Error updating AI config:", error);
      res.status(500).json({ error: "Failed to update AI config" });
    }
  });

  app.get("/api/admin/ai/logs", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await db.select()
        .from(aiChatLogs)
        .orderBy(desc(aiChatLogs.createdAt))
        .limit(Number(limit));
      res.json(logs);
    } catch (error) {
      logger.error("Error fetching AI logs:", error);
      res.status(500).json({ error: "Failed to fetch AI logs" });
    }
  });

  app.get("/api/admin/ai/suggested-questions", isAuthenticated, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const questions = await db.select()
        .from(aiSuggestedQuestions)
        .orderBy(asc(aiSuggestedQuestions.sortOrder));
      res.json(questions);
    } catch (error) {
      logger.error("Error fetching suggested questions:", error);
      res.status(500).json({ error: "Failed to fetch suggested questions" });
    }
  });

  app.post("/api/admin/ai/suggested-questions", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { question, sortOrder } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: "Question text is required" });
      }
      const [created] = await db.insert(aiSuggestedQuestions).values({
        id: uuidv4(),
        question: question.trim(),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: true,
      }).returning();
      res.json(created);
    } catch (error) {
      logger.error("Error creating suggested question:", error);
      res.status(500).json({ error: "Failed to create suggested question" });
    }
  });

  app.patch("/api/admin/ai/suggested-questions/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates: Partial<{
        question: string;
        sortOrder: number;
        isActive: boolean;
      }> = {};

      if (req.body.question !== undefined) {
        if (typeof req.body.question !== 'string' || !req.body.question.trim()) {
          return res.status(400).json({ error: "Question must be a non-empty string" });
        }
        updates.question = req.body.question.trim();
      }
      if (req.body.sortOrder !== undefined) {
        if (typeof req.body.sortOrder !== 'number') {
          return res.status(400).json({ error: "Sort order must be a number" });
        }
        updates.sortOrder = req.body.sortOrder;
      }
      if (req.body.isActive !== undefined) {
        if (typeof req.body.isActive !== 'boolean') {
          return res.status(400).json({ error: "isActive must be a boolean" });
        }
        updates.isActive = req.body.isActive;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const [updated] = await db.update(aiSuggestedQuestions)
        .set(updates)
        .where(eq(aiSuggestedQuestions.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: "Question not found" });
      res.json(updated);
    } catch (error) {
      logger.error("Error updating suggested question:", error);
      res.status(500).json({ error: "Failed to update suggested question" });
    }
  });

  app.delete("/api/admin/ai/suggested-questions/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(aiSuggestedQuestions)
        .where(eq(aiSuggestedQuestions.id, id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Question not found" });
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting suggested question:", error);
      res.status(500).json({ error: "Failed to delete suggested question" });
    }
  });
}
