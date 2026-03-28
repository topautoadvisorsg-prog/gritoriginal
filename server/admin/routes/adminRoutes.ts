import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { validate } from '../../middleware/validate';
import { changeRoleSchema } from '../../schemas';
import { logger } from '../../utils/logger';
import * as adminService from '../../services/adminService';

/**
 * Core admin routes — audit logs, user management, system settings.
 * All business logic delegated to adminService.
 * Admin access is enforced by requireAdmin middleware.
 */
export function registerAdminRoutes(app: Express): void {

    // Get Audit Logs
    app.get("/api/admin/audit-logs", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const enrichedLogs = await adminService.getAuditLogs();
            res.json(enrichedLogs);
        } catch (error) {
            logger.error("Error fetching audit logs:", error);
            res.status(500).json({ message: "Failed to fetch logs" });
        }
    });

    // Ban/Unban User
    app.post("/api/admin/users/:id/ban", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { ban } = req.body;
            const reason = req.body.reason || "No reason provided";

            const updatedUser = await adminService.banUser(id, ban);
            await adminService.logAdminAction(
                req.user.id,
                ban ? "BAN_USER" : "UNBAN_USER",
                "USER",
                id,
                { reason },
                req.ip || req.socket.remoteAddress || 'unknown'
            );

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error banning user:", error);
            res.status(500).json({ message: "Failed to update ban status" });
        }
    });

    // Change Role
    app.post("/api/admin/users/:id/role", isAuthenticated, requireAdmin, validate(changeRoleSchema), async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            const { updatedUser, oldRole } = await adminService.changeUserRole(id, role);
            await adminService.logAdminAction(
                req.user.id,
                "CHANGE_ROLE",
                "USER",
                id,
                { oldRole, newRole: role },
                req.ip || req.socket.remoteAddress || 'unknown'
            );

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error changing role:", error);
            res.status(500).json({ message: "Failed to update role" });
        }
    });

    // Toggle AI Access
    app.post("/api/admin/users/:id/ai-access", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { enabled } = req.body;

            const updatedUser = await adminService.toggleAiAccess(id, enabled);
            await adminService.logAdminAction(
                req.user.id,
                "UPDATE_AI_ACCESS",
                "USER",
                id,
                { enabled },
                req.ip || req.socket.remoteAddress || 'unknown'
            );

            res.json(updatedUser);
        } catch (error) {
            logger.error("Error updating AI access:", error);
            res.status(500).json({ message: "Failed to update AI access" });
        }
    });

    // System Settings
    app.get("/api/admin/settings", isAuthenticated, requireAdmin, async (_req: Request, res: Response) => {
        try {
            const settings = await adminService.getSystemSettings();
            res.json(settings);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch settings" });
        }
    });

    app.put("/api/admin/settings", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { key, value, description } = req.body;

            await adminService.upsertSystemSetting(key, value, description, req.user.id);
            await adminService.logAdminAction(
                req.user.id,
                "UPDATE_SYSTEM_SETTING",
                "SYSTEM",
                key,
                { value },
                req.ip || req.socket.remoteAddress || 'unknown'
            );

            res.json({ success: true });
        } catch (error) {
            logger.error("Error updating system settings:", error);
            res.status(500).json({ message: "Failed to update settings" });
        }
    });

    // Data Export Routes
    app.get("/api/admin/export/fighters", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { exportService } = await import('../../services/exportService');
            const csv = await exportService.exportFightersCSV();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=fighters.csv');
            res.send(csv);

            await adminService.logAdminAction(
                (req.user as any).id,
                "EXPORT_DATA",
                "FIGHTERS",
                "all",
                {},
                (req.ip || 'unknown') as string
            );
        } catch (error) {
            logger.error("Error exporting fighters:", error);
            res.status(500).json({ message: "Failed to export data" });
        }
    });

    app.get("/api/admin/export/fights", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { exportService } = await import('../../services/exportService');
            const csv = await exportService.exportFightHistoryCSV();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=fights.csv');
            res.send(csv);

            await adminService.logAdminAction(
                (req.user as any).id,
                "EXPORT_DATA",
                "FIGHT_HISTORY",
                "all",
                {},
                (req.ip || 'unknown') as string
            );
        } catch (error) {
            logger.error("Error exporting fight history:", error);
            res.status(500).json({ message: "Failed to export data" });
        }
    });
}
