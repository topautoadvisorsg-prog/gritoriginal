import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { storage } from "../../storage";
import { insertNewsArticleSchema } from "../../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { createNewsSchema } from '../../schemas';

export function registerAdminNewsRoutes(app: Express) {
  app.post("/api/news", isAuthenticated, requireAdmin, validate(createNewsSchema), async (req: Request, res: Response) => {
    try {
      const articleData = insertNewsArticleSchema.parse(req.body);

      const newArticle = await storage.createNewsArticle({
        ...articleData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json(newArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid article data", errors: error.errors });
      } else {
        logger.error("Error creating article:", error);
        res.status(500).json({ message: "Failed to create article" });
      }
    }
  });

  app.put("/api/news/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const articleData = insertNewsArticleSchema.partial().parse(req.body);

      const updatedArticle = await storage.updateNewsArticle(req.params.id, {
        ...articleData,
        updatedAt: new Date().toISOString()
      });

      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid article data", errors: error.errors });
      } else {
        logger.error("Error updating article:", error);
        res.status(500).json({ message: "Failed to update article" });
      }
    }
  });

  app.delete("/api/news/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNewsArticle(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });
}
