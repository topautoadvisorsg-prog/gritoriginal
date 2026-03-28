import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { validate } from '../../middleware/validate';
import { reportUserSchema, muteUserSchema } from '../../schemas';
import { logger } from '../../utils/logger';
import * as moderationService from '../../services/moderationService';

/**
 * Moderation routes — split into user-facing and admin sections.
 * All business logic delegated to moderationService.
 */
export function registerModerationRoutes(app: Express) {

    // ========== USER-FACING BLOCK ENDPOINTS ==========

    app.post("/api/users/:id/block", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const blockerId = req.user.id;
            const blockedId = req.params.id;

            if (blockerId === blockedId) {
                return res.status(400).json({ message: "Cannot block yourself" });
            }

            const block = await moderationService.blockUser(blockerId, blockedId);
            res.status(201).json(block);
        } catch (error: any) {
            if (error.message === 'ALREADY_BLOCKED') {
                return res.status(400).json({ message: "User already blocked" });
            }
            logger.error("Error blocking user:", error);
            res.status(500).json({ message: "Failed to block user" });
        }
    });

    app.delete("/api/users/:id/block", isAuthenticated, async (req: Request, res: Response) => {
        try {
            await moderationService.unblockUser(req.user.id, req.params.id);
            res.json({ success: true });
        } catch (error) {
            logger.error("Error unblocking user:", error);
            res.status(500).json({ message: "Failed to unblock user" });
        }
    });

    app.get("/api/me/blocks", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const blocks = await moderationService.getBlockedUsers(req.user.id);
            res.json(blocks);
        } catch (error) {
            logger.error("Error fetching blocks:", error);
            res.status(500).json({ message: "Failed to fetch blocks" });
        }
    });

    // ========== USER-FACING MUTE ENDPOINTS ==========

    app.post("/api/users/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const muterId = req.user.id;
            const mutedId = req.params.id;
            const { duration } = req.body;

            if (muterId === mutedId) {
                return res.status(400).json({ message: "Cannot mute yourself" });
            }

            const mute = await moderationService.muteUser(muterId, mutedId, duration);
            res.status(201).json(mute);
        } catch (error: any) {
            if (error.message === 'ALREADY_MUTED') {
                return res.status(400).json({ message: "User already muted" });
            }
            logger.error("Error muting user:", error);
            res.status(500).json({ message: "Failed to mute user" });
        }
    });

    app.delete("/api/users/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
        try {
            await moderationService.unmuteUser(req.user.id, req.params.id);
            res.json({ success: true });
        } catch (error) {
            logger.error("Error unmuting user:", error);
            res.status(500).json({ message: "Failed to unmute user" });
        }
    });

    app.get("/api/me/mutes", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const mutes = await moderationService.getMutedUsers(req.user.id);
            res.json(mutes);
        } catch (error) {
            logger.error("Error fetching mutes:", error);
            res.status(500).json({ message: "Failed to fetch mutes" });
        }
    });

    // ========== USER-FACING REPORT ENDPOINT ==========

    app.post("/api/users/:id/report", isAuthenticated, validate(reportUserSchema), async (req: Request, res: Response) => {
        try {
            const reporterId = req.user.id;
            const reportedId = req.params.id;
            const { reason, details } = req.body;

            if (reporterId === reportedId) {
                return res.status(400).json({ message: "Cannot report yourself" });
            }

            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({ message: "Reason is required" });
            }

            const report = await moderationService.reportUser(reporterId, reportedId, reason, details);
            res.status(201).json({ success: true, reportId: report.id });
        } catch (error) {
            logger.error("Error reporting user:", error);
            res.status(500).json({ message: "Failed to report user" });
        }
    });

    // ========== ADMIN REPORT ENDPOINTS ==========

    app.get("/api/admin/reports", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { status = "pending" } = req.query;
            const reports = await moderationService.getReports(status as string);
            res.json(reports);
        } catch (error) {
            logger.error("Error fetching reports:", error);
            res.status(500).json({ message: "Failed to fetch reports" });
        }
    });

    app.patch("/api/admin/reports/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;

            const updated = await moderationService.updateReport(id, status, adminNotes, req.user.id);

            if (!updated) {
                return res.status(404).json({ message: "Report not found" });
            }

            res.json(updated);
        } catch (error) {
            logger.error("Error updating report:", error);
            res.status(500).json({ message: "Failed to update report" });
        }
    });
}
