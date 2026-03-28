import { Router } from 'express';
import { db } from '../db';
import { userPicks, groupMembers, fighters, eventFights, events } from '../../shared/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';

export function registerActivityFeedRoutes(app: express.Express) {
  const router = Router();

  /**
   * GET /api/activity/feed
   * Returns recent activity from user's group members
   */
  router.get('/feed', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all groups user belongs to
      const memberships = await db.select({
        groupId: groupMembers.groupId,
      })
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId));

      if (memberships.length === 0) {
        return res.json([]);
      }

      const groupIds = memberships.map(m => m.groupId);

      // Get all members from those groups (excluding current user)
      const members = await db.select({
        userId: groupMembers.userId,
      })
        .from(groupMembers)
        .where(inArray(groupMembers.groupId, groupIds))
        .and(sql`${groupMembers.userId} != ${userId}`);

      const memberIds = members.map(m => m.userId);

      if (memberIds.length === 0) {
        return res.json([]);
      }

      // Get recent picks from group members
      const picks = await db.select({
        id: userPicks.id,
        userId: userPicks.userId,
        fightId: userPicks.fightId,
        pickedFighterId: userPicks.pickedFighterId,
        pickedMethod: userPicks.pickedMethod,
        pickedRound: userPicks.pickedRound,
        units: userPicks.units,
        createdAt: userPicks.createdAt,
      })
        .from(userPicks)
        .where(inArray(userPicks.userId, memberIds))
        .orderBy(desc(userPicks.createdAt))
        .limit(20);

      // Enrich with fighter and event info
      const enrichedPicks = await Promise.all(
        picks.map(async (pick) => {
          const fighter = await db.select({
            id: fighters.id,
            lastName: fighters.lastName,
            firstName: fighters.firstName,
          })
            .from(fighters)
            .where(eq(fighters.id, pick.pickedFighterId))
            .limit(1);

          const fight = await db.select({
            id: eventFights.id,
            eventId: eventFights.eventId,
          })
            .from(eventFights)
            .where(eq(eventFights.id, pick.fightId))
            .limit(1);

          const event = fight.length > 0 ? await db.select({
            id: events.id,
            name: events.name,
          })
            .from(events)
            .where(eq(events.id, fight[0].eventId))
            .limit(1) : [];

          return {
            id: pick.id,
            userId: pick.userId,
            fightId: pick.fightId,
            pickedFighterName: fighter.length > 0 
              ? `${fighter[0].firstName} "${fighter[0].lastName}"` 
              : 'Unknown Fighter',
            pickedMethod: pick.pickedMethod,
            pickedRound: pick.pickedRound,
            units: pick.units,
            eventName: event.length > 0 ? event[0].name : 'Unknown Event',
            createdAt: pick.createdAt,
          };
        })
      );

      res.json(enrichedPicks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[API] Error fetching activity feed:', errorMessage);
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  });
}
