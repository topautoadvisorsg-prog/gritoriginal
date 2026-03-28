import { db } from '../db';
import { aiFightQaCache, aiFightStats, eventFights, aiSuggestedQuestions } from '../../shared/schema';
import { eq, and, count, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export async function getActiveSuggestedQuestions(): Promise<string[]> {
    try {
        const rows = await db.select({ question: aiSuggestedQuestions.question })
            .from(aiSuggestedQuestions)
            .where(eq(aiSuggestedQuestions.isActive, true))
            .orderBy(asc(aiSuggestedQuestions.sortOrder));
        return rows.map(r => r.question);
    } catch (error) {
        logger.warn('[QA Cache] Failed to load suggested questions from DB:', error);
        return [];
    }
}

export async function isQuestionSuggested(question: string): Promise<boolean> {
    const questions = await getActiveSuggestedQuestions();
    const normalizedInput = normalizeQuestionKey(question);
    return questions.some(q => normalizeQuestionKey(q) === normalizedInput);
}

const QA_CACHE_LIMIT = 100;

/**
 * Normalize a question for consistent key matching.
 * Lowercases, strips punctuation, collapses whitespace.
 */
export function normalizeQuestionKey(question: string): string {
    return question
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if a cached answer exists for this fight + question key.
 * Increments hitCount on hit.
 */
export async function checkQaCache(fightId: string, questionKey: string): Promise<string | null> {
    try {
        const [cached] = await db.select()
            .from(aiFightQaCache)
            .where(and(
                eq(aiFightQaCache.fightId, fightId),
                eq(aiFightQaCache.questionKey, questionKey),
                eq(aiFightQaCache.isArchived, false)
            ));

        if (cached) {
            await db.update(aiFightQaCache)
                .set({ hitCount: cached.hitCount + 1, lastHitAt: new Date() })
                .where(eq(aiFightQaCache.id, cached.id));
            return cached.answer;
        }
        return null;
    } catch (error) {
        logger.warn('[QA Cache] Lookup failed:', error);
        return null;
    }
}

/**
 * Store a new Q&A pair for a fight. Respects per-fight cap.
 */
export async function storeQaCache(
    fightId: string,
    question: string,
    questionKey: string,
    answer: string,
    isSuggested: boolean = false
): Promise<void> {
    try {
        const [{ value: currentCount }] = await db
            .select({ value: count() })
            .from(aiFightQaCache)
            .where(and(
                eq(aiFightQaCache.fightId, fightId),
                eq(aiFightQaCache.isArchived, false)
            ));

        if (Number(currentCount) >= QA_CACHE_LIMIT) {
            logger.info(`[QA Cache] Fight ${fightId} at cap (${QA_CACHE_LIMIT}), skipping`);
            return;
        }

        await db.insert(aiFightQaCache).values({
            id: uuidv4(),
            fightId,
            question,
            questionKey,
            answer,
            hitCount: 0,
            isSuggested,
            isArchived: false,
            createdAt: new Date(),
        });
    } catch (error) {
        logger.warn('[QA Cache] Store failed:', error);
    }
}

/**
 * Mark all cached Q&A entries for a fight as archived.
 * Called when the event/fight completes — entries remain for historical analysis.
 */
export async function archiveFightCache(fightId: string): Promise<void> {
    try {
        await db.update(aiFightQaCache)
            .set({ isArchived: true })
            .where(eq(aiFightQaCache.fightId, fightId));
        logger.info(`[QA Cache] Archived cache for fight ${fightId}`);
    } catch (error) {
        logger.warn('[QA Cache] Archive failed:', error);
    }
}

/**
 * Archive all QA cache entries for every fight in an event.
 * Called when the event transitions to Completed.
 */
export async function archiveEventFightCaches(eventId: string): Promise<void> {
    try {
        const fights = await db.select({ id: eventFights.id })
            .from(eventFights)
            .where(eq(eventFights.eventId, eventId));

        await Promise.all(fights.map(f => archiveFightCache(f.id)));
        logger.info(`[QA Cache] Archived all fight caches for event ${eventId}`);
    } catch (error) {
        logger.warn('[QA Cache] Event archive failed:', error);
    }
}

/**
 * Track a fight analyst chat session open. Fire-and-forget.
 */
export async function trackFightChatOpen(fightId: string): Promise<void> {
    try {
        const [existing] = await db.select()
            .from(aiFightStats)
            .where(eq(aiFightStats.fightId, fightId));

        if (existing) {
            await db.update(aiFightStats)
                .set({ openCount: existing.openCount + 1, lastOpenAt: new Date() })
                .where(eq(aiFightStats.fightId, fightId));
        } else {
            await db.insert(aiFightStats).values({
                fightId,
                openCount: 1,
                lastOpenAt: new Date(),
            });
        }
    } catch (error) {
        logger.warn('[Fight Stats] Open tracking failed:', error);
    }
}
