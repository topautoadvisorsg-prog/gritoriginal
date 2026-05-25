import type { Express } from 'express';
import { Router } from 'express';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';

import { isAuthenticated } from '../../auth/guards';
import { db } from '../../db';
import { buildActivityFeedItems, getPeerMemberIds, uniqueValues } from '../../services/activityFeedService';
import { eventFights, events, fighters, groupMembers, userPicks } from '../../../shared/schema';
import { logger } from '../../utils/logger';

export function registerActivityFeedRoutes(app: Express) {
  const router = Router();

  /**
   * GET /api/activity/feed
   * Returns recent activity from user's group members.
   */
  router.get('/feed', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;

      const memberships = await db.select({
        groupId: groupMembers.groupId,
      })
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId));

      if (memberships.length === 0) {
        return res.json([]);
      }

      const groupIds = uniqueValues(memberships.map(m => m.groupId));
      const members = await db.select({
        userId: groupMembers.userId,
      })
        .from(groupMembers)
        .where(and(
          inArray(groupMembers.groupId, groupIds),
          ne(groupMembers.userId, userId),
        ));

      const memberIds = getPeerMemberIds(members, userId);

      if (memberIds.length === 0) {
        return res.json([]);
      }

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

      const fighterIds = uniqueValues(picks.map(pick => pick.pickedFighterId));
      const fightIds = uniqueValues(picks.map(pick => pick.fightId));

      const fightersData = fighterIds.length > 0
        ? await db.select({
          id: fighters.id,
          lastName: fighters.lastName,
          firstName: fighters.firstName,
        })
          .from(fighters)
          .where(inArray(fighters.id, fighterIds))
        : [];

      const fightsData = fightIds.length > 0
        ? await db.select({
          id: eventFights.id,
          eventId: eventFights.eventId,
        })
          .from(eventFights)
          .where(inArray(eventFights.id, fightIds))
        : [];

      const eventIds = uniqueValues(fightsData.map(fight => fight.eventId).filter((eventId): eventId is string => Boolean(eventId)));
      const eventsData = eventIds.length > 0
        ? await db.select({
          id: events.id,
          name: events.name,
        })
          .from(events)
          .where(inArray(events.id, eventIds))
        : [];

      const enrichedPicks = buildActivityFeedItems(
        picks,
        new Map(fightersData.map(fighter => [fighter.id, fighter])),
        new Map(fightsData.map(fight => [fight.id, fight])),
        new Map(eventsData.map(event => [event.id, event])),
      );

      res.json(enrichedPicks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[API] Error fetching activity feed:', errorMessage);
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  });

  app.use('/api/activity', router);
}
