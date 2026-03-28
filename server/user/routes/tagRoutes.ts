import type { Express, Response } from "express";

import { db } from "../../db";
import { fighterTagDefinitions, fighterTags } from "../../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from '../../utils/logger';

/**
 * Public tag read endpoints.
 * Admin tag management has been moved to admin/routes/adminTagRoutes.ts
 */
export function registerTagRoutes(app: Express) {

    // Get all tag definitions (public)
    app.get("/api/tags/definitions", async (_req, res: Response) => {
        try {
            const definitions = await db.select()
                .from(fighterTagDefinitions)
                .orderBy(asc(fighterTagDefinitions.sortOrder));
            res.json(definitions);
        } catch (error) {
            logger.error("Error fetching tag definitions:", error);
            res.status(500).json({ error: "Failed to fetch tag definitions" });
        }
    });

    // Get tags for a specific fighter (public)
    app.get("/api/fighters/:id/tags", async (req, res: Response) => {
        try {
            const { id } = req.params;

            const tags = await db.select({
                id: fighterTags.id,
                fighterId: fighterTags.fighterId,
                tagDefinitionId: fighterTags.tagDefinitionId,
                value: fighterTags.value,
                color: fighterTags.color,
                tagName: fighterTagDefinitions.name,
                tagDescription: fighterTagDefinitions.description,
                tagCategory: fighterTagDefinitions.category,
                sortOrder: fighterTagDefinitions.sortOrder,
                createdAt: fighterTags.createdAt,
                updatedAt: fighterTags.updatedAt,
            })
                .from(fighterTags)
                .innerJoin(fighterTagDefinitions, eq(fighterTags.tagDefinitionId, fighterTagDefinitions.id))
                .where(eq(fighterTags.fighterId, id))
                .orderBy(asc(fighterTagDefinitions.sortOrder));

            res.json(tags);
        } catch (error) {
            logger.error("Error fetching fighter tags:", error);
            res.status(500).json({ error: "Failed to fetch fighter tags" });
        }
    });
}
