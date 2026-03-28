import { db } from "../db";
import { rafflePool, raffleDraws, users, events, eventFights, userPicks } from "../../shared/schema";
import { eq, and, sql, sum, count } from "drizzle-orm";
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { v4 as uuidv4 } from "uuid";
import { sendNotificationToUser, broadcastNotification } from './notificationService';

/**
 * Create raffle pool entries for all active subscribers when an event is finalized.
 *
 * Eligibility rule:
 *   - Subscriber must have been active for ≥ 1 full calendar month.
 *   - Month 0 (first month) = welcome period, NOT eligible.
 *   - Month 1+ = eligible. $0.50 contribution recorded.
 *   - If a user cancels and resubscribes, their subscriptionStartDate is reset
 *     (handled in stripeWebhook), so they re-enter month 0.
 *
 * @param eventId  The closing event's ID (used to gate by eventDate)
 * @param eventCloseDate  Date the event closed (used for monthsActive calculation)
 */
export async function createRafflePoolEntries(eventId: string, eventCloseDate: Date = new Date()): Promise<void> {
    try {
        // Get all active subscribers including their subscription start date
        const activeSubscribers = await db.select({
            id: users.id,
            subscriptionStatus: users.subscriptionStatus,
            subscriptionStartDate: users.subscriptionStartDate,
        })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));

        if (activeSubscribers.length === 0) {
            logger.info(`[Raffle] No active subscribers for event ${eventId}`);
            return;
        }

        const eligibleEntries: { eventId: string; userId: string; contributionAmount: number }[] = [];
        const ineligibleCount = { noStartDate: 0, tooNew: 0 };

        for (const subscriber of activeSubscribers) {
            // No start date recorded — treat as month 0 (ineligible)
            if (!subscriber.subscriptionStartDate) {
                ineligibleCount.noStartDate++;
                logger.debug(`[Raffle] Skipping user ${subscriber.id} — no subscriptionStartDate recorded`);
                continue;
            }

            // Calculate months active using UTC calendar arithmetic to avoid DST drift.
            // monthsActive = (closeYear - startYear) * 12 + (closeMonth - startMonth)
            const startDate = new Date(subscriber.subscriptionStartDate);
            const monthsActive =
                (eventCloseDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
                (eventCloseDate.getUTCMonth() - startDate.getUTCMonth());

            if (monthsActive < 1) {
                // First month — welcome period, not yet eligible
                ineligibleCount.tooNew++;
                logger.info(`[Raffle] Skipping user ${subscriber.id} — subscribed ${monthsActive} month(s) ago, needs ≥1`);
                continue;
            }

            eligibleEntries.push({
                eventId,
                userId: subscriber.id,
                contributionAmount: config.RAFFLE_CONTRIBUTION_PER_SUBSCRIBER,
            });
        }

        if (eligibleEntries.length === 0) {
            logger.info(`[Raffle] No eligible subscribers for event ${eventId} (${ineligibleCount.tooNew} too new, ${ineligibleCount.noStartDate} missing start date)`);
            return;
        }

        await db.insert(rafflePool).values(eligibleEntries);

        logger.info(
            `[Raffle] Created ${eligibleEntries.length} eligible pool entries for event ${eventId} ` +
            `(skipped: ${ineligibleCount.tooNew} too new, ${ineligibleCount.noStartDate} no start date)`
        );
    } catch (error) {
        logger.error('[Raffle] Error creating pool entries:', error instanceof Error ? error.message : 'Unknown error');
    }
}


/**
 * Calculate total raffle pool amount for an event.
 */
export async function getRafflePoolTotal(eventId: string): Promise<{ total: number; ticketCount: number }> {
    try {
        const result = await db.select({
            total: sum(rafflePool.contributionAmount),
            count: count(),
        })
        .from(rafflePool)
        .where(eq(rafflePool.eventId, eventId));

        const total = Number(result[0]?.total || 0);
        const ticketCount = Number(result[0]?.count || 0);

        return { total, ticketCount };
    } catch (error) {
        logger.error('[Raffle] Error calculating pool total:', error instanceof Error ? error.message : 'Unknown error');
        return { total: 0, ticketCount: 0 };
    }
}

/**
 * Draw raffle winner for an event.
 * Randomly selects one subscriber from the pool.
 */
export async function drawRaffleWinner(eventId: string): Promise<{ winnerId: string; poolTotal: number; totalTickets: number } | null> {
    try {
        // Get pool total and all entries
        const { total: poolTotal, ticketCount: totalTickets } = await getRafflePoolTotal(eventId);

        if (totalTickets === 0 || poolTotal === 0) {
            logger.warn(`[Raffle] No entries for event ${eventId}, skipping draw`);
            return null;
        }

        // Get all pool entries for this event
        const entries = await db.select({
            userId: rafflePool.userId,
        })
        .from(rafflePool)
        .where(eq(rafflePool.eventId, eventId));

        if (entries.length === 0) {
            logger.warn(`[Raffle] No entries found for event ${eventId}`);
            return null;
        }

        // Randomly select winner
        const randomIndex = Math.floor(Math.random() * entries.length);
        const winnerId = entries[randomIndex].userId;

        // Create raffle draw record
        const [drawResult] = await db.insert(raffleDraws).values({
            id: uuidv4(),
            eventId,
            winnerId,
            poolTotal,
            totalTickets,
            notified: false,
        }).returning();

        logger.info(`[Raffle] Winner drawn for event ${eventId}: User ${winnerId}, Pool: $${(poolTotal / 100).toFixed(2)}`);

        // Send notification to winner
        try {
            await sendNotificationToUser(winnerId, '🎉 YOU WON THE RAFFLE!', `Congratulations! You've won ${(poolTotal / 100).toFixed(2)} from the event raffle`, {
                type: 'raffle_win',
                amount: (poolTotal / 100).toFixed(2),
                eventId: eventId,
                drawId: drawResult.id
            });
            
            // Broadcast to all users about the winner (optional - creates excitement)
            await broadcastNotification('🎊 Raffle Winner Announced!', `A lucky subscriber just won ${(poolTotal / 100).toFixed(2)}! Subscribe to enter future raffles`, {
                type: 'raffle_announcement',
                winnerId: winnerId,
                amount: (poolTotal / 100).toFixed(2)
            });
        } catch (notifError) {
            logger.warn('Failed to send raffle notification:', notifError);
        }

        return {
            winnerId,
            poolTotal,
            totalTickets,
        };
    } catch (error) {
        logger.error('[Raffle] Error drawing winner:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

/**
 * Mark raffle draw as notified.
 */
export async function markRaffleNotified(drawId: string): Promise<void> {
    try {
        await db.update(raffleDraws)
            .set({ notified: true })
            .where(eq(raffleDraws.id, drawId));

        logger.info(`[Raffle] Marked draw ${drawId} as notified`);
    } catch (error) {
        logger.error('[Raffle] Error marking draw as notified:', error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Get raffle draw results for an event.
 */
export async function getRaffleDrawForEvent(eventId: string) {
    try {
        const [draw] = await db.select()
            .from(raffleDraws)
            .where(eq(raffleDraws.eventId, eventId));

        return draw || null;
    } catch (error) {
        logger.error('[Raffle] Error getting draw for event:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}
