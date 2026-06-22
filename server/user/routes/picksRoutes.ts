import type { Express, Request } from "express";

import { isAuthenticated, isAdmin } from '../../auth/guards';
import { db } from "../../db";
import { userPicks, events, eventFights, type CreatePickRequest } from "../../../shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { createPickSchema } from '../../schemas';
import { verifyFightState } from '../../middleware/fightState';
import { config } from '../../config/env';
import { type User } from "../../../shared/models/auth";
import { pickAggregator } from '../../services/pickAggregationService';
import { eventCache } from '../../utils/eventCache';
import { parseFightLockTime } from '../../utils/fightLockTime';
import { deletePick, PickPolicyError, savePick } from '../../services/pickService';

export function registerPicksRoutes(app: Express): void {
  // Get user's picks for a specific event
  app.get("/api/picks/event/:eventId", isAuthenticated, async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const eventId = req.params.eventId as string;

      // Get all fights for the event
      const fights = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.eventId, eventId));

      const fightIds = fights.map(f => f.id);

      // Get user's picks for these fights
      if (fightIds.length === 0) {
        return res.json([]);
      }

      const picks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds)
          )
        );

      res.json(picks);
    } catch (error) {
      logger.error("Error fetching picks:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });

  // Get user's pick for a specific fight
  app.get("/api/picks/fight/:fightId", isAuthenticated, async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const fightId = req.params.fightId as string;

      const [pick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      res.json(pick || null);
    } catch (error) {
      logger.error("Error fetching pick:", error);
      res.status(500).json({ message: "Failed to fetch pick" });
    }
  });

  // Get real-time qualification status for an event (minimum moneyline picks required)
  app.get("/api/picks/event/:eventId/qualification", isAuthenticated, async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const eventId = req.params.eventId as string;

      // 1. Get all fights to calculate the target
      const fights = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.eventId, eventId))
        .orderBy(eventFights.boutOrder);

      if (fights.length === 0) {
        return res.json({
          currentPicks: 0,
          requiredPicks: 0,
          isQualified: false,
          flagBudget: 0,
          flagsUsed: 0,
          totalFights: 0,
        });
      }

      const fightIds = fights.map(f => f.id);
      const totalFights = fights.length;
      const requiredPicks = config.getRequiredPicks(totalFights);

      // Flag budget = picks the user is allowed to NOT make competitively (yellow/red).
      // Equals total fights minus minimum competitive picks required for the card.
      const flagBudget = totalFights - requiredPicks;

      // 2. Get user's picks for this event
      const picks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds)
          )
        );

      // 3. Count competitive picks (no-flag + green-flag + yellow-flag count toward qualification).
      // Red flag picks excluded from ranking entirely. See blueprint §5.
      const currentPicks = picks.filter(p =>
        p.pickedFighterId != null &&
        p.confidenceFlag !== 'red'
      ).length;

      // 4. Count yellow/red flag picks for budget enforcement display.
      // Computed fresh from picks rather than the cached users.yellowRedFlagsUsed counter
      // (counter is set lazily on first pick; this endpoint is read-only and must show truth).
      const flagsUsed = picks.filter(p =>
        p.confidenceFlag === 'yellow' || p.confidenceFlag === 'red'
      ).length;

      res.json({
        currentPicks,
        requiredPicks,
        isQualified: currentPicks >= requiredPicks,
        flagBudget,
        flagsUsed,
        totalFights,
      });
    } catch (error) {
      logger.error("Error fetching event qualification status:", error);
      res.status(500).json({ message: "Failed to fetch qualification status" });
    }
  });

  // Create or update a pick
  app.post("/api/picks", isAuthenticated, validate(createPickSchema), verifyFightState(['OPEN']), async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const pickData = req.body as CreatePickRequest;

      // Check if fight exists and get event date
      const [fight] = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.id, pickData.fightId));

      if (!fight) {
        return res.status(404).json({ message: "Fight not found" });
      }

      // Get event to check if fight has started
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, fight.eventId));

      if (event) {
        // We already checked event.status === 'OPEN' in verifyFightState middleware
        const now = new Date();

        // Event-level lockTime gate: if set by the data engine, this is the primary pick deadline
        if (event.lockTime && !isAdmin(req) && now >= new Date(event.lockTime)) {
          return res.status(423).json({
            message: "Picks are locked. The pick deadline for this event has passed."
          });
        }

        // Per-fight time-based lock: lock 10 minutes before estimated fight start
        if (fight.scheduledTime && !isAdmin(req)) {
          const fightLockTime = parseFightLockTime(event.date, fight.scheduledTime, config.PICK_LOCK_MINUTES_BEFORE_FIGHT);
          if (fightLockTime && now >= fightLockTime) {
            return res.status(400).json({
              message: `Picks for this fight are locked. Fight starts at ${fight.scheduledTime}.`
            });
          }
        }

        // Hard time-based lock (>= official event start time)
        const eventDate = new Date(event.date);
        if (now >= eventDate && !isAdmin(req)) {
          return res.status(400).json({ message: "Picks are locked. The event has officially started." });
        }

      }
      const { savedPick: result, previousFighterId } = await savePick({
        userId,
        pick: pickData,
        fight,
        bypassRestrictions: isAdmin(req),
      });

      // 1. Trigger background pick aggregation for socket batching (10x reduction in emissions)
      try {
        await pickAggregator.trackPick(
          fight.eventId,
          pickData.fightId,
          fight.fighter1Id as string,
          fight.fighter2Id as string,
          pickData.pickedFighterId,
          previousFighterId
        );
      } catch (err) {
        logger.error('Failed to track pick aggregation', err);
      }

      // 2. Invalidate Smart Cache
      eventCache.invalidate(fight.eventId);

      logger.metric('picks_success', 1, { userId, fightId: pickData.fightId });
      res.json(result);
    } catch (error) {
      if (error instanceof PickPolicyError) {
        return res.status(error.status).json({ message: error.message });
      }
      logger.metric('picks_fail', 1, { userId: req.user?.id ?? 'unknown' });
      logger.error("Error saving pick:", error);
      res.status(500).json({ message: "Failed to save pick" });
    }
  });

  // Delete a pick
  app.delete("/api/picks/:fightId", isAuthenticated, verifyFightState(['OPEN']), async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;
      const fightId = req.params.fightId as string;

      // Check if fight exists and get event date
      const [fight] = await db
        .select()
        .from(eventFights)
        .where(eq(eventFights.id, fightId));

      if (fight) {
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, fight.eventId));

        if (event) {
          const now = new Date();

          // Event-level lockTime gate
          if (event.lockTime && now >= new Date(event.lockTime)) {
            return res.status(423).json({
              message: "Picks are locked. The pick deadline for this event has passed."
            });
          }

          // Per-fight time-based lock
          if (fight.scheduledTime) {
            const fightLockTime = parseFightLockTime(event.date, fight.scheduledTime, 10);
            if (fightLockTime && now >= fightLockTime) {
              return res.status(400).json({
                message: `Picks for this fight are locked. Fight starts at ${fight.scheduledTime}.`
              });
            }
          }

          // Hard time-based lock (>= official event start time)
          const eventDate = new Date(event.date);
          if (now >= eventDate) {
            return res.status(400).json({ message: "Picks are locked. The event has officially started." });
          }
        }
      }

      if (!fight) return res.status(404).json({ message: "Fight not found" });
      const result = await deletePick({ userId, fight });

      if (result.deleted) {
        try {
          await pickAggregator.trackPick(
            fight.eventId,
            fight.id,
            fight.fighter1Id as string,
            fight.fighter2Id as string,
            '',
            result.previousFighterId,
          );
        } catch (err) {
          logger.error('Failed to track pick deletion aggregation', err);
        }
        eventCache.invalidate(fight.eventId);
      }

      res.json({ success: true, deleted: result.deleted });
    } catch (error) {
      if (error instanceof PickPolicyError) {
        return res.status(error.status).json({ message: error.message });
      }
      logger.error("Error deleting pick:", error);
      res.status(500).json({ message: "Failed to delete pick" });
    }
  });

  // Get all picks for current user
  app.get("/api/picks", isAuthenticated, async (req: Request, res) => {
    try {
      const user = req.user as User;
      const userId = user.id;

      const picks = await db
        .select()
        .from(userPicks)
        .where(eq(userPicks.userId, userId));

      res.json(picks);
    } catch (error) {
      logger.error("Error fetching all picks:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });
}
