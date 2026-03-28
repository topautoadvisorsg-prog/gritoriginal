import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { logger } from '../../utils/logger';
import { db } from "../../db";
import { rafflePool, raffleDraws, events, userKeys } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import * as raffleService from '../../services/raffleService';

/**
 * Admin raffle management routes for the new subscription-based raffle system.
 */
export function registerAdminRaffleRoutes(app: Express) {

  // Get raffle pool details for an event
  app.get("/api/admin/raffle/pool/:eventId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const poolEntries = await db.select({
        id: rafflePool.id,
        userId: rafflePool.userId,
        contributionAmount: rafflePool.contributionAmount,
        createdAt: rafflePool.createdAt,
      })
      .from(rafflePool)
      .where(eq(rafflePool.eventId, eventId));

      const totalAmount = poolEntries.reduce((sum, entry) => sum + Number(entry.contributionAmount), 0);

      res.json({
        eventId,
        totalEntries: poolEntries.length,
        totalAmount: (totalAmount / 100).toFixed(2), // Convert cents to dollars
        entries: poolEntries,
      });
    } catch (error) {
      logger.error("Error fetching raffle pool:", error);
      res.status(500).json({ error: "Failed to fetch raffle pool" });
    }
  });

  // Get raffle draw result for an event
  app.get("/api/admin/raffle/draw/:eventId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const [draw] = await db.select({
        id: raffleDraws.id,
        winnerId: raffleDraws.winnerId,
        poolTotal: raffleDraws.poolTotal,
        totalTickets: raffleDraws.totalTickets,
        notified: raffleDraws.notified,
        drawnAt: raffleDraws.drawnAt,
      })
      .from(raffleDraws)
      .where(eq(raffleDraws.eventId, eventId));

      if (!draw) {
        return res.status(404).json({ message: "No raffle draw found for this event" });
      }

      res.json({
        ...draw,
        poolTotal: (Number(draw.poolTotal) / 100).toFixed(2),
      });
    } catch (error) {
      logger.error("Error fetching raffle draw:", error);
      res.status(500).json({ error: "Failed to fetch raffle draw" });
    }
  });

  // Manually trigger raffle draw (if not already done)
  app.post("/api/admin/raffle/draw/:eventId", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      // Check if draw already exists
      const [existingDraw] = await db.select()
        .from(raffleDraws)
        .where(eq(raffleDraws.eventId, eventId));

      if (existingDraw) {
        return res.status(400).json({ 
          message: "Raffle draw already completed for this event",
          existingDraw 
        });
      }

      const winner = await raffleService.drawRaffleWinner(eventId);

      if (!winner) {
        return res.status(400).json({ message: "Failed to draw winner - no entries in pool" });
      }

      res.json({
        message: "Raffle winner drawn successfully",
        winnerId: winner.winnerId,
        poolTotal: (winner.poolTotal / 100).toFixed(2),
        totalTickets: winner.totalTickets,
      });
    } catch (error) {
      logger.error("Error manually triggering raffle draw:", error);
      res.status(500).json({ error: "Failed to trigger raffle draw" });
    }
  });

  // Mark raffle draw as notified
  app.post("/api/admin/raffle/draw/:drawId/notify", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { drawId } = req.params;

      await raffleService.markRaffleNotified(drawId);

      res.json({ message: "Raffle draw marked as notified" });
    } catch (error) {
      logger.error("Error marking raffle as notified:", error);
      res.status(500).json({ error: "Failed to mark raffle as notified" });
    }
  });

  // Set prize amount for a key (clean sweep bonus)
  app.post("/api/admin/raffle/key/:keyId/prize", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { keyId } = req.params;
      const { prizeAmount } = req.body; // In cents

      if (!prizeAmount || prizeAmount <= 0) {
        return res.status(400).json({ error: "Valid prize amount required" });
      }

      const [updatedKey] = await db.update(userKeys)
        .set({ 
          prizeClaimed: false,
          prizeAmount,
          adminNotifiedAt: null,
        })
        .where(eq(userKeys.id, keyId))
        .returning();

      if (!updatedKey) {
        return res.status(404).json({ error: "Key not found" });
      }

      res.json(updatedKey);
    } catch (error) {
      logger.error("Error setting key prize amount:", error);
      res.status(500).json({ error: "Failed to set prize amount" });
    }
  });

  // Get all raffle draws (for admin dashboard)
  app.get("/api/admin/raffle/draws", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const draws = await db.select({
        id: raffleDraws.id,
        eventId: raffleDraws.eventId,
        winnerId: raffleDraws.winnerId,
        poolTotal: raffleDraws.poolTotal,
        totalTickets: raffleDraws.totalTickets,
        notified: raffleDraws.notified,
        drawnAt: raffleDraws.drawnAt,
      })
      .from(raffleDraws)
      .orderBy(desc(raffleDraws.drawnAt))
      .limit(50);

      res.json(draws.map(d => ({
        ...d,
        poolTotal: (Number(d.poolTotal) / 100).toFixed(2),
      })));
    } catch (error) {
      logger.error("Error fetching raffle draws:", error);
      res.status(500).json({ error: "Failed to fetch raffle draws" });
    }
  });
}
