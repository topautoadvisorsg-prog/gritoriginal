import { db } from "../db";
import { users } from "../../shared/models/auth";
import { eq, lt, and } from "drizzle-orm";
import { logger } from "../utils/logger";

export const expirationService = {
    /**
     * Checks for expired subscriptions and downgrades users to 'free' tier.
     * This should be called by a cron job or a scheduled task.
     */
    async checkExpirations() {
        logger.info('Checking for expired subscriptions...');

        const now = new Date();

        try {
            // Find users whose tier is not 'free' and whose currentPeriodEnd has passed
            const expiredUsers = await db.select()
                .from(users)
                .where(and(
                    lt(users.currentPeriodEnd, now),
                    eq(users.tier, 'premium') // Or inArray(users.tier, ['medium', 'premium'])
                ));

            if (expiredUsers.length === 0) {
                logger.info('No expired subscriptions found');
                return;
            }

            logger.info(`Found ${expiredUsers.length} expired subscriptions. Downgrading...`);

            for (const user of expiredUsers) {
                await db.update(users)
                    .set({
                        tier: 'free',
                        subscriptionStatus: 'canceled'
                    })
                    .where(eq(users.id, user.id));
                logger.info(`User ${user.id} downgraded to free tier due to expiration`);
            }

            logger.info('Expiration check complete');
        } catch (error) {
            logger.error('Error during expiration check:', error);
        }
    },
};

export default expirationService;
