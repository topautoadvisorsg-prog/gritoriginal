import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { db } from "../../db";
import { fighterTagDefinitions, fighterTags } from "../../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';

/**
 * Admin-only tag management routes.
 * Protected by isAuthenticated + requireAdmin middleware.
 */
export function registerAdminTagRoutes(app: Express) {

    // Create a tag definition (admin only)
    app.post("/api/tags/definitions", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { name, description, sortOrder, category } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: "Tag name is required" });
            }

            const [newDef] = await db.insert(fighterTagDefinitions)
                .values({
                    id: uuidv4(),
                    name: name.trim(),
                    description: description || null,
                    category: category || 'Intangibles',
                    sortOrder: sortOrder || 0,
                    createdAt: new Date(),
                })
                .returning();

            res.status(201).json(newDef);
        } catch (error: any) {
            if (error.code === "23505") {
                return res.status(400).json({ error: "Tag with this name already exists" });
            }
            logger.error("Error creating tag definition:", error);
            res.status(500).json({ error: "Failed to create tag definition" });
        }
    });

    // Delete a tag definition (admin only)
    app.delete("/api/tags/definitions/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Delete all fighter tags using this definition first
            await db.delete(fighterTags).where(eq(fighterTags.tagDefinitionId, id));

            await db.delete(fighterTagDefinitions)
                .where(eq(fighterTagDefinitions.id, id));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting tag definition:", error);
            res.status(500).json({ error: "Failed to delete tag definition" });
        }
    });

    // Set/update tags for a fighter (admin only)
    // Accepts array of { tagDefinitionId, value, color }
    app.post("/api/fighters/:id/tags", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id: fighterId } = req.params;
            const { tags } = req.body;

            if (!Array.isArray(tags)) {
                return res.status(400).json({ error: "Tags must be an array" });
            }

            // Delete existing tags for this fighter
            await db.delete(fighterTags).where(eq(fighterTags.fighterId, fighterId));

            // Insert new tags
            if (tags.length > 0) {
                const now = new Date();
                const values = tags.map((tag: any) => ({
                    id: uuidv4(),
                    fighterId,
                    tagDefinitionId: tag.tagDefinitionId,
                    value: Math.max(1, Math.min(10, tag.value || 5)),
                    color: tag.color || '#3b82f6',
                    createdAt: now,
                    updatedAt: now,
                }));

                await db.insert(fighterTags).values(values);
            }

            // Return updated tags
            const updatedTags = await db.select({
                id: fighterTags.id,
                fighterId: fighterTags.fighterId,
                tagDefinitionId: fighterTags.tagDefinitionId,
                value: fighterTags.value,
                color: fighterTags.color,
                tagName: fighterTagDefinitions.name,
                tagDescription: fighterTagDefinitions.description,
                tagCategory: fighterTagDefinitions.category,
                sortOrder: fighterTagDefinitions.sortOrder,
            })
                .from(fighterTags)
                .innerJoin(fighterTagDefinitions, eq(fighterTags.tagDefinitionId, fighterTagDefinitions.id))
                .where(eq(fighterTags.fighterId, fighterId))
                .orderBy(asc(fighterTagDefinitions.sortOrder));

            res.json(updatedTags);
        } catch (error) {
            logger.error("Error setting fighter tags:", error);
            res.status(500).json({ error: "Failed to set fighter tags" });
        }
    });

    // Delete a specific tag from a fighter (admin only)
    app.delete("/api/fighters/:fighterId/tags/:tagId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { tagId } = req.params;
            await db.delete(fighterTags).where(eq(fighterTags.id, tagId));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting fighter tag:", error);
            res.status(500).json({ error: "Failed to delete fighter tag" });
        }
    });
}
