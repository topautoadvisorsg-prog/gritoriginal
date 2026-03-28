import { db } from '../db';
import { aiSuggestedQuestions } from '../../shared/schema';
import { count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const SEED_QUESTIONS = [
    "Who has the striking advantage?",
    "Who has the grappling advantage?",
    "What is the most likely path to victory for each fighter?",
    "How do their last 5 fights compare?",
    "Does reach or size play a significant role in this matchup?",
    "Who has the cardio and conditioning edge?",
    "What style problems does each fighter present for the other?",
    "Give me your overall prediction and confidence level.",
];

export async function seedSuggestedQuestions(): Promise<void> {
    try {
        const [{ value: existing }] = await db
            .select({ value: count() })
            .from(aiSuggestedQuestions);

        if (Number(existing) > 0) {
            logger.info(`[Seed] Suggested questions already populated (${existing} rows), skipping`);
            return;
        }

        for (let i = 0; i < SEED_QUESTIONS.length; i++) {
            await db.insert(aiSuggestedQuestions).values({
                id: uuidv4(),
                question: SEED_QUESTIONS[i],
                sortOrder: i + 1,
                isActive: true,
            });
        }

        logger.info(`[Seed] Inserted ${SEED_QUESTIONS.length} suggested questions`);
    } catch (error) {
        logger.warn('[Seed] Failed to seed suggested questions:', error);
    }
}
