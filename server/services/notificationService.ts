import { DefaultApi, createConfiguration, ServerConfiguration } from '@onesignal/node-onesignal';
import { logger } from '../utils/logger';
import { env } from '../config/env';

function createOneSignalApi(): DefaultApi | null {
    if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
        return null;
    }
    const config = createConfiguration({
        authMethods: {
            rest_api_key: {
                tokenValue: env.ONESIGNAL_API_KEY,
            },
        },
    });
    return new DefaultApi(config);
}

interface NotificationData {
    [key: string]: string | number | boolean | null;
}

/**
 * Send push notification to a specific user
 */
export async function sendNotificationToUser(userId: string, title: string, message: string, data?: NotificationData): Promise<void> {
    try {
        const oneSignalApi = createOneSignalApi();
        if (!oneSignalApi) {
            logger.warn('OneSignal not configured - skipping notification');
            return;
        }

        const notification = {
            app_id: env.ONESIGNAL_APP_ID,
            contents: { en: message },
            headings: { en: title },
            include_external_user_ids: [userId],
            data: data || {},
        };

        await oneSignalApi.createNotification(notification as any);
        logger.info(`[OneSignal] Notification sent to user ${userId}: ${title}`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[OneSignal] Error sending notification:', errorMessage);
    }
}

/**
 * Send notifications to multiple users
 */
export async function sendNotificationToUsers(userIds: string[], title: string, message: string, data?: NotificationData): Promise<void> {
    try {
        const oneSignalApi = createOneSignalApi();
        if (!oneSignalApi) {
            logger.warn('OneSignal not configured - skipping notification');
            return;
        }

        const notification = {
            app_id: env.ONESIGNAL_APP_ID,
            contents: { en: message },
            headings: { en: title },
            include_external_user_ids: userIds,
            data: data || {},
        };

        await oneSignalApi.createNotification(notification as any);
        logger.info(`[OneSignal] Notification sent to ${userIds.length} users: ${title}`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[OneSignal] Error sending batch notification:', errorMessage);
    }
}

/**
 * Broadcast notification to all users
 */
export async function broadcastNotification(title: string, message: string, data?: NotificationData): Promise<void> {
    try {
        const oneSignalApi = createOneSignalApi();
        if (!oneSignalApi) {
            logger.warn('OneSignal not configured - skipping notification');
            return;
        }

        const notification = {
            app_id: env.ONESIGNAL_APP_ID,
            contents: { en: message },
            headings: { en: title },
            included_segments: ['All'],
            data: data || {},
        };

        await oneSignalApi.createNotification(notification as any);
        logger.info(`[OneSignal] Broadcast sent: ${title}`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[OneSignal] Error sending broadcast notification:', errorMessage);
    }
}

/**
 * Trigger: Event starts in 1 hour
 */
export async function notifyEventStartingSoon(eventId: string, eventName: string): Promise<void> {
    try {
        // Get all users who have made picks for this event
        const { db } = await import('../db');
        const { userPicks } = await import('../../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const picks = await db.select({
            userId: userPicks.userId,
        }).from(userPicks).where(eq(userPicks.fightId, eventId));
        
        const uniqueUserIds = [...new Set(picks.map(p => p.userId))];
        
        if (uniqueUserIds.length > 0) {
            await sendNotificationToUsers(
                uniqueUserIds,
                '🔥 Event Starting Soon',
                `${eventName} starts in 1 hour! Make your final picks now.`,
                { type: 'event_starting', eventId }
            );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[Notification] Error sending event start notification:', errorMessage);
    }
}

/**
 * Trigger: Picks lock in 30 minutes
 */
export async function notifyPicksLockingSoon(eventId: string, eventName: string): Promise<void> {
    try {
        const { db } = await import('../db');
        const { events } = await import('../../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        // Get all active users (users with picks in the system)
        const { userPicks } = await import('../../shared/schema');
        const picks = await db.select({
            userId: userPicks.userId,
        }).from(userPicks).where(eq(userPicks.fightId, eventId));
        
        const uniqueUserIds = [...new Set(picks.map(p => p.userId))];
        
        if (uniqueUserIds.length > 0) {
            await sendNotificationToUsers(
                uniqueUserIds,
                '⏰ Picks Locking Soon',
                `Picks for ${eventName} lock in 30 minutes. Lock them in now!`,
                { type: 'picks_locking', eventId }
            );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[Notification] Error sending pick lock notification:', errorMessage);
    }
}

/**
 * Trigger: User's rank changed
 */
export async function notifyRankChanged(userId: string, oldRank: number, newRank: number): Promise<void> {
    try {
        const improvement = newRank < oldRank;
        const rankChange = Math.abs(oldRank - newRank);
        
        await sendNotificationToUser(
            userId,
            improvement ? '📈 Rank Up!' : '📉 Rank Changed',
            improvement 
                ? `Nice! You moved up ${rankChange} spots to #${newRank}`
                : `You dropped ${rankChange} spots to #${newRank}. Keep grinding!`,
            { type: 'rank_change', oldRank, newRank }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[Notification] Error sending rank change notification:', errorMessage);
    }
}

/**
 * Trigger: User has an active streak and event is live
 */
export async function notifyStreakAtRisk(userId: string, streakCount: number, eventName: string): Promise<void> {
    try {
        await sendNotificationToUser(
            userId,
            `🔥 Streak Alert: ${streakCount} Wins`,
            `Your ${streakCount}-fight win streak is on the line! ${eventName} is live — don't let it die!`,
            { type: 'streak_at_risk', streakCount }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[Notification] Error sending streak alert notification:', errorMessage);
    }
}
