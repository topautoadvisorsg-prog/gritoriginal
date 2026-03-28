import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { runMonthlyProgression, calculateUserProgression } from "../../services/progressionService";
import { logger } from '../../utils/logger';

export function registerAdminProgressionRoutes(app: Express) {
  app.post("/api/admin/progression/calculate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = req.body.monthStart
        ? new Date(req.body.monthStart)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = req.body.monthEnd
        ? new Date(req.body.monthEnd)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const results = await runMonthlyProgression(monthStart, monthEnd);

      const changed = results.filter(r =>
        r.oldStars !== r.newStars || r.oldBadge !== r.newBadge
      );

      res.json({
        totalUsers: results.length,
        changed: changed.length,
        results: results.map(r => ({
          userId: r.userId,
          participation: `${r.participationPct}%`,
          roi: `${r.roi}%`,
          stars: `${r.oldStars} → ${r.newStars}`,
          badge: `${r.oldBadge} → ${r.newBadge}`,
          reason: r.reason,
        })),
      });
    } catch (error) {
      logger.error("Error in progression calculation:", error);
      res.status(500).json({ error: "Failed to calculate progression" });
    }
  });

  app.get("/api/admin/progression/user/:userId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const result = await calculateUserProgression(req.params.userId, monthStart, monthEnd);
      res.json(result);
    } catch (error) {
      logger.error("Error in user progression:", error);
      res.status(500).json({ error: "Failed to calculate user progression" });
    }
  });
}
