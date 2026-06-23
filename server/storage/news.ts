import { newsArticles, type NewsArticle, type InsertNewsArticle } from "../../shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, type SQL } from "drizzle-orm";

export interface INewsStorage {
    getAllNewsArticles(): Promise<NewsArticle[]>;
    getPublishedNewsArticles(filters?: { tags?: string[], layer?: string }): Promise<NewsArticle[]>;
    getNewsArticle(id: string): Promise<NewsArticle | undefined>;
    createNewsArticle(article: InsertNewsArticle & { id: string; createdAt: Date; updatedAt: Date }): Promise<NewsArticle>;
    updateNewsArticle(id: string, article: Partial<InsertNewsArticle> & { updatedAt: Date }): Promise<NewsArticle | undefined>;
    deleteNewsArticle(id: string): Promise<boolean>;
    getNewsArticlesByFighter(fighterId: string): Promise<NewsArticle[]>;
}

export class NewsStorage implements INewsStorage {
    async getAllNewsArticles(): Promise<NewsArticle[]> {
        return await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
    }

    async getPublishedNewsArticles(filters?: { tags?: string[], layer?: string }): Promise<NewsArticle[]> {
        const query = db.select().from(newsArticles);
        const conditions: SQL[] = [eq(newsArticles.isPublished, true)];

        if (filters?.layer) {
            conditions.push(eq(newsArticles.layer, filters.layer));
        }

        if (filters?.tags && filters.tags.length > 0) {
            // SQL: news_articles.tags ?| array['tag1', 'tag2']
            conditions.push(sql`${newsArticles.tags} ?| array[${sql.join(filters.tags.map(t => sql`${t}`), sql`, `)}]::text[]`);
        }

        return await query
            .where(and(...conditions))
            .orderBy(desc(newsArticles.publishedAt));
    }

    async getNewsArticlesByFighter(fighterId: string): Promise<NewsArticle[]> {
        return await db.select().from(newsArticles)
            .where(eq(newsArticles.fighterReference, fighterId))
            .orderBy(desc(newsArticles.publishedAt));
    }

    async getNewsArticle(id: string): Promise<NewsArticle | undefined> {
        const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
        return article || undefined;
    }

    async createNewsArticle(article: InsertNewsArticle & { id: string; createdAt: Date; updatedAt: Date }): Promise<NewsArticle> {
        const [created] = await db.insert(newsArticles).values(article).returning();
        return created;
    }

    async updateNewsArticle(id: string, article: Partial<InsertNewsArticle> & { updatedAt: Date }): Promise<NewsArticle | undefined> {
        const [updated] = await db.update(newsArticles).set(article).where(eq(newsArticles.id, id)).returning();
        return updated || undefined;
    }

    async deleteNewsArticle(id: string): Promise<boolean> {
        const result = await db.delete(newsArticles).where(eq(newsArticles.id, id)).returning();
        return result.length > 0;
    }
}
