import { db } from "../db";
import { users, userPicks, events, eventFights } from "../../shared/schema";
import { fightResults } from "../../shared/models/auth";
import { eq, and, gte, lte, inArray, ne, sql, desc } from "drizzle-orm";
import { calculateProfit } from "../roiCalculator";
import { logger } from "../utils/logger";
import { config } from '../config/env';
import { sendNotificationToUser } from './notificationService';

// Badge tier progression order - centralized in config
const BADGE_TIERS = config.BADGE_TIERS;
type BadgeTier = typeof BADGE_TIERS[number];

interface ProgressionResult {
    userId: string;
    participationPct: number;
    roi: number;
    oldStars: number;
    newStars: number;
    starsGained: number;
    oldBadge: string;
    newBadge: string;
    badgeGained?: string;
    reason: string;
}

/**
 * Calculate user's star/badge progression PER EVENT (not monthly).
 * Triggered when an event closes.
 * 
 * Rules:
 * - Only NONE, GREEN, and YELLOW confidence flag picks count toward ranking/stars
 * - RED flag is excluded from all competitive calculations
 * - Points awarded on ALL picks regardless of flag
 * - ≥70% participation AND positive ROI → +1 star (+2 if ROI > 15%)
 * - Neutral ROI (0) → no change
 * - Negative ROI → -1 star (min 0)
 * - Max 5 stars
 * - Post-5-star: same rules but advance/regress badge tier
 *   - Tiers: none → ninja → samurai → master → goat
 *   - Regression floor is 'ninja' (never drops back to 'none' once earned)
 * 
 * Cancelled fights are excluded from the participation denominator.
 */
export async function calculateUserProgressionPerEvent(
    userId: string,
    eventId: string,
): Promise<ProgressionResult> {
    // 1. Get user's current state
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error(`User ${userId} not found`);

    const oldStars = user.starLevel ?? 0;
    const oldBadge = (user.progressBadge ?? 'none') as BadgeTier;

    // 2. Get the closed event
    const [closedEvent] = await db.select().from(events)
        .where(and(
            eq(events.id, eventId),
            eq(events.status, 'Closed'),
        ));

    if (!closedEvent) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            starsGained: 0,
            oldBadge,
            newBadge: oldBadge,
            reason: 'Event not found or not closed',
        };
    }

    // 3. Get all fights from this event (excluding cancelled)
    const allFights = await db.select().from(eventFights)
        .where(and(
            eq(eventFights.eventId, eventId),
            ne(eventFights.status, 'Cancelled'),
        ));

    const totalAvailableFights = allFights.length;
    if (totalAvailableFights === 0) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            starsGained: 0,
            oldBadge,
            newBadge: oldBadge,
            reason: 'No non-cancelled fights in event',
        };
    }

    // 4. Get user's active picks for this event - ONLY NONE, GREEN, and YELLOW flags count (RED excluded)
    const fightIds = allFights.map(f => f.id);
    const userPicksData = await db.select().from(userPicks)
        .where(and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds),
            eq(userPicks.status, 'active'),
            sql`${userPicks.confidenceFlag} IN ('none', 'green', 'yellow')`, // YELLOW NOW COUNTS
        ));

    const validPicksCount = userPicksData.length;
    const requiredPicks = config.getRequiredPicks(totalAvailableFights);
    const hasMetPickMinimum = validPicksCount >= requiredPicks;
    const participationPct = Math.round((validPicksCount / totalAvailableFights) * 100);

    // 5. Calculate ROI
    const fightMap = new Map(allFights.map(f => [f.id, f]));
    let totalUnits = 0;
    let totalProfit = 0;

    // Get fight results for scored fights
    const resultsData = fightIds.length > 0
        ? await db.select().from(fightResults).where(inArray(fightResults.fightId, fightIds))
        : [];
    const resultMap = new Map(resultsData.map(r => [r.fightId, r]));

    for (const pick of userPicksData) {
        const units = pick.units || 1;
        totalUnits += units;

        const result = resultMap.get(pick.fightId);
        if (!result || !result.winnerId) continue;

        // Draw/NC = refund (0 profit)
        if (result.winnerId === 'draw' || result.winnerId === 'no_contest') {
            continue;
        }

        const isWin = pick.pickedFighterId === result.winnerId;
        
        // USE LOCKED ODDS (odds at submission time, not current odds)
        const lockedOdds = pick.lockedOdds;
        
        if (isWin) {
            totalProfit += lockedOdds ? calculateProfit(lockedOdds, units) : units;
        } else {
            totalProfit -= units;
        }
    }

    const roi = totalUnits > 0 ? Math.round((totalProfit / totalUnits) * 10000) / 100 : 0;

    // 6. Apply progression rules
    let newStars = oldStars;
    let newBadge = oldBadge;
    let reason = '';

    if (roi === 0) {
        // Neutral ROI → no change
        reason = `Neutral ROI (${validPicksCount}/${requiredPicks} picks). No change.`;
    } else if (roi > 0 && hasMetPickMinimum) {
        // Positive ROI + sufficient participation → advance
        const starGain = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;

        if (oldStars < config.STAR_CAP) {
            newStars = Math.min(config.STAR_CAP, oldStars + starGain);
            reason = `+${newStars - oldStars} star(s): ${validPicksCount}/${requiredPicks} picks, ${roi}% ROI`;
        } else {
            // Already at 5 stars → advance badge
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.min(BADGE_TIERS.length - 1, currentIdx + 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge: ${oldBadge} → ${newBadge} (${validPicksCount}/${requiredPicks} picks, ${roi}% ROI)`;
        }
    } else if (roi < 0) {
        // Negative ROI → regress
        if (oldStars < config.STAR_CAP || (oldStars === config.STAR_CAP && BADGE_TIERS.indexOf(oldBadge) <= 1)) {
            // Still in star phase or at ninja badge → reduce stars
            newStars = Math.max(0, oldStars - 1);
            reason = `-1 star: negative ROI (${roi}%). Stars: ${oldStars} → ${newStars}`;
        } else {
            // In badge phase → regress badge (floor: ninja)
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.max(1, currentIdx - 1); // Floor at 'ninja' (index 1)
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge regression: ${oldBadge} → ${newBadge} (${roi}% ROI)`;
        }
    } else {
        // Positive ROI but below required pick minimum
        reason = `Insufficient picks (${validPicksCount}/${requiredPicks} required). No change.`;
    }

    // 6.b Login Bonus (Gamification)
    const loginBonus = Math.min(config.LOGIN_BONUS_MAX, (user.monthlyLoginCount || 0) * (config.LOGIN_BONUS_MAX / config.LOGIN_BONUS_LOGINS_REQUIRED));

    if (loginBonus > 0) {
        const potentialStars = newStars + loginBonus;
        if (oldStars < config.STAR_CAP) {
            newStars = Math.min(config.STAR_CAP, potentialStars);
            reason += ` +${loginBonus.toFixed(2)} login bonus.`;
        }
    }

    // 7. Update Streak
    const currentStreak = await calculateUserStreak(userId, eventId, {
        netUnits: totalProfit,
        qualified: hasMetPickMinimum && roi > 0
    });

    // 8. Persist changes
    await db.update(users)
        .set({
            starLevel: newStars,
            progressBadge: newBadge,
            currentStreak: currentStreak,
            lastProgressionCalc: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return {
        userId,
        participationPct,
        roi,
        oldStars,
        newStars,
        starsGained: newStars - oldStars,
        oldBadge,
        newBadge,
        badgeGained: newBadge !== oldBadge ? newBadge : undefined,
        reason,
    };
}

/**
 * Run progression calculation for ALL users on a specific event.
 * Triggered when an event closes.
 */
export async function runEventProgression(
    eventId: string,
): Promise<ProgressionResult[]> {
    // Get all users who have made picks in this event
    const eventFightsList = await db.select({ id: eventFights.id })
        .from(eventFights)
        .where(eq(eventFights.eventId, eventId));
    
    const fightIds = eventFightsList.map(f => f.id);
    
    const usersWithPicks = await db.selectDistinct({ userId: userPicks.userId })
        .from(userPicks)
        .where(and(
            eq(userPicks.status, 'active'),
            inArray(userPicks.fightId, fightIds),
        ));
    
    const results: ProgressionResult[] = [];

    for (const userRecord of usersWithPicks) {
        try {
            const result = await calculateUserProgressionPerEvent(userRecord.userId, eventId);
            
            // Send notification if user gained stars or badges
            if (result.starsGained > 0 || result.badgeGained) {
                try {
                    let title = '🌟 Your Progression Updated!';
                    let message = `You earned ${result.starsGained} stars from the event`;
                    
                    if (result.badgeGained) {
                        title = '🏆 Badge Unlocked!';
                        message = `Congratulations! You've earned the ${result.badgeGained} badge`;
                    }
                    
                    await sendNotificationToUser(userRecord.userId, title, message, {
                        type: 'progression_update',
                        starsGained: result.starsGained.toString(),
                        badgeGained: result.badgeGained || '',
                        eventId: eventId
                    });
                } catch (notifError) {
                    logger.warn('Failed to send progression notification:', notifError);
                }
            }
            
            results.push(result);
        } catch (error) {
            logger.error(`Progression calculation failed for user ${userRecord.userId} on event ${eventId}:`, error);
        }
    }

    return results;
}

/**
 * Calculate user's star/badge progression over a date range (monthly or custom).
 * Used by runMonthlyProgression and the GET /api/admin/progression/user/:userId endpoint.
 *
 * Aggregates picks across ALL closed events whose date falls within [monthStart, monthEnd].
 * Applies the same participation + ROI rules as calculateUserProgressionPerEvent.
 */
export async function calculateUserProgression(
    userId: string,
    monthStart: Date,
    monthEnd: Date,
): Promise<ProgressionResult> {
    // 1. Get user's current state
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error(`User ${userId} not found`);

    const oldStars = user.starLevel ?? 0;
    const oldBadge = (user.progressBadge ?? 'none') as BadgeTier;

    // 2. Get all closed events in the date window
    const closedEvents = await db.select().from(events)
        .where(and(
            eq(events.status, 'Closed'),
            gte(events.date, monthStart),
            lte(events.date, monthEnd),
        ));

    if (closedEvents.length === 0) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            starsGained: 0,
            oldBadge,
            newBadge: oldBadge,
            reason: 'No closed events in this period',
        };
    }

    const eventIds = closedEvents.map(e => e.id);

    // 3. Get all non-cancelled fights for these events
    const allFights = await db.select().from(eventFights)
        .where(and(
            inArray(eventFights.eventId, eventIds),
            ne(eventFights.status, 'Cancelled'),
        ));

    const totalAvailableFights = allFights.length;
    if (totalAvailableFights === 0) {
        return {
            userId,
            participationPct: 0,
            roi: 0,
            oldStars,
            newStars: oldStars,
            starsGained: 0,
            oldBadge,
            newBadge: oldBadge,
            reason: 'No non-cancelled fights in this period',
        };
    }

    // 4. Get user's active picks across these fights — RED flag excluded
    const fightIds = allFights.map(f => f.id);
    const userPicksData = await db.select().from(userPicks)
        .where(and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds),
            eq(userPicks.status, 'active'),
            sql`${userPicks.confidenceFlag} IN ('none', 'green', 'yellow')`,
        ));

    const validPicksCount = userPicksData.length;
    const requiredPicks = config.getRequiredPicks(totalAvailableFights);
    const hasMetPickMinimum = validPicksCount >= requiredPicks;
    const participationPct = Math.round((validPicksCount / totalAvailableFights) * 100);

    // 5. Calculate ROI using locked odds
    let totalUnits = 0;
    let totalProfit = 0;

    const resultsData = fightIds.length > 0
        ? await db.select().from(fightResults).where(inArray(fightResults.fightId, fightIds))
        : [];
    const resultMap = new Map(resultsData.map(r => [r.fightId, r]));

    for (const pick of userPicksData) {
        const units = pick.units || 1;
        totalUnits += units;

        const result = resultMap.get(pick.fightId);
        if (!result || !result.winnerId) continue;

        if (result.winnerId === 'draw' || result.winnerId === 'no_contest') continue;

        const isWin = pick.pickedFighterId === result.winnerId;
        const lockedOdds = pick.lockedOdds;

        if (isWin) {
            totalProfit += lockedOdds ? calculateProfit(lockedOdds, units) : units;
        } else {
            totalProfit -= units;
        }
    }

    const roi = totalUnits > 0 ? Math.round((totalProfit / totalUnits) * 10000) / 100 : 0;

    // 6. Apply progression rules (identical to per-event logic)
    let newStars = oldStars;
    let newBadge = oldBadge;
    let reason = '';

    if (roi === 0) {
        reason = `Neutral ROI (${validPicksCount}/${requiredPicks} picks). No change.`;
    } else if (roi > 0 && hasMetPickMinimum) {
        const starGain = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;
        if (oldStars < config.STAR_CAP) {
            newStars = Math.min(config.STAR_CAP, oldStars + starGain);
            reason = `+${newStars - oldStars} star(s): ${validPicksCount}/${requiredPicks} picks, ${roi}% ROI`;
        } else {
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.min(BADGE_TIERS.length - 1, currentIdx + 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge: ${oldBadge} → ${newBadge} (${validPicksCount}/${requiredPicks} picks, ${roi}% ROI)`;
        }
    } else if (roi < 0) {
        if (oldStars < config.STAR_CAP || (oldStars === config.STAR_CAP && BADGE_TIERS.indexOf(oldBadge) <= 1)) {
            newStars = Math.max(0, oldStars - 1);
            reason = `-1 star: negative ROI (${roi}%). Stars: ${oldStars} → ${newStars}`;
        } else {
            const currentIdx = BADGE_TIERS.indexOf(oldBadge);
            const newIdx = Math.max(1, currentIdx - 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge regression: ${oldBadge} → ${newBadge} (${roi}% ROI)`;
        }
    } else {
        reason = `Insufficient picks (${validPicksCount}/${requiredPicks} required). No change.`;
    }

    // 7. Persist changes
    await db.update(users)
        .set({
            starLevel: newStars,
            progressBadge: newBadge,
            lastProgressionCalc: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return {
        userId,
        participationPct,
        roi,
        oldStars,
        newStars,
        starsGained: newStars - oldStars,
        oldBadge,
        newBadge,
        badgeGained: newBadge !== oldBadge ? newBadge : undefined,
        reason,
    };
}

/**
 * Run monthly progression for ALL users who have made picks.
 */
export async function runMonthlyProgression(
    monthStart: Date,
    monthEnd: Date,
): Promise<ProgressionResult[]> {
    // Get all users who have made picks
    const allUsers = await db.select({ id: users.id }).from(users);
    const results: ProgressionResult[] = [];

    for (const user of allUsers) {
        try {
            const result = await calculateUserProgression(user.id, monthStart, monthEnd);
            results.push(result);
        } catch (error) {
            logger.error(`Progression calculation failed for user ${user.id}:`, error);
        }
    }

    return results;
}
/**
 * Calculate the user's current winning streak based on EVENT level results.
 * 
 * A streak is the number of consecutive closed events where:
 * 1. Net Units > 0
 * 2. At least one star was earned (Participation + ROI)
 * 
 * @param currentEventResult Optional result for the event currently being processed to avoid re-calculation.
 */
export async function calculateUserStreak(
    userId: string, 
    currentEventId?: string,
    currentEventResult?: { netUnits: number; qualified: boolean }
): Promise<number> {
    // 1. Get all closed events, ordered by date DESC
    const closedEvents = await db.select()
        .from(events)
        .where(eq(events.status, 'Closed'))
        .orderBy(desc(events.date));

    if (closedEvents.length === 0) return 0;

    let streak = 0;

    for (const event of closedEvents) {
        if (event.id === currentEventId && currentEventResult) {
            if (currentEventResult.netUnits > 0 && currentEventResult.qualified) {
                streak++;
                continue;
            } else {
                break;
            }
        }

        // Re-calculate performance for historical events
        const performance = await getEventPerformance(userId, event.id);
        if (performance.netUnits > 0 && performance.qualified) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Helper to calculate performance for a single event without full progression side-effects.
 */
async function getEventPerformance(userId: string, eventId: string) {
    const allFights = await db.select().from(eventFights)
        .where(and(
            eq(eventFights.eventId, eventId),
            ne(eventFights.status, 'Cancelled'),
        ));

    const totalAvailableFights = allFights.length;
    if (totalAvailableFights === 0) return { netUnits: 0, qualified: false };

    const fightIds = allFights.map(f => f.id);
    const userPicksData = await db.select().from(userPicks)
        .where(and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds),
            eq(userPicks.status, 'active'),
            sql`${userPicks.confidenceFlag} IN ('none', 'green', 'yellow')`,
        ));

    const validPicksCount = userPicksData.length;
    const requiredPicks = config.getRequiredPicks(totalAvailableFights);
    const hasMetPickMinimum = validPicksCount >= requiredPicks;

    let totalProfit = 0;
    const resultsData = fightIds.length > 0
        ? await db.select().from(fightResults).where(inArray(fightResults.fightId, fightIds))
        : [];
    const resultMap = new Map(resultsData.map(r => [r.fightId, r]));

    for (const pick of userPicksData) {
        const units = pick.units || 1;
        const result = resultMap.get(pick.fightId);
        if (!result || !result.winnerId) continue;
        if (result.winnerId === 'draw' || result.winnerId === 'no_contest') continue;

        const isWin = pick.pickedFighterId === result.winnerId;
        const lockedOdds = pick.lockedOdds;
        
        if (isWin) {
            totalProfit += lockedOdds ? calculateProfit(lockedOdds, units) : units;
        } else {
            totalProfit -= units;
        }
    }

    return { 
        netUnits: totalProfit, 
        qualified: hasMetPickMinimum && totalProfit > 0 
    };
}
