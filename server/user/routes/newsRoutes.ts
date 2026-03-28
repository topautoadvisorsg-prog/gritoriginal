import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { db } from "../../db";
import { tags } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export function registerNewsRoutes(app: Express) {
  // Get active tags for filtering dropdowns
  app.get("/api/tags/active", async (_req: Request, res: Response) => {
    try {
      const activeTags = await db.select().from(tags).where(eq(tags.active, true)).orderBy(tags.name);
      res.json(activeTags);
    } catch (error) {
      logger.error("Error fetching active tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // Get news feed with optional filtering
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const layer = req.query.layer as string | undefined;
      const tagQuery = req.query.tag;
      
      let tagFilters: string[] | undefined = undefined;
      if (tagQuery) {
        tagFilters = Array.isArray(tagQuery) ? tagQuery as string[] : [tagQuery as string];
      }

      const articles = await storage.getPublishedNewsArticles({ layer, tags: tagFilters });
      
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = articles.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, articles.length, params));
      }
      res.json(articles);
    } catch (error) {
      logger.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/fighter/:fighterId", async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      const articles = await storage.getNewsArticlesByFighter(fighterId as string);
      res.json(articles);
    } catch (error) {
      logger.error("Error fetching fighter articles:", error);
      res.status(500).json({ error: "Failed to fetch fighter articles" });
    }
  });

  app.get("/api/news/:id", async (req: Request, res: Response) => {
    try {
      const article = await storage.getNewsArticle(req.params.id as string);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      logger.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
}
