import { Router } from 'express';
import { db } from '../db';
import { userPicks, fighters } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export function registerPicksDistributionRoutes(app: express.Express) {
  const router = Router();

  /**
   * GET /api/picks/distribution/:fightId
   * Returns pick distribution percentages for a specific fight
   */
  router.get('/distribution/:fightId', async (req, res) => {
    try {
      const { fightId } = req.params;

      // Get all picks for this fight
      const picks = await db.select({
        pickedFighterId: userPicks.pickedFighterId,
        userId: userPicks.userId,
      })
        .from(userPicks)
        .where(eq(userPicks.fightId, fightId));

      // Aggregate by fighter
      const aggregation = picks.reduce((acc, pick) => {
        acc[pick.pickedFighterId] = (acc[pick.pickedFighterId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalPicks = Object.values(aggregation).reduce((a: number, b: number) => a + b, 0);

      // Get fighter names
      const fighterIds = Object.keys(aggregation);
      const fightersData = await db.select({
        id: fighters.id,
        lastName: fighters.lastName,
      })
        .from(fighters)
        .where(eq(fighters.id, sql`ANY(${fighterIds})`));

      const fighterMap = new Map(fightersData.map(f => [f.id, f.lastName]));

      // Build response with percentages
      const distribution = Object.entries(aggregation).map(([fighterId, count]: [string, number]) => ({
        fighterId,
        fighterName: fighterMap.get(fighterId) || 'Unknown',
        count,
        percentage: totalPicks > 0 ? ((count / totalPicks) * 100).toFixed(1) : '0',
      })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

      res.json({
        fightId,
        totalPicks,
        distribution,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[API] Error fetching pick distribution:', errorMessage);
      res.status(500).json({ error: 'Failed to fetch pick distribution' });
    }
  });

  app.use('/api/picks', router);
}
