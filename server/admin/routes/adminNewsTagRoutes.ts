import { Express, Request, Response } from "express";
import { db } from "../../../server/db";
import { tags } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../../auth/guards";
import { logger } from "../../utils/logger";

function requireAdmin(req: Request, res: Response, next: Function) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    next();
}

export function registerAdminNewsTagRoutes(app: Express) {
    // 1. Get all tags (including inactive ones for admin management)
    app.get("/api/admin/tags", isAuthenticated, requireAdmin, async (_req, res: Response) => {
        try {
            const allTags = await db.select().from(tags).orderBy(tags.name);
            res.json(allTags);
        } catch (error) {
            logger.error("Error fetching admin tags:", error);
            res.status(500).json({ error: "Failed to fetch tags" });
        }
    });

    // 2. Create a new tag
    app.post("/api/admin/tags", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { name, color, category } = req.body;
            
            if (!name || typeof name !== 'string') {
                return res.status(400).json({ error: "Tag name is required" });
            }

            // Clean inputs
            const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-');
            const cleanColor = color || '#6b7280';
            const cleanCategory = category === 'intelligence' ? 'intelligence' : 'standard';

            const [newTag] = await db.insert(tags).values({
                name: cleanName,
                color: cleanColor,
                category: cleanCategory,
                active: true
            }).returning();

            res.status(201).json(newTag);
        } catch (error: any) {
            logger.error("Error creating tag:", error);
            // Handle unique constraint violation on name
            if (error.code === '23505') {
                return res.status(409).json({ error: "A tag with this name already exists" });
            }
            res.status(500).json({ error: "Failed to create tag" });
        }
    });

    // 3. Update an existing tag (name, color, category, active status)
    app.patch("/api/admin/tags/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, color, category, active } = req.body;

            const updateData: any = {};
            
            if (name !== undefined) {
                updateData.name = name.toLowerCase().trim().replace(/\s+/g, '-');
            }
            if (color !== undefined) {
                updateData.color = color;
            }
            if (category !== undefined) {
                updateData.category = category === 'intelligence' ? 'intelligence' : 'standard';
            }
            if (active !== undefined) {
                updateData.active = Boolean(active);
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: "No fields to update provided" });
            }

            const [updatedTag] = await db.update(tags)
                .set(updateData)
                .where(eq(tags.id, id))
                .returning();

            if (!updatedTag) {
                return res.status(404).json({ error: "Tag not found" });
            }

            res.json(updatedTag);
        } catch (error: any) {
            logger.error("Error updating tag:", error);
             if (error.code === '23505') {
                return res.status(409).json({ error: "A tag with this name already exists" });
            }
            res.status(500).json({ error: "Failed to update tag" });
        }
    });
}
