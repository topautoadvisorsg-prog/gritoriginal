import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { getBoss } from '../../services/jobService';
import { logger } from '../../utils/logger';
import { requireAdmin } from '../../auth/guards';

const router = Router();

// Protect all routes with admin guard
router.use(requireAdmin);

/**
 * GET /api/admin/jobs/failed
 * Fetches all failed pg-boss background jobs directly from the pgboss schema.
 */
router.get('/failed', async (req: Request, res: Response) => {
  try {
    const query = sql`
      SELECT 
        id, name, data, state, retrylimit as "retryLimit", 
        retrycount as "retryCount", createdon as "createdOn", 
        completedon as "completedOn"
      FROM pgboss.job 
      WHERE state = 'failed' 
      ORDER BY createdon DESC 
      LIMIT 100
    `;
    const result = await db.execute(query);
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch dead-letter jobs:', error);
    res.status(500).json({ error: 'Failed to fetch failed jobs' });
  }
});

/**
 * POST /api/admin/jobs/:id/retry
 * Retries a failed job by looking up its payload and re-enqueueing it.
 */
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const boss = getBoss();
    if (!boss) {
      return res.status(503).json({ error: 'Job service not initialized' });
    }

    // Lookup original job
    const pullQuery = sql`SELECT name, data FROM pgboss.job WHERE id = ${id} AND state = 'failed'`;
    const result = await db.execute(pullQuery);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Failed job not found' });
    }

    const job = result.rows[0];
    
    // Re-enqueue as a new job
    const newJobId = await boss.send(job.name as string, job.data as object);
    
    if (newJobId) {
       // Optional: mark original as archived/completed so it doesn't show in failed queue
       await db.execute(sql`UPDATE pgboss.job SET state = 'archived' WHERE id = ${id}`);
       logger.info(`[Admin Jobs] Retried job ${id} -> spawned as new job ${newJobId}`);
       return res.json({ success: true, newJobId });
    } else {
       return res.status(500).json({ error: 'Failed to re-enqueue job' });
    }
  } catch (error) {
    logger.error(`Failed to retry job ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

export function registerAdminJobsRoutes(app: any) {
  app.use('/api/admin/jobs', router);
}
