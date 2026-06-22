import type { Express, Request, Response } from "express";

import { db } from "../../db";
import { leaderboardSnapshots } from "../../../shared/models/auth";
import { eq, desc } from "drizzle-orm";
import { logger } from '../../utils/logger';
import {
    eventIdSchema,
    periodSnapshotTypeSchema,
    snapshotHistoryQuerySchema,
} from '../../../shared/models/ranking';
import { getLatestEventLeaderboardSnapshot } from '../../services/leaderboardSnapshotService';

export function registerSnapshotRoutes(app: Express) {

    app.get("/api/leaderboard/history", async (req: Request, res: Response) => {
        try {
            const parsed = snapshotHistoryQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Invalid snapshot history query', details: parsed.error.issues });
            }
            const { type, limit } = parsed.data;

            let snapshots;
            if (type) {
                snapshots = await db.select()
                    .from(leaderboardSnapshots)
                    .where(eq(leaderboardSnapshots.snapshotType, type))
                    .orderBy(desc(leaderboardSnapshots.snapshotDate))
                    .limit(limit);
            } else {
                snapshots = await db.select()
                    .from(leaderboardSnapshots)
                    .orderBy(desc(leaderboardSnapshots.snapshotDate))
                    .limit(limit);
            }

            res.json(snapshots);
        } catch (error) {
            logger.error("Error fetching leaderboard history:", error);
            res.status(500).json({ message: "Failed to fetch history" });
        }
    });

    app.get("/api/leaderboard/event/:eventId", async (req: Request, res: Response) => {
        try {
            const parsedEventId = eventIdSchema.safeParse(req.params.eventId);
            if (!parsedEventId.success) {
                return res.status(400).json({ message: 'Invalid event ID' });
            }
            const eventId = parsedEventId.data;

            const snapshot = await getLatestEventLeaderboardSnapshot(eventId);

            if (!snapshot) {
                return res.status(404).json({ message: "No snapshot found for this event" });
            }

            res.json(snapshot);
        } catch (error) {
            logger.error("Error fetching event snapshot:", error);
            res.status(500).json({ message: "Failed to fetch event snapshot" });
        }
    });

    app.get("/api/leaderboard/latest/:type", async (req: Request, res: Response) => {
        const parsedType = periodSnapshotTypeSchema.safeParse(req.params.type);
        if (!parsedType.success) {
            return res.status(400).json({ message: 'Snapshot type must be monthly or yearly' });
        }
        const type = parsedType.data;
        try {
            const snapshots = await db.select()
                .from(leaderboardSnapshots)
                .where(eq(leaderboardSnapshots.snapshotType, (type as string)))
                .orderBy(
                    desc(leaderboardSnapshots.snapshotDate),
                    desc(leaderboardSnapshots.createdAt),
                    desc(leaderboardSnapshots.id),
                )
                .limit(1);

            if (snapshots.length === 0) {
                return res.status(404).json({ message: `No ${type} snapshot found` });
            }

            res.json(snapshots[0]);
        } catch (error) {
            logger.error(`Error fetching latest ${type} snapshot:`, error);
            res.status(500).json({ message: "Failed to fetch snapshot" });
        }
    });
}
