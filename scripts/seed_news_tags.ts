import { db } from "../server/db";
import { tags } from "../shared/schema";
import { count } from "drizzle-orm";
import { logger } from "../server/utils/logger";

const STARTING_TAGS = [
  // Standard News
  { name: 'fight-announcement', category: 'standard', color: '#fbbf24' }, // Gold
  { name: 'cancellation', category: 'standard', color: '#ef4444' }, // Red
  { name: 'replacement', category: 'standard', color: '#f97316' }, // Orange
  { name: 'weigh-in', category: 'standard', color: '#3b82f6' }, // Blue
  { name: 'event-recap', category: 'standard', color: '#9ca3af' }, // Gray
  { name: 'event-preview', category: 'standard', color: '#10b981' }, // Green

  // Intelligence Signals
  { name: 'injury', category: 'intelligence', color: '#ef4444' }, // Red
  { name: 'camp-report', category: 'intelligence', color: '#fbbf24' }, // Gold
  { name: 'weight-cut', category: 'intelligence', color: '#f97316' }, // Orange
  { name: 'motivation', category: 'intelligence', color: '#a855f7' }, // Purple
  { name: 'form', category: 'intelligence', color: '#10b981' }, // Green
  { name: 'behavioral', category: 'intelligence', color: '#ef4444' }, // Red
  { name: 'odds-move', category: 'intelligence', color: '#fbbf24' }, // Gold
];

async function seedTags() {
  try {
    const existing = await db.select({ count: count() }).from(tags);
    if (existing[0].count > 0) {
      logger.info('Tags already seeded. Skipping.');
      return;
    }

    logger.info(`Seeding ${STARTING_TAGS.length} tags...`);
    await db.insert(tags).values(STARTING_TAGS);
    logger.info('Tags seeded successfully.');
  } catch (error) {
    logger.error('Error seeding tags:', error);
  } finally {
    process.exit(0);
  }
}

seedTags();
