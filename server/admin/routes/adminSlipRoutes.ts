import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { db } from "../../db";
import { slips, chatNotifications } from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger";
import * as adminService from "../../services/adminService";

/**
 * Admin Slip Management routes — moderation queue, featured wall, approve/reject/delete.
 * All routes require admin authentication (enforced globally in admin-server.ts).
 */
export function registerAdminSlipRoutes(app: Express) {

    // Helper: enrich slip with username
    async function enrichSlip(slip: typeof slips.$inferSelect) {
        const [user] = await db.select({ username: users.username, email: users.email, avatarUrl: users.avatarUrl })
            .from(users).where(eq(users.id, slip.userId)).limit(1);
        return {
            ...slip,
            username: user?.username || user?.email || slip.userId,
            avatarUrl: user?.avatarUrl,
        };
    }

    // ── Pending Queue ─────────────────────────────────────────────────────────

    // GET /api/admin/slips/pending
    app.get("/api/admin/slips/pending", async (_req: Request, res: Response) => {
        try {
            const pending = await db.select()
                .from(slips)
                .where(eq(slips.status, "pending"))
                .orderBy(asc(slips.createdAt));

            const enriched = await Promise.all(pending.map(enrichSlip));
            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching pending slips:", error);
            res.status(500).json({ error: "Failed to fetch pending slips" });
        }
    });

    // ── Featured Slip Wall ────────────────────────────────────────────────────

    // GET /api/admin/slips/featured — all featured slips (admin view, no expiry filter)
    app.get("/api/admin/slips/featured", async (_req: Request, res: Response) => {
        try {
            const featured = await db.select()
                .from(slips)
                .where(eq(slips.isFeatured, true))
                .orderBy(desc(slips.featuredAt));

            const enriched = await Promise.all(featured.map(enrichSlip));
            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching featured slips:", error);
            res.status(500).json({ error: "Failed to fetch featured slips" });
        }
    });

    // GET /api/admin/slip-wall — admin view of the public slip wall (all featured, no expiry filter)
    app.get("/api/admin/slip-wall", async (_req: Request, res: Response) => {
        try {
            const featured = await db.select()
                .from(slips)
                .where(eq(slips.isFeatured, true))
                .orderBy(desc(slips.featuredAt));

            const enriched = await Promise.all(featured.map(enrichSlip));
            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching admin slip wall:", error);
            res.status(500).json({ error: "Failed to fetch slip wall" });
        }
    });

    // GET /api/admin/slips/all — all slips with status filter
    app.get("/api/admin/slips/all", async (req: Request, res: Response) => {
        try {
            const { status } = req.query;

            let query = db.select().from(slips).$dynamic();
            if (status && status !== "all") {
                query = query.where(eq(slips.status, status as string));
            }

            const all = await query.orderBy(desc(slips.createdAt)).limit(100);
            const enriched = await Promise.all(all.map(enrichSlip));
            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching all slips:", error);
            res.status(500).json({ error: "Failed to fetch slips" });
        }
    });

    // ── Patch (approve / feature / reject / caption / unfeature) ─────────────

    // PATCH /api/admin/slips/:id
    // Body: { action: 'approve' | 'feature' | 'reject' | 'unfeature' | 'caption', caption?: string, rejectionMessage?: string }
    app.patch("/api/admin/slips/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { action, caption, rejectionMessage } = req.body;
            const adminId = req.user.id;

            const [slip] = await db.select().from(slips).where(eq(slips.id, id)).limit(1);
            if (!slip) {
                return res.status(404).json({ error: "Slip not found" });
            }

            let updates: Partial<typeof slips.$inferInsert> = {};
            let notificationType: string | null = null;
            let notificationMessage: string | null = null;
            let auditAction: string = "";

            switch (action) {
                case "approve":
                    updates = { status: "approved", approvedAt: new Date() };
                    notificationType = "slip_approved";
                    notificationMessage = "Your slip has been approved and is now visible in chat!";
                    auditAction = "SLIP_APPROVE";
                    break;

                case "feature":
                    updates = {
                        status: "approved",
                        approvedAt: slip.approvedAt ?? new Date(),
                        isFeatured: true,
                        featuredAt: new Date(),
                        caption: caption ?? slip.caption,
                    };
                    notificationType = "slip_featured";
                    notificationMessage = "Your slip has been featured on the Slip Wall! 🔥";
                    auditAction = "SLIP_FEATURE";
                    break;

                case "unfeature":
                    updates = { isFeatured: false };
                    auditAction = "SLIP_UNFEATURE";
                    break;

                case "reject":
                    updates = { status: "rejected" };
                    notificationType = "slip_rejected";
                    notificationMessage = rejectionMessage
                        ? `Your slip was not approved: ${rejectionMessage}`
                        : "Your slip was not approved. Please review our community guidelines.";
                    if (rejectionMessage) {
                        updates.rejectionMessage = rejectionMessage;
                    }
                    auditAction = "SLIP_REJECT";
                    break;

                case "caption":
                    if (!caption) {
                        return res.status(400).json({ error: "caption is required" });
                    }
                    updates = { caption };
                    auditAction = "SLIP_CAPTION";
                    break;

                default:
                    return res.status(400).json({ error: "Invalid action" });
            }

            const [updated] = await db
                .update(slips)
                .set(updates)
                .where(eq(slips.id, id))
                .returning();

            // Send in-app notification if needed
            if (notificationType && notificationMessage) {
                await db.insert(chatNotifications).values({
                    id: uuidv4(),
                    userId: slip.userId,
                    type: notificationType,
                    message: notificationMessage,
                    slipId: slip.id,
                    isRead: false,
                });
            }

            // Audit log
            await adminService.logAdminAction(
                adminId,
                auditAction,
                "SLIP",
                id,
                { action, caption, rejectionMessage, userId: slip.userId },
                req.ip || "unknown"
            );

            res.json(updated);
        } catch (error) {
            logger.error("Error updating slip:", error);
            res.status(500).json({ error: "Failed to update slip" });
        }
    });

    // ── Delete any slip ───────────────────────────────────────────────────────

    // DELETE /api/admin/slips/:id
    app.delete("/api/admin/slips/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            const [slip] = await db.select().from(slips).where(eq(slips.id, id)).limit(1);
            if (!slip) {
                return res.status(404).json({ error: "Slip not found" });
            }

            // Delete file from filesystem (strip leading slash so path.join resolves correctly)
            const absPath = path.join(process.cwd(), slip.imageUrl.replace(/^\//, ""));
            if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
            }

            await db.delete(slips).where(eq(slips.id, id));

            await adminService.logAdminAction(
                adminId,
                "SLIP_DELETE",
                "SLIP",
                id,
                { userId: slip.userId, imageUrl: slip.imageUrl },
                req.ip || "unknown"
            );

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting slip:", error);
            res.status(500).json({ error: "Failed to delete slip" });
        }
    });
}
