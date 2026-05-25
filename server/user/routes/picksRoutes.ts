import type { Express, Request } from "express";

import { isAuthenticated, isAdmin } from '../../auth/guards';
import { db } from "../../db";
import { userPicks, insertUserPickSchema, events, eventFights, users } from "../../../shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { createPickSchema } from '../../schemas';
import { verifyFightState } from '../../middleware/fightState';
import { config } from '../../config/env';
import { type User } from "../../../shared/models/auth";
import { pickAggregator } from '../../services/pickAggregationService';
import { eventCache } from '../../utils/eventCache';
import { parseFightLockTime } from '../../utils/fightLockTime';

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
      const validationResult = insertUserPickSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid data", errors: validationResult.error.issues });
      }

      const pickData = validationResult.data;

      // Ensure a fighter was actually selected (prevents empty ML picks with only method/round)
      if (!pickData.pickedFighterId) {
        return res.status(400).json({ message: "You must pick a fighter first." });
      }

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

        // Confidence Flag Budget Enforcement
        const confidenceFlag = pickData.confidenceFlag || 'none';
        
        // Only validate flag budget for non-admin users
        if (!isAdmin(req)) {
          // Get user's current flag tracking for this event
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));

          // If user's currentEventId doesn't match this event, calculate and set the flag budget
          if (user.currentEventId !== fight.eventId) {
            // Calculate total fights in this event
            const totalFights = await db
              .select({ count: sql<number>`count(*)` })
              .from(eventFights)
              .where(eq(eventFights.eventId, fight.eventId));

            const totalFightsCount = Number(totalFights[0]?.count || 0);
            
            // Calculate required competitive picks using the fixed lookup table
            const requiredPicks = config.getRequiredPicks(totalFightsCount);
            const flagBudget = totalFightsCount - requiredPicks;

            // Update user's flag tracking for this new event
            await db
              .update(users)
              .set({
                currentEventId: fight.eventId,
                flagBudget: flagBudget,
                yellowRedFlagsUsed: 0,
                lastFlagResetAt: new Date(),
              })
              .where(eq(users.id, userId));

            user.flagBudget = flagBudget;
            user.yellowRedFlagsUsed = 0;
          }

          // Enforce flag budget if user is trying to use yellow or red flag
          if (confidenceFlag === 'yellow' || confidenceFlag === 'red') {
            if (user.yellowRedFlagsUsed >= user.flagBudget) {
              return res.status(400).json({
                message: `Flag budget exhausted. You can only use ${user.flagBudget} yellow/red flags for this event. Use green flag or standard pick instead.`
              });
            }
          }
        }
      }

      // Check for existing pick
      const [existingPick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, pickData.fightId)
          )
        );

      let result;
      if (existingPick) {
        // Check if pick is locked (admin can bypass)
        if (existingPick.isLocked && !isAdmin(req)) {
          return res.status(400).json({ message: "Pick is locked and cannot be modified" });
        }

        // If confidenceFlag changed from none/green to yellow/red, increment flag usage
        // If changed from yellow/red to none/green, decrement flag usage
        const oldFlag = existingPick.confidenceFlag || 'none';
        const newFlag = pickData.confidenceFlag || 'none';
        
        // UPDATE LOCKED ODDS (if odds changed since initial pick)
        const fightOdds = fight.odds as { fighter1Odds?: string; fighter2Odds?: string } | null;
        const newLockedOdds = pickData.pickedFighterId === fight.fighter1Id
          ? fightOdds?.fighter1Odds
          : fightOdds?.fighter2Odds;
        
        let flagUpdate = {};
        if ((oldFlag === 'none' || oldFlag === 'green') && (newFlag === 'yellow' || newFlag === 'red')) {
          // Using a yellow/red flag now - increment counter
          flagUpdate = { yellowRedFlagsUsed: sql`yellow_red_flags_used + 1` };
        } else if ((oldFlag === 'yellow' || oldFlag === 'red') && (newFlag === 'none' || newFlag === 'green')) {
          // No longer using yellow/red flag - decrement counter
          flagUpdate = { yellowRedFlagsUsed: sql`yellow_red_flags_used - 1` };
        }

        [result] = await db
          .update(userPicks)
          .set({
            pickedFighterId: pickData.pickedFighterId,
            pickedMethod: pickData.pickedMethod,
            pickedRound: pickData.pickedRound,
            units: pickData.units || 1,
            confidenceFlag: newFlag,
            lockedOdds: newLockedOdds || null, // Update locked odds
            updatedAt: new Date(),
            ...flagUpdate,
          })
          .where(eq(userPicks.id, existingPick.id))
          .returning();
      } else {
        // Create new pick - increment flag counter if yellow/red
        const flagIncrement = (pickData.confidenceFlag === 'yellow' || pickData.confidenceFlag === 'red') ? 1 : 0;
        
        // LOCK ODDS AT SUBMISSION TIME
        // Capture the odds for the picked fighter at the moment of submission
        const fightOdds = fight.odds as { fighter1Odds?: string; fighter2Odds?: string } | null;
        const lockedOdds = pickData.pickedFighterId === fight.fighter1Id
          ? fightOdds?.fighter1Odds
          : fightOdds?.fighter2Odds;
        
        [result] = await db
          .insert(userPicks)
          .values({
            ...pickData,
            confidenceFlag: pickData.confidenceFlag || 'none',
            lockedOdds: lockedOdds || null, // Lock the odds at submission time
          })
          .returning();
        
        // Update user's flag usage if this pick used a yellow/red flag
        if (flagIncrement > 0) {
          await db
            .update(users)
            .set({
              yellowRedFlagsUsed: sql`yellow_red_flags_used + ${flagIncrement}`,
            })
            .where(eq(users.id, userId));
        }
      }

      // 1. Trigger background pick aggregation for socket batching (10x reduction in emissions)
      try {
        await pickAggregator.trackPick(
          fight.eventId,
          pickData.fightId,
          fight.fighter1Id as string,
          fight.fighter2Id as string,
          pickData.pickedFighterId,
          existingPick?.pickedFighterId
        );
      } catch (err) {
        logger.error('Failed to track pick aggregation', err);
      }

      // 2. Invalidate Smart Cache
      eventCache.invalidate(fight.eventId);

      logger.metric('picks_success', 1, { userId, fightId: pickData.fightId });
      res.json(result);
    } catch (error) {
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

      const [pick] = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      if (pick?.isLocked) {
        return res.status(400).json({ message: "Pick is locked and cannot be deleted" });
      }

      await db
        .delete(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.fightId, fightId)
          )
        );

      res.json({ success: true });
    } catch (error) {
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
