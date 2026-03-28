import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/guards';
import { db } from "../../db";
import { raffleTickets, raffleDraws } from "../../../shared/schema";
import { users } from "../../../shared/models/auth";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from '../../utils/logger';

export function registerRaffleRoutes(app: Express) {

    app.get("/api/raffle/current", async (_req, res: Response) => {
        try {
            const [totalResult] = await db.select({
                total: sql<number>`COALESCE(SUM(${raffleTickets.quantity}), 0)`,
            }).from(raffleTickets);

            const [lastDraw] = await db.select()
                .from(raffleDraws)
                .orderBy(desc(raffleDraws.drawnAt))
                .limit(1);

            let lastWinner = null;
            if (lastDraw) {
                const [winner] = await db.select({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                }).from(users).where(eq(users.id, lastDraw.winnerId));

                lastWinner = {
                    ...lastDraw,
                    winner,
                };
            }

            res.json({
                totalTickets: totalResult?.total || 0,
                poolDescription: "GRIT Raffle",
                lastWinner,
            });
        } catch (error) {
            logger.error("Error fetching raffle info:", error);
            res.status(500).json({ error: "Failed to fetch raffle info" });
        }
    });

    app.get("/api/raffle/my-tickets", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;

            const [result] = await db.select({
                total: sql<number>`COALESCE(SUM(${raffleTickets.quantity}), 0)`,
            })
                .from(raffleTickets)
                .where(eq(raffleTickets.userId, userId));

            const tickets = await db.select()
                .from(raffleTickets)
                .where(eq(raffleTickets.userId, userId))
                .orderBy(desc(raffleTickets.createdAt));

            res.json({
                totalTickets: result?.total || 0,
                allocations: tickets,
            });
        } catch (error) {
            logger.error("Error fetching user tickets:", error);
            res.status(500).json({ error: "Failed to fetch tickets" });
        }
    });

    app.get("/api/raffle/history", async (_req, res: Response) => {
        try {
            const draws = await db.select()
                .from(raffleDraws)
                .orderBy(desc(raffleDraws.drawnAt))
                .limit(20);

            res.json(draws);
        } catch (error) {
            logger.error("Error fetching draw history:", error);
            res.status(500).json({ error: "Failed to fetch draw history" });
        }
    });
}
