import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { createLeaderboardSnapshot } from "../../services/leaderboardService";
import { logger } from '../../utils/logger';
import { automaticSnapshotCreationSchema, snapshotCreationSchema } from '../../../shared/models/ranking';

export function registerAdminSnapshotRoutes(app: Express) {

  /**
   * POST /api/admin/leaderboard/snapshot
   * Manual snapshot with explicit date range (optional).
   * If startDate/endDate are omitted for monthly/yearly, auto-calculates the previous period.
   */
  app.post("/api/admin/leaderboard/snapshot", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = snapshotCreationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid snapshot request', details: parsed.error.issues });
      }
      const { type, eventId, startDate, endDate } = parsed.data;

      const snapshot = await createLeaderboardSnapshot(
        type,
        eventId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.status(201).json(snapshot);
    } catch (error) {
      logger.error("Error creating snapshot:", error);
      res.status(500).json({ message: "Failed to create snapshot" });
    }
  });

  /**
   * POST /api/admin/leaderboard/snapshot/auto
   * Automatic period detection — no dates needed.
   * monthly → previous calendar month
   * yearly  → previous calendar year
   * event   → requires eventId in body
   *
   * Designed for cron jobs / scheduled triggers.
   */
  app.post("/api/admin/leaderboard/snapshot/auto", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = automaticSnapshotCreationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid automatic snapshot request', details: parsed.error.issues });
      }
      const { type, eventId } = parsed.data;

      logger.info(`[AdminSnapshot] Auto-generating ${type} snapshot`);

      // No startDate/endDate passed — leaderboardService auto-calculates the period
      const snapshot = await createLeaderboardSnapshot(type, eventId);

      if (!snapshot) {
        return res.status(422).json({ message: "Snapshot could not be generated. No qualifying picks found for this period." });
      }

      res.status(201).json(snapshot);
    } catch (error) {
      logger.error("Error creating auto snapshot:", error);
      res.status(500).json({ message: "Failed to create auto snapshot" });
    }
  });
}
