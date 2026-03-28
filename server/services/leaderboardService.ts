import { db } from "../db";
import { leaderboardSnapshots, users, userPicks, eventFights, events } from "../../shared/schema";
import { desc, eq, and, sql, count, gte, lte, inArray, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

/**
 * Create leaderboard snapshot using NET UNITS ONLY formula.
 * 
 * Formula: Net Units = Sum of all profit/loss from moneyline picks
 * - Win: profit = calculateProfit(lockedOdds, units)
 * - Loss: profit = -units
 * 
 * No accuracy weighting. No participation rate. No recent form.
 * Just pure net units. Highest net units = Rank 1.
 */
export async function createLeaderboardSnapshot(
    type: 'event' | 'monthly' | 'yearly' = 'event',
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

    // Get all users with picks in the specified period
    let userPicksQuery;
    
    if (type === 'event' && eventId) {
        // Per-event: only picks from this specific event
        userPicksQuery = db.select({
            userId: userPicks.userId,
            lockedOdds: userPicks.lockedOdds,
            units: userPicks.units,
            pointsAwarded: userPicks.pointsAwarded,
            fightId: userPicks.fightId,
        })
        .from(userPicks)
        .innerJoin(eventFights, eq(userPicks.fightId, eventFights.id))
        .where(and(
            eq(eventFights.eventId, eventId),
            eq(eventFights.status, 'Completed'),
            eq(userPicks.status, 'active'),
            ne(userPicks.confidenceFlag, 'red')
        ));
    } else if ((type === 'monthly' || type === 'yearly') && startDate && endDate) {
        // Monthly/Yearly: picks within date range
        userPicksQuery = db.select({
            userId: userPicks.userId,
            lockedOdds: userPicks.lockedOdds,
            units: userPicks.units,
            pointsAwarded: userPicks.pointsAwarded,
            fightId: userPicks.fightId,
        })
        .from(userPicks)
        .innerJoin(eventFights, eq(userPicks.fightId, eventFights.id))
        .innerJoin(events, eq(eventFights.eventId, events.id))
        .where(and(
            eq(eventFights.status, 'Completed'),
            gte(events.date, startDate),
            lte(events.date, endDate),
            eq(userPicks.status, 'active'),
            ne(userPicks.confidenceFlag, 'red')
        ));
    } else {
        logger.warn('[Leaderboard] Invalid parameters for snapshot creation');
        return null;
    }

    const allPicks = await userPicksQuery;

    // Calculate net units per user
    const userNetUnits = new Map<string, number>();
    
    for (const pick of allPicks) {
        const isWin = pick.pointsAwarded > 0;
        let profit = 0;
        
        if (isWin) {
            // Use locked odds for profit calculation
            if (pick.lockedOdds) {
                const oddsNum = parseFloat(pick.lockedOdds.replace('+', ''));
                if (!isNaN(oddsNum)) {
                    if (oddsNum > 0) {
                        // Underdog: +200 → profit = (1 × 200) / 100 = +2.00
                        profit = (pick.units * oddsNum) / 100;
                    } else {
                        // Favorite: -150 → profit = (1 × 100) / 150 = +0.67
                        profit = (pick.units * 100) / Math.abs(oddsNum);
                    }
                } else {
                    profit = pick.units; // Default if odds invalid
                }
            } else {
                profit = pick.units; // Default if no odds
            }
        } else {
            // Loss: lose wagered units
            profit = -pick.units;
        }
        
        // Accumulate net units for this user
        const currentNet = userNetUnits.get(pick.userId) || 0;
        userNetUnits.set(pick.userId, currentNet + profit);
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
    
    const userMap = new Map(userData.map(u => [u.id, u.username]));
    
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
            snapshotDate: new Date(),
            rankings: finalRankings as any,
            createdAt: new Date(),
        })
        .returning();

    return snapshot;
}
