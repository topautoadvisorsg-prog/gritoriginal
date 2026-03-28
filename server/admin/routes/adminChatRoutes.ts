import type { Express, Request, Response } from "express";
import { db } from "../../db";
import {
    chatMessages,
    chatMutes,
    chatBans,
    chatConfig,
    adminAuditLogs,
} from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger";
import * as adminService from "../../services/adminService";

/**
 * Admin Chat Management routes — ON/OFF, messages, mutes, bans, activity log.
 * All routes require admin authentication (enforced globally in admin-server.ts).
 */
export function registerAdminChatRoutes(app: Express) {

    // ── Config ────────────────────────────────────────────────────────────────

    // GET /api/admin/chat/config
    app.get("/api/admin/chat/config", async (_req: Request, res: Response) => {
        try {
            const [config] = await db.select().from(chatConfig).where(eq(chatConfig.id, 1));
            res.json(config ?? { id: 1, isOpen: true, cooldownMinutes: 30 });
        } catch (error) {
            logger.error("Error fetching chat config:", error);
            res.status(500).json({ error: "Failed to fetch config" });
        }
    });

    // PATCH /api/admin/chat/config
    app.patch("/api/admin/chat/config", async (req: Request, res: Response) => {
        try {
            const { isOpen, cooldownMinutes } = req.body;
            const adminId = req.user.id;

            // Upsert the single config row
            const [existing] = await db.select().from(chatConfig).where(eq(chatConfig.id, 1));

            const updates: Partial<typeof chatConfig.$inferInsert> = {
                updatedAt: new Date(),
                updatedBy: adminId,
            };
            if (typeof isOpen === "boolean") updates.isOpen = isOpen;
            if (typeof cooldownMinutes === "number") updates.cooldownMinutes = cooldownMinutes;

            let result;
            if (existing) {
                [result] = await db.update(chatConfig).set(updates).where(eq(chatConfig.id, 1)).returning();
            } else {
                [result] = await db.insert(chatConfig).values({ id: 1, ...updates }).returning();
            }

            await adminService.logAdminAction(
                adminId,
                "UPDATE_CHAT_CONFIG",
                "CHAT",
                "config",
                { isOpen, cooldownMinutes },
                req.ip || "unknown"
            );

            res.json(result);
        } catch (error) {
            logger.error("Error updating chat config:", error);
            res.status(500).json({ error: "Failed to update config" });
        }
    });

    // ── Messages ──────────────────────────────────────────────────────────────

    // GET /api/admin/chat/messages?chatType=global&limit=50&offset=0
    app.get("/api/admin/chat/messages", async (req: Request, res: Response) => {
        try {
            const { chatType = "global", limit = "50", offset = "0" } = req.query;

            const msgs = await db.select()
                .from(chatMessages)
                .where(eq(chatMessages.chatType, chatType as string))
                .orderBy(desc(chatMessages.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));

            // Enrich with usernames
            const enriched = await Promise.all(msgs.map(async (msg) => {
                const [user] = await db.select({ username: users.username, email: users.email })
                    .from(users)
                    .where(eq(users.id, msg.userId))
                    .limit(1);
                return { ...msg, username: user?.username || user?.email || msg.userId };
            }));

            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching chat messages:", error);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });

    // DELETE /api/admin/chat/messages/:id
    app.delete("/api/admin/chat/messages/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            const [msg] = await db.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
            if (!msg) {
                return res.status(404).json({ error: "Message not found" });
            }

            await db.delete(chatMessages).where(eq(chatMessages.id, id));

            await adminService.logAdminAction(
                adminId,
                "DELETE_CHAT_MESSAGE",
                "CHAT_MESSAGE",
                id,
                { userId: msg.userId, preview: msg.message.slice(0, 100) },
                req.ip || "unknown"
            );

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting chat message:", error);
            res.status(500).json({ error: "Failed to delete message" });
        }
    });

    // ── Mutes ─────────────────────────────────────────────────────────────────

    // GET /api/admin/chat/mutes
    app.get("/api/admin/chat/mutes", async (_req: Request, res: Response) => {
        try {
            const mutes = await db.select()
                .from(chatMutes)
                .orderBy(desc(chatMutes.createdAt));

            const enriched = await Promise.all(mutes.map(async (mute) => {
                const [user] = await db.select({ username: users.username, email: users.email })
                    .from(users).where(eq(users.id, mute.userId)).limit(1);
                return { ...mute, username: user?.username || user?.email || mute.userId };
            }));

            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching mutes:", error);
            res.status(500).json({ error: "Failed to fetch mutes" });
        }
    });

    // POST /api/admin/chat/mute
    app.post("/api/admin/chat/mute", async (req: Request, res: Response) => {
        try {
            const { userId, reason, durationHours } = req.body;
            const adminId = req.user.id;

            if (!userId) {
                return res.status(400).json({ error: "userId is required" });
            }

            const expiresAt = durationHours
                ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
                : null;

            const [mute] = await db.insert(chatMutes)
                .values({
                    id: uuidv4(),
                    userId,
                    moderatorId: adminId,
                    reason: reason || null,
                    expiresAt,
                })
                .returning();

            await adminService.logAdminAction(
                adminId,
                "CHAT_MUTE_USER",
                "USER",
                userId,
                { reason, durationHours, expiresAt },
                req.ip || "unknown"
            );

            res.status(201).json(mute);
        } catch (error) {
            logger.error("Error muting user:", error);
            res.status(500).json({ error: "Failed to mute user" });
        }
    });

    // DELETE /api/admin/chat/mutes/:id
    app.delete("/api/admin/chat/mutes/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            const [mute] = await db.select().from(chatMutes).where(eq(chatMutes.id, id)).limit(1);
            if (!mute) {
                return res.status(404).json({ error: "Mute not found" });
            }

            await db.delete(chatMutes).where(eq(chatMutes.id, id));

            await adminService.logAdminAction(
                adminId,
                "CHAT_UNMUTE_USER",
                "USER",
                mute.userId,
                {},
                req.ip || "unknown"
            );

            res.json({ success: true });
        } catch (error) {
            logger.error("Error removing mute:", error);
            res.status(500).json({ error: "Failed to remove mute" });
        }
    });

    // ── Bans ──────────────────────────────────────────────────────────────────

    // GET /api/admin/chat/bans
    app.get("/api/admin/chat/bans", async (_req: Request, res: Response) => {
        try {
            const bans = await db.select()
                .from(chatBans)
                .orderBy(desc(chatBans.createdAt));

            const enriched = await Promise.all(bans.map(async (ban) => {
                const [user] = await db.select({ username: users.username, email: users.email })
                    .from(users).where(eq(users.id, ban.userId)).limit(1);
                return { ...ban, username: user?.username || user?.email || ban.userId };
            }));

            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching bans:", error);
            res.status(500).json({ error: "Failed to fetch bans" });
        }
    });

    // POST /api/admin/chat/ban
    app.post("/api/admin/chat/ban", async (req: Request, res: Response) => {
        try {
            const { userId, reason, durationHours } = req.body;
            const adminId = req.user.id;

            if (!userId) {
                return res.status(400).json({ error: "userId is required" });
            }

            const expiresAt = durationHours
                ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
                : null;

            const [ban] = await db.insert(chatBans)
                .values({
                    id: uuidv4(),
                    userId,
                    moderatorId: adminId,
                    reason: reason || null,
                    expiresAt,
                })
                .returning();

            await adminService.logAdminAction(
                adminId,
                "CHAT_BAN_USER",
                "USER",
                userId,
                { reason, durationHours, expiresAt },
                req.ip || "unknown"
            );

            res.status(201).json(ban);
        } catch (error) {
            logger.error("Error banning user from chat:", error);
            res.status(500).json({ error: "Failed to ban user" });
        }
    });

    // DELETE /api/admin/chat/bans/:id
    app.delete("/api/admin/chat/bans/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            const [ban] = await db.select().from(chatBans).where(eq(chatBans.id, id)).limit(1);
            if (!ban) {
                return res.status(404).json({ error: "Ban not found" });
            }

            await db.delete(chatBans).where(eq(chatBans.id, id));

            await adminService.logAdminAction(
                adminId,
                "CHAT_UNBAN_USER",
                "USER",
                ban.userId,
                {},
                req.ip || "unknown"
            );

            res.json({ success: true });
        } catch (error) {
            logger.error("Error removing ban:", error);
            res.status(500).json({ error: "Failed to remove ban" });
        }
    });

    // ── Activity Log ──────────────────────────────────────────────────────────

    // GET /api/admin/chat/activity
    // Returns the 100 most recent chat-related admin actions
    app.get("/api/admin/chat/activity", async (_req: Request, res: Response) => {
        try {
            const CHAT_ACTIONS = [
                "UPDATE_CHAT_CONFIG",
                "DELETE_CHAT_MESSAGE",
                "CHAT_MUTE_USER",
                "CHAT_UNMUTE_USER",
                "CHAT_BAN_USER",
                "CHAT_UNBAN_USER",
                "SLIP_APPROVE",
                "SLIP_FEATURE",
                "SLIP_REJECT",
                "SLIP_DELETE",
                "SLIP_UNFEATURE",
            ];

            const logs = await db.select()
                .from(adminAuditLogs)
                .orderBy(desc(adminAuditLogs.createdAt))
                .limit(200);

            const chatLogs = logs
                .filter((log) => CHAT_ACTIONS.includes(log.action))
                .slice(0, 100);

            // Enrich with admin usernames
            const enriched = await Promise.all(chatLogs.map(async (log) => {
                const [admin] = await db.select({ username: users.username, email: users.email })
                    .from(users).where(eq(users.id, log.adminId)).limit(1);
                return {
                    ...log,
                    adminUsername: admin?.username || admin?.email || log.adminId,
                };
            }));

            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching chat activity:", error);
            res.status(500).json({ error: "Failed to fetch activity log" });
        }
    });
}
