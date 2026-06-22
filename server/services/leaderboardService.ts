import { db } from "../db";
import { leaderboardSnapshots, users, userPicks, eventFights, events } from "../../shared/schema";
import { eq, and, sql, gte, lte, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { canonicalRankingEligibilityConditions } from './rankingEligibility';
import type { SnapshotType } from '../../shared/models/ranking';

export function createSnapshotIdempotencyKey(
    type: SnapshotType,
    eventId?: string,
    startDate?: Date,
    endDate?: Date,
): string {
    if (type === 'event') {
        if (!eventId) throw new Error('eventId is required for an event snapshot');
        return `event:${eventId}`;
    }
    if (!startDate || !endDate) {
        throw new Error(`${type} snapshots require an exact date range`);
    }
    return `${type}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Create leaderboard snapshot using NET UNITS ONLY formula.
 *
 * Formula: Net Units = Sum of stored pick net-unit scores.
 * points_awarded is legacy storage for net-unit hundredths until the schema is renamed.
 *
 * No accuracy weighting. No participation rate. No recent form.
 * Just pure net units. Highest net units = Rank 1.
 */
export async function createLeaderboardSnapshot(
    type: SnapshotType = 'event',
    eventId?: string,
    startDate?: Date,  // For monthly/yearly
    endDate?: Date     // For monthly/yearly
) {
    // Handle automatic date calculation for monthly/yearly if not provided
    if ((type === 'monthly' || type === 'yearly') && (!startDate || !endDate)) {
        const now = new Date();
        if (type === 'monthly') {
            // Default to previous month
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (type === 'yearly') {
            // Default to previous year
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        }
    }

    logger.info(`[Leaderboard] Creating ${type} snapshot: eventId=${eventId || 'N/A'}, dateRange=${startDate?.toISOString()} to ${endDate?.toISOString()}`);
    const idempotencyKey = createSnapshotIdempotencyKey(type, eventId, startDate, endDate);

    // Get all users with picks in the specified period
    let userPicksQuery;

    if (type === 'event' && eventId) {
        // Per-event: only picks from this specific event
        userPicksQuery = db.select({
            userId: userPicks.userId,
            pointsAwarded: userPicks.pointsAwarded,
            fightId: userPicks.fightId,
        })
        .from(userPicks)
        .innerJoin(eventFights, sql`${userPicks.fightId} = ${eventFights.id}::text`)
        .where(and(
            eq(eventFights.eventId, eventId),
            ...canonicalRankingEligibilityConditions()
        ));
    } else if ((type === 'monthly' || type === 'yearly') && startDate && endDate) {
        // Monthly/Yearly: picks within date range
        userPicksQuery = db.select({
            userId: userPicks.userId,
            pointsAwarded: userPicks.pointsAwarded,
            fightId: userPicks.fightId,
        })
        .from(userPicks)
        .innerJoin(eventFights, sql`${userPicks.fightId} = ${eventFights.id}::text`)
        .innerJoin(events, eq(eventFights.eventId, events.id))
        .where(and(
            gte(events.date, startDate),
            lte(events.date, endDate),
            ...canonicalRankingEligibilityConditions()
        ));
    } else {
        logger.warn('[Leaderboard] Invalid parameters for snapshot creation');
        return null;
    }

    const allPicks = await userPicksQuery;

    // Calculate net units per user from the canonical stored score.
    const userNetUnits = new Map<string, number>();

    for (const pick of allPicks) {
        const netUnits = Number(pick.pointsAwarded || 0) / 100;
        const currentNet = userNetUnits.get(pick.userId) || 0;
        userNetUnits.set(pick.userId, currentNet + netUnits);
    }

    // Convert to rankings array
    const rankings = Array.from(userNetUnits.entries())
        .map(([userId, netUnits]) => ({
            userId,
            netUnits: Math.round(netUnits * 100) / 100, // Round to 2 decimals
        }))
        .sort((a, b) => b.netUnits - a.netUnits) // Highest net units first
        .map((entry, index) => ({
            ...entry,
            rank: index + 1, // Assign rank (ties will get different ranks, but same netUnits)
        }));

    // Add username for display
    const userIds = rankings.map(r => r.userId);
    const userData = await db.select({
        id: users.id,
        username: users.username,
        currentStreak: users.currentStreak,
    }).from(users).where(inArray(users.id, userIds)); // Batch fetch usernames and streaks

    const finalRankings = rankings.map(r => {
        const user = userData.find(u => u.id === r.userId);
        return {
            rank: r.rank,
            userId: r.userId,
            username: user?.username || 'Unknown',
            netUnits: r.netUnits,
            currentStreak: user?.currentStreak || 0,
        };
    });

    logger.info(`[Leaderboard] Generated ${finalRankings.length} rankings for ${type} snapshot`);

    // Save snapshot
    const [snapshot] = await db.insert(leaderboardSnapshots)
        .values({
            id: uuidv4(),
            snapshotType: type,
            eventId: eventId || null,
            idempotencyKey,
            snapshotDate: new Date(),
            rankings: finalRankings,
            createdAt: new Date(),
        })
        .onConflictDoNothing({ target: leaderboardSnapshots.idempotencyKey })
        .returning();

    if (!snapshot) {
        const [existing] = await db.select()
            .from(leaderboardSnapshots)
            .where(eq(leaderboardSnapshots.idempotencyKey, idempotencyKey))
            .limit(1);
        if (!existing) throw new Error(`Snapshot idempotency conflict without existing row: ${idempotencyKey}`);
        logger.info(`[Leaderboard] Reused existing snapshot for ${idempotencyKey}`);
        return existing;
    }

    // Fire rank-change notifications (Blueprint §11) by comparing this snapshot
    // against the previous one of the same type+scope. Best-effort: a failure here
    // never blocks snapshot creation. Skips gracefully without OneSignal keys.
    notifyRankChangesSinceLastSnapshot(type, eventId, finalRankings).catch(err =>
        logger.warn('[Leaderboard] rank-change notification failed:', err)
    );

    return snapshot;
}

/**
 * Compare this snapshot to the most recent prior snapshot of the same scope.
 * For any user whose rank changed, push a OneSignal "Rank Up/Down" notification.
 * No-op if no prior snapshot exists or if OneSignal is unconfigured.
 */
async function notifyRankChangesSinceLastSnapshot(
    type: 'event' | 'monthly' | 'yearly',
    eventId: string | undefined,
    currentRankings: Array<{ rank: number; userId: string }>,
) {
    const { notifyRankChanged } = await import('./notificationService');

    // Find the previous snapshot for this scope (event or global timeframe).
    const prior = await db
        .select()
        .from(leaderboardSnapshots)
        .where(and(
            eq(leaderboardSnapshots.snapshotType, type),
            eventId
                ? eq(leaderboardSnapshots.eventId, eventId)
                : sql`event_id IS NULL`,
        ))
        .orderBy(
            sql`snapshot_date DESC`,
            sql`created_at DESC`,
            sql`id DESC`,
        )
        .limit(2);

    // The most recent is the one we just inserted; the one BEFORE it is what we compare to.
    const previousSnapshot = prior[1];
    if (!previousSnapshot) return; // first-ever snapshot for this scope

    const previousRankings = (previousSnapshot.rankings as Array<{ userId: string; rank: number }> | null) ?? [];
    const previousRankByUser = new Map(previousRankings.map(r => [r.userId, r.rank]));

    let notified = 0;
    for (const cur of currentRankings) {
        const oldRank = previousRankByUser.get(cur.userId);
        if (oldRank && oldRank !== cur.rank) {
            // Fire and forget — OneSignal skip is logged inside the helper if unconfigured.
            notifyRankChanged(cur.userId, oldRank, cur.rank).catch(() => {});
            notified++;
        }
    }

    if (notified > 0) {
        logger.info(`[Leaderboard] Queued ${notified} rank-change notifications`);
    }
}
