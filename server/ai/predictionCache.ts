import { db } from '../db';
import { aiPredictionCache } from '../../shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import type { AIPrediction } from './openaiClient';
import { logger } from '../utils/logger';

// Default TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Get cached prediction if exists and not expired
 */
export async function getCachedPrediction(fightId: string): Promise<AIPrediction | null> {
    try {
        const [cached] = await db.select()
            .from(aiPredictionCache)
            .where(and(
                eq(aiPredictionCache.fightId, fightId),
                gt(aiPredictionCache.expiresAt, new Date())
            ));

        if (cached) {
            return cached.prediction as AIPrediction;
        }
        return null;
    } catch (error) {
        // Table may not exist yet, return null
        logger.warn('Cache lookup failed:', error);
        return null;
    }
}

/**
 * Store prediction in cache
 */
export async function cachePrediction(prediction: AIPrediction): Promise<void> {
    try {
        const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

        // Upsert: delete old, insert new
        await db.delete(aiPredictionCache)
            .where(eq(aiPredictionCache.fightId, prediction.fightId));

        await db.insert(aiPredictionCache).values({
            fightId: prediction.fightId,
            model: prediction.model,
            prediction,
            expiresAt,
        });
    } catch (error) {
        // Non-fatal: prediction still works, just not cached
        logger.warn('Cache write failed:', error);
    }
}

/**
 * Clear expired cache entries (run periodically)
 */
export async function cleanupExpiredCache(): Promise<number> {
    try {
        const result = await db.delete(aiPredictionCache)
            .where(lt(aiPredictionCache.expiresAt, new Date()));
        return 0; // Drizzle doesn't return count easily
    } catch (error) {
        logger.warn('Cache cleanup failed:', error);
        return 0;
    }
}
