import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { slips } from '../../shared/schema';
import { lt } from 'drizzle-orm';
import { createLeaderboardSnapshot } from './leaderboardService';
import { runMonthlyProgression } from './progressionService';
import { retryFailedEntries } from './dataEngineService';
import { logger } from '../utils/logger';

/**
 * Initialize all scheduled tasks for the system.
 */
export function initCrons() {
    logger.info('[Cron] Initializing scheduled tasks...');

    // 1. Monthly Leaderboard Snapshot
    // Schedule: 1st of every month at 00:01
    cron.schedule('1 0 1 * *', async () => {
        logger.info('[Cron] Running monthly leaderboard snapshot and progression...');
        try {
            // Snapshot for the month that just ended
            const now = new Date();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            
            await createLeaderboardSnapshot('monthly', undefined, lastMonthStart, lastMonthEnd);
            await runMonthlyProgression(lastMonthStart, lastMonthEnd);
            
            logger.info('[Cron] Monthly tasks completed successfully');
        } catch (error) {
            logger.error('[Cron] Monthly tasks failed:', error);
        }
    });

    // 2. Yearly Leaderboard Snapshot
    // Schedule: 1st of January at 00:05
    cron.schedule('5 0 1 1 *', async () => {
        logger.info('[Cron] Running yearly leaderboard snapshot...');
        try {
            const now = new Date();
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            
            await createLeaderboardSnapshot('yearly', undefined, lastYearStart, lastYearEnd);
            
            logger.info('[Cron] Yearly tasks completed successfully');
        } catch (error) {
            logger.error('[Cron] Yearly tasks failed:', error);
        }
    });

    // 3. Daily "Safety" Check for Event Closure
    // Schedule: Daily at 03:00
    cron.schedule('0 3 * * *', () => {
        logger.info('[Cron] Running daily system health check...');
        // Placeholder for future maintenance tasks (e.g. cleaning expired tokens, vacuuming DB)
    });

    // 4. Daily Slip Expiry Cleanup
    // Schedule: Daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('[Cron] Running daily slip expiry cleanup...');
        try {
            const now = new Date();

            // Find all expired slips
            const expiredSlips = await db.select().from(slips).where(lt(slips.expiresAt, now));

            let deletedCount = 0;
            for (const slip of expiredSlips) {
                // Delete from filesystem (strip leading slash so path.join resolves correctly)
                try {
                    const absPath = path.join(process.cwd(), slip.imageUrl.replace(/^\//, ""));
                    if (fs.existsSync(absPath)) {
                        fs.unlinkSync(absPath);
                    }
                } catch (fsErr) {
                    logger.warn(`[Cron] Could not delete slip file ${slip.imageUrl}:`, fsErr);
                }
            }

            if (expiredSlips.length > 0) {
                // Bulk delete from DB
                await db.delete(slips).where(lt(slips.expiresAt, now));
                deletedCount = expiredSlips.length;
            }

            logger.info(`[Cron] Slip cleanup completed: ${deletedCount} slips removed`);
        } catch (error) {
            logger.error('[Cron] Slip cleanup failed:', error);
        }
    });

    // 5. Pipeline Retry — every 30 minutes
    // Schedule: Every 30 minutes (e.g., :00 and :30)
    cron.schedule('*/30 * * * *', async () => {
        logger.info('[Cron] Running pipeline retry for failed entries...');
        try {
            const result = await retryFailedEntries();
            if (result.attempted > 0) {
                logger.info(`[Cron] Pipeline retry: ${result.succeeded}/${result.attempted} succeeded`);
            }
        } catch (error) {
            logger.error('[Cron] Pipeline retry failed:', error);
        }
    });

    logger.info('[Cron] All tasks scheduled');
}
