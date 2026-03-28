import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { db } from '../db';
import { dataPipeline, fighters, events, eventFights, fightHistory, newsArticles } from '../../shared/schema';
import { eq, count, inArray } from 'drizzle-orm';
import { getDataEngineConfig } from '../services/dataEngineService';

const router = Router();

async function requireApiKey(req: Request, res: Response): Promise<boolean> {
  const apiKey = req.headers['x-data-engine-api-key'] as string;
  const expectedKey = await getDataEngineConfig('DATA_ENGINE_API_KEY');
  if (!expectedKey || apiKey !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

/**
 * POST /api/setup/reject-pending-entries
 * Rejects all pipeline entries in 'pending' or 'approved' states.
 */
router.post('/setup/reject-pending-entries', async (req: Request, res: Response) => {
  try {
    if (!(await requireApiKey(req, res))) return;

    const result = await db
      .update(dataPipeline)
      .set({
        status: 'rejected',
        reviewedBy: 'bootstrap',
        reviewedAt: new Date(),
        rejectionReason: 'Rejected by bootstrap: stale or failed pipeline entries',
      })
      .where(inArray(dataPipeline.status, ['pending', 'approved']))
      .returning({ id: dataPipeline.id });

    logger.info(`[Bootstrap] Rejected ${result.length} pipeline entries (pending+approved)`);
    res.json({ rejected: result.length, ids: result.map((r) => r.id) });
  } catch (error) {
    logger.error('[Bootstrap] Error rejecting entries:', error);
    res.status(500).json({ error: 'Failed to reject entries' });
  }
});

/**
 * POST /api/setup/full-reset
 * Wipes all fighter, event, fight history, news, and pipeline data.
 * User accounts, auth sessions, and config are untouched.
 * Protected by DATA_ENGINE_API_KEY.
 */
router.post('/setup/full-reset', async (req: Request, res: Response) => {
  try {
    if (!(await requireApiKey(req, res))) return;

    // Step 1: delete children first (FK-safe order)
    const [efDel, fhDel, naDel, dpDel] = await Promise.all([
      db.delete(eventFights).returning({ id: eventFights.id }),
      db.delete(fightHistory).returning({ id: fightHistory.id }),
      db.delete(newsArticles).returning({ id: newsArticles.id }),
      db.delete(dataPipeline).returning({ id: dataPipeline.id }),
    ]);

    // Step 2: delete parents after children are gone
    const [evDel, ftDel] = await Promise.all([
      db.delete(events).returning({ id: events.id }),
      db.delete(fighters).returning({ id: fighters.id }),
    ]);

    const summary = {
      eventFights: efDel.length,
      fightHistory: fhDel.length,
      events: evDel.length,
      fighters: ftDel.length,
      newsArticles: naDel.length,
      dataPipeline: dpDel.length,
    };

    logger.info('[Bootstrap] Full data reset complete:', summary);
    res.json({ reset: true, deleted: summary });
  } catch (error) {
    logger.error('[Bootstrap] Full reset error:', error);
    res.status(500).json({ error: 'Full reset failed', detail: String(error) });
  }
});

/**
 * GET /api/setup/status
 * Returns counts of fighters, events, and pipeline entries (no auth required).
 */
router.get('/setup/status', async (_req: Request, res: Response) => {
  try {
    const [fighterCount, eventCount, pendingCount] = await Promise.all([
      db.select({ count: count() }).from(fighters),
      db.select({ count: count() }).from(events),
      db.select({ count: count() }).from(dataPipeline).where(eq(dataPipeline.status, 'pending')),
    ]);

    res.json({
      fighters: Number(fighterCount[0]?.count ?? 0),
      events: Number(eventCount[0]?.count ?? 0),
      pendingPipeline: Number(pendingCount[0]?.count ?? 0),
    });
  } catch (error) {
    logger.error('[Bootstrap] Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;
