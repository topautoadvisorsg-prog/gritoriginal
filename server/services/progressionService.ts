import { db } from "../db";
import {
    users,
    userPicks,
    events,
    eventFights,
    eventCloseRuns,
    eventProgressionApplications,
} from "../../shared/schema";
import { eq, and, gte, lte, inArray, ne, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger";
import { config } from '../config/env';
import { sendNotificationToUser } from './notificationService';
import { isEligibleScoredPick } from './rankingEligibility';

// Badge tier progression order - centralized in config
const BADGE_TIERS = config.BADGE_TIERS;
type BadgeTier = typeof BADGE_TIERS[number];

export interface ProgressionResult {
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

type ProgressionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ProgressionDatabase = Pick<ProgressionTransaction, 'select' | 'update'>;

type ProgressionRuleInput = {
    oldStars: number;
    oldBadge: BadgeTier;
    roi: number;
    netUnits: number;
    hasMetPickMinimum: boolean;
    validPicksCount: number;
    requiredPicks: number;
};

type CanonicalProgressionPick = {
    status: string;
    confidenceFlag: string;
    fightStatus: string;
    pointsAwarded: number | null;
};

export function calculateCanonicalProgressionPerformance(picks: CanonicalProgressionPick[]) {
    const eligiblePicks = picks.filter((pick) => isEligibleScoredPick({
        pickStatus: pick.status,
        confidenceFlag: pick.confidenceFlag,
        fightStatus: pick.fightStatus,
    }));
    const netUnitsHundredths = eligiblePicks.reduce(
        (total, pick) => total + (pick.pointsAwarded ?? 0),
        0,
    );
    const netUnits = netUnitsHundredths / 100;
    const roi = eligiblePicks.length > 0
        ? Math.round((netUnits / eligiblePicks.length) * 10000) / 100
        : 0;

    return { eligiblePicksCount: eligiblePicks.length, netUnits, roi };
}

export function applyProgressionRules(input: ProgressionRuleInput) {
    const {
        oldStars,
        oldBadge,
        roi,
        netUnits,
        hasMetPickMinimum,
        validPicksCount,
        requiredPicks,
    } = input;

    let newStars = oldStars;
    let newBadge = oldBadge;
    let reason = '';

    if (netUnits >= -config.ROI_LOSS_TOLERANCE_UNITS && roi <= 0) {
        reason = `Neutral ROI (${validPicksCount}/${requiredPicks} picks, ${netUnits.toFixed(2)}u). No change.`;
    } else if (roi > 0 && hasMetPickMinimum) {
        const starGain = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;

        if (oldStars < config.STAR_CAP) {
            newStars = Math.min(config.STAR_CAP, oldStars + starGain);
            reason = `+${newStars - oldStars} star(s): ${validPicksCount}/${requiredPicks} picks, ${roi}% ROI`;
        } else {
            const currentIdx = Math.max(0, BADGE_TIERS.indexOf(oldBadge));
            const newIdx = Math.min(BADGE_TIERS.length - 1, currentIdx + 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge: ${oldBadge} → ${newBadge} (${validPicksCount}/${requiredPicks} picks, ${roi}% ROI)`;
        }
    } else if (netUnits < -config.ROI_LOSS_TOLERANCE_UNITS) {
        if (oldStars < config.STAR_CAP || (oldStars === config.STAR_CAP && BADGE_TIERS.indexOf(oldBadge) <= 1)) {
            newStars = Math.max(0, oldStars - 1);
            reason = `-1 star: loss exceeded ${config.ROI_LOSS_TOLERANCE_UNITS}u (${netUnits.toFixed(2)}u). Stars: ${oldStars} → ${newStars}`;
        } else {
            const currentIdx = Math.max(1, BADGE_TIERS.indexOf(oldBadge));
            const newIdx = Math.max(1, currentIdx - 1);
            newBadge = BADGE_TIERS[newIdx];
            reason = `Badge regression: ${oldBadge} → ${newBadge} (${netUnits.toFixed(2)}u)`;
        }
    } else {
        reason = `Insufficient picks (${validPicksCount}/${requiredPicks} required). No change.`;
    }

    return { newStars, newBadge, reason };
}

/**
 * Calculate user's star/badge progression PER EVENT (not monthly).
 * Not invoked automatically during event close until per-event progression is replay-safe.
 * 
 * Rules:
 * - Only NONE, GREEN, and YELLOW confidence flag picks count toward ranking/stars
 * - RED flag is excluded from all competitive calculations
 * - Points awarded on ALL picks regardless of flag
 * - ≥70% participation AND positive ROI → +1 star (+2 if ROI > 15%)
 * - Lose 0–1 unit → no change
 * - Lose more than 1 unit → -1 star (min 0)
 * - Max 5 stars
 * - Post-5-star: same rules but advance/regress badge tier
 *   - Tiers: none → ninja → samurai → master → grandmaster → goat
 *   - Regression floor is 'ninja' (never drops back to 'none' once earned)
 * 
 * Cancelled fights are excluded from the participation denominator.
 */
export async function calculateUserProgressionPerEvent(
    userId: string,
    eventId: string,
    database: ProgressionDatabase = db as unknown as ProgressionDatabase,
): Promise<ProgressionResult> {
    // 1. Get user's current state
    const [user] = await database.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error(`User ${userId} not found`);

    const oldStars = user.starLevel ?? 0;
    const oldBadge = (user.progressBadge ?? 'none') as BadgeTier;

    // 2. Get the closed event
    const [closedEvent] = await database.select().from(events)
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
    const allFights = await database.select().from(eventFights)
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
    const userPicksData = await database.select().from(userPicks)
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

    // 5. Use the same stored net-unit score and eligibility policy as rankings.
    const fightMap = new Map(allFights.map(f => [f.id, f]));
    const performance = calculateCanonicalProgressionPerformance(userPicksData.map((pick) => ({
        status: pick.status,
        confidenceFlag: pick.confidenceFlag,
        fightStatus: fightMap.get(pick.fightId)?.status ?? '',
        pointsAwarded: pick.pointsAwarded,
    })));
    const totalProfit = performance.netUnits;
    const roi = performance.roi;

    // 6. Apply progression rules
    const { newStars, newBadge, reason } = applyProgressionRules({
        oldStars,
        oldBadge,
        roi,
        netUnits: totalProfit,
        hasMetPickMinimum,
        validPicksCount,
        requiredPicks,
    });

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
    }, database);

    // 8. Persist changes
    await database.update(users)
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

export async function executeProgressionApplicationWorkflow(
    application: { state: string; result: Record<string, unknown> | null },
    calculate: () => Promise<ProgressionResult>,
    complete: (result: ProgressionResult) => Promise<void>,
) {
    if (application.state === 'completed') {
        if (!application.result) throw new Error('COMPLETED_PROGRESSION_MISSING_RESULT');
        return { applied: false, result: application.result as unknown as ProgressionResult };
    }

    const result = await calculate();
    await complete(result);
    return { applied: true, result };
}

export async function applyUserEventProgressionOnce(userId: string, eventId: string) {
    try {
        return await db.transaction(async (tx) => {
            const [inserted] = await tx.insert(eventProgressionApplications)
                .values({ eventId, userId, state: 'processing', attempts: 1 })
                .onConflictDoNothing({
                    target: [eventProgressionApplications.eventId, eventProgressionApplications.userId],
                })
                .returning({ id: eventProgressionApplications.id });

            const [application] = await tx.select().from(eventProgressionApplications)
                .where(and(
                    eq(eventProgressionApplications.eventId, eventId),
                    eq(eventProgressionApplications.userId, userId),
                ))
                .for('update');

            if (!application) throw new Error('PROGRESSION_APPLICATION_NOT_FOUND');

            if (!inserted && application.state !== 'completed') {
                await tx.update(eventProgressionApplications)
                    .set({
                        state: 'processing',
                        attempts: sql`${eventProgressionApplications.attempts} + 1`,
                        lastError: null,
                        updatedAt: new Date(),
                    })
                    .where(eq(eventProgressionApplications.id, application.id));
            }

            return executeProgressionApplicationWorkflow(
                application,
                () => calculateUserProgressionPerEvent(userId, eventId, tx),
                async (result) => {
                    await tx.update(eventProgressionApplications)
                        .set({
                            state: 'completed',
                            result: result as unknown as Record<string, unknown>,
                            lastError: null,
                            completedAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .where(eq(eventProgressionApplications.id, application.id));
                },
            );
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown progression failure';
        const [failedInserted] = await db.insert(eventProgressionApplications)
            .values({ eventId, userId, state: 'failed', attempts: 1, lastError: message.slice(0, 2000) })
            .onConflictDoNothing({
                target: [eventProgressionApplications.eventId, eventProgressionApplications.userId],
            })
            .returning({ id: eventProgressionApplications.id });
        if (!failedInserted) {
            await db.update(eventProgressionApplications)
                .set({
                    state: 'failed',
                    attempts: sql`${eventProgressionApplications.attempts} + 1`,
                    lastError: message.slice(0, 2000),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(eventProgressionApplications.eventId, eventId),
                    eq(eventProgressionApplications.userId, userId),
                    ne(eventProgressionApplications.state, 'completed'),
                ));
        }
        throw error;
    }
}

/** Replay-safe progression runner. Activation remains separate from event close. */
export async function runEventProgression(eventId: string): Promise<ProgressionResult[]> {
    const [closeRun] = await db.select().from(eventCloseRuns)
        .where(eq(eventCloseRuns.eventId, eventId));
    if (!closeRun?.snapshotCompletedAt) throw new Error('EVENT_SNAPSHOT_NOT_COMPLETE');

    await db.update(eventCloseRuns)
        .set({ progressionState: 'processing', updatedAt: new Date() })
        .where(eq(eventCloseRuns.eventId, eventId));

    const eventFightsList = await db.select({ id: eventFights.id })
        .from(eventFights)
        .where(eq(eventFights.eventId, eventId));
    const fightIds = eventFightsList.map(f => f.id);
    const usersWithPicks = fightIds.length > 0
        ? await db.selectDistinct({ userId: userPicks.userId })
            .from(userPicks)
            .where(and(eq(userPicks.status, 'active'), inArray(userPicks.fightId, fightIds)))
        : [];

    const results: ProgressionResult[] = [];
    const failures: string[] = [];

    for (const userRecord of usersWithPicks) {
        try {
            const application = await applyUserEventProgressionOnce(userRecord.userId, eventId);
            results.push(application.result);

            if (application.applied && (application.result.starsGained > 0 || application.result.badgeGained)) {
                try {
                    const title = application.result.badgeGained ? 'Badge Unlocked!' : 'Your Progression Updated!';
                    const message = application.result.badgeGained
                        ? `Congratulations! You've earned the ${application.result.badgeGained} badge`
                        : `You earned ${application.result.starsGained} stars from the event`;
                    await sendNotificationToUser(userRecord.userId, title, message, {
                        type: 'progression_update',
                        starsGained: application.result.starsGained.toString(),
                        badgeGained: application.result.badgeGained || '',
                        eventId,
                    });
                } catch (notifError) {
                    logger.warn('Failed to send progression notification:', notifError);
                }
            }
        } catch (error) {
            failures.push(userRecord.userId);
            logger.error(`Progression failed for user ${userRecord.userId} on event ${eventId}:`, error);
        }
    }

    if (failures.length > 0) {
        await db.update(eventCloseRuns)
            .set({
                progressionState: 'failed',
                lastError: `Progression failed for ${failures.length} user(s)`,
                updatedAt: new Date(),
            })
            .where(eq(eventCloseRuns.eventId, eventId));
        throw new Error(`EVENT_PROGRESSION_INCOMPLETE:${failures.length}`);
    }

    await db.update(eventCloseRuns)
        .set({ progressionState: 'completed', state: 'completed', lastError: null, updatedAt: new Date() })
        .where(eq(eventCloseRuns.eventId, eventId));
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

    // 5. Use canonical stored net units, matching event snapshots and global totals.
    const fightMap = new Map(allFights.map(f => [f.id, f]));
    const performance = calculateCanonicalProgressionPerformance(userPicksData.map((pick) => ({
        status: pick.status,
        confidenceFlag: pick.confidenceFlag,
        fightStatus: fightMap.get(pick.fightId)?.status ?? '',
        pointsAwarded: pick.pointsAwarded,
    })));
    const totalProfit = performance.netUnits;
    const roi = performance.roi;

    // 6. Apply progression rules (identical to per-event logic)
    const { newStars, newBadge, reason } = applyProgressionRules({
        oldStars,
        oldBadge,
        roi,
        netUnits: totalProfit,
        hasMetPickMinimum,
        validPicksCount,
        requiredPicks,
    });

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
    currentEventResult?: { netUnits: number; qualified: boolean },
    database: ProgressionDatabase = db as unknown as ProgressionDatabase,
): Promise<number> {
    // 1. Get all closed events, ordered by date DESC
    const closedEvents = await database.select()
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
        const performance = await getEventPerformance(userId, event.id, database);
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
async function getEventPerformance(userId: string, eventId: string, database: ProgressionDatabase) {
    const allFights = await database.select().from(eventFights)
        .where(and(
            eq(eventFights.eventId, eventId),
            ne(eventFights.status, 'Cancelled'),
        ));

    const totalAvailableFights = allFights.length;
    if (totalAvailableFights === 0) return { netUnits: 0, qualified: false };

    const fightIds = allFights.map(f => f.id);
    const userPicksData = await database.select().from(userPicks)
        .where(and(
            eq(userPicks.userId, userId),
            inArray(userPicks.fightId, fightIds),
            eq(userPicks.status, 'active'),
            sql`${userPicks.confidenceFlag} IN ('none', 'green', 'yellow')`,
        ));

    const validPicksCount = userPicksData.length;
    const requiredPicks = config.getRequiredPicks(totalAvailableFights);
    const hasMetPickMinimum = validPicksCount >= requiredPicks;

    const fightMap = new Map(allFights.map(f => [f.id, f]));
    const performance = calculateCanonicalProgressionPerformance(userPicksData.map((pick) => ({
        status: pick.status,
        confidenceFlag: pick.confidenceFlag,
        fightStatus: fightMap.get(pick.fightId)?.status ?? '',
        pointsAwarded: pick.pointsAwarded,
    })));

    return { 
        netUnits: performance.netUnits,
        qualified: hasMetPickMinimum && performance.netUnits > 0,
    };
}
