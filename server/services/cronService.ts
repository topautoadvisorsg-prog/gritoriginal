import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { slips } from '../../shared/schema';
import { lt } from 'drizzle-orm';
import { createLeaderboardSnapshot } from './leaderboardService';
import { runMonthlyProgression } from './progressionService';
import { retryFailedEntries } from './dataEngineService';
import { expirationService } from './expirationService';
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

    // 3. Daily Subscription Expiration Check
    // Schedule: Daily at 03:00
    // Downgrades users whose Stripe subscription period has ended back to 'free' tier.
    // Without this, cancelled subscribers keep paid access indefinitely (revenue leak).
    cron.schedule('0 3 * * *', async () => {
        logger.info('[Cron] Running daily subscription expiration check...');
        try {
            await expirationService.checkExpirations();
        } catch (error) {
            logger.error('[Cron] Subscription expiration check failed:', error);
        }
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

    // 6. Monthly Bonus Draw (Blueprint §7 — $550 pool)
    // Schedule: 1st of every month at 00:05 UTC (5 min after monthly snapshot at 00:01)
    // Gated by MONTHLY_BONUS_DRAW_ENABLED env var because it writes to cash_payouts,
    // which only exists once the Week 2 migration is applied. Flip the env var to 'true'
    // (or unset it after migration apply if you want it default-on) the moment migration
    // applies and the draw will start firing on the next 1st-of-month tick.
    cron.schedule('5 0 1 * *', async () => {
        if (process.env.MONTHLY_BONUS_DRAW_ENABLED !== 'true') {
            logger.info('[Cron] Monthly bonus draw skipped — MONTHLY_BONUS_DRAW_ENABLED is not "true" (waiting on Week 2 migration)');
            return;
        }
        logger.info('[Cron] Running monthly bonus draw...');
        try {
            const { runMonthlyBonusDraw } = await import('./monthlyBonusDrawJob');
            const result = await runMonthlyBonusDraw();
            logger.info(`[Cron] Monthly bonus draw completed: ${result.winners} winner(s), total $${(result.totalCents / 100).toFixed(2)}`);
        } catch (error) {
            logger.error('[Cron] Monthly bonus draw failed:', error);
        }
    });

    logger.info('[Cron] All tasks scheduled');
}
