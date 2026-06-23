import { db } from "../db";
import {
    users,
    userPicks,
    fightResults,
    eventFights,
    events,
    fighters,
    fightHistory,
    userKeys,
    badgeAudit,
} from "../../shared/schema";
import { eq, and, sql, inArray, ne, gt } from "drizzle-orm";
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { v4 as uuidv4 } from "uuid";
import { sendNotificationToUser } from './notificationService';
import { calculateProfit, formatProfit } from '../roiCalculator';
import { canonicalRankingEligibilityConditions } from './rankingEligibility';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface FightResultPayload {
    winnerId: string | null;
    method?: string | null;
    methodDetail?: string | null;
    round?: number | null;
    time?: string | null;
    referee?: string | null;
    stats?: {
        fighter1Stats?: Record<string, unknown> | null;
        fighter2Stats?: Record<string, unknown> | null;
    } | null;
}

interface FighterRecord {
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
}

type FighterPerformance = Record<string, number>;

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function fighterRecord(value: unknown): FighterRecord {
    const record = asRecord(value);
    return {
        wins: asNumber(record.wins),
        losses: asNumber(record.losses),
        draws: asNumber(record.draws),
        noContests: asNumber(record.noContests),
    };
}

function fighterPerformance(value: unknown): FighterPerformance {
    const source = asRecord(value);
    return Object.fromEntries(
        Object.entries(source).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    );
}

// ──────────────────────────────────────
// Scoring Functions
// ──────────────────────────────────────

export function calculateNetUnits(
    pick: { pickedFighterId: string; lockedOdds?: string | null; units?: number | null },
    result: { winnerId: string | null }
): number {
    if (!result.winnerId || result.winnerId === 'draw' || result.winnerId === 'no_contest') {
        return 0;
    }

    const units = pick.units || 1;
    if (pick.pickedFighterId !== result.winnerId) {
        return -units;
    }

    return Math.round(calculateProfit(pick.lockedOdds || '+100', units) * 100) / 100;
}

export function calculateNetUnitScore(
    pick: { pickedFighterId: string; lockedOdds?: string | null; units?: number | null },
    result: { winnerId: string | null }
): number {
    return Math.round(calculateNetUnits(pick, result) * 100);
}

/** @deprecated Use calculateNetUnitScore. Kept for old scripts/tests during the rewrite. */
export function calculatePoints(
    pick: { pickedFighterId: string; lockedOdds?: string | null; units?: number | null },
    result: { winnerId: string | null }
): number {
    return calculateNetUnitScore(pick, result);
}

/**
 * Normalize method names for comparison.
 */
export function normalizeMethod(method: string): string {
    const lower = method.toLowerCase();
    if (lower.includes('ko') || lower.includes('tko')) return 'ko/tko';
    if (lower.includes('sub')) return 'submission';
    if (lower.includes('dec') || lower.includes('unanimous') || lower.includes('split') || lower.includes('majority')) return 'decision';
    return lower;
}

// ──────────────────────────────────────
// Fight Result Finalization
// ──────────────────────────────────────

/**
 * Finalize a fight result — the core "money function" of the platform.
 * This runs in a transaction and handles:
 *   1. Creating/updating the fight result record
 *   2. Calculating and awarding points for all user picks
 *   3. Recalculating total user points
 *   4. Creating fight history records for both fighters
 *   5. Updating fighter win/loss/draw records and performance stats
 *
 * Should only be called from admin-protected routes.
 */
export async function finalizeFightResult(fightId: string, resultData: FightResultPayload) {
    return db.transaction(async (tx) => {
        // Validate the fight exists
        const [fight] = await tx
            .select()
            .from(eventFights)
            .where(eq(eventFights.id, fightId));

        if (!fight) {
            throw new Error('FIGHT_NOT_FOUND');
        }

        const eventId = fight.eventId;

        // Create or update fight result
        const [existingResult] = await tx
            .select()
            .from(fightResults)
            .where(eq(fightResults.fightId, fightId));

        let fightResult;
        if (existingResult) {
            // Re-finalization is explicitly hard-blocked for integrity
            throw new Error('FIGHT_ALREADY_FINALIZED');
        } else {
            [fightResult] = await tx
                .insert(fightResults)
                .values({
                    ...resultData,
                    fightId,
                    completedAt: new Date(),
                })
                .returning();
        }

        // Update event_fights status
        await tx
            .update(eventFights)
            .set({ status: 'Completed' })
            .where(eq(eventFights.id, fightId));

        // Calculate and update net-unit scores for all picks on this fight
        const picks = await tx
            .select()
            .from(userPicks)
            .where(eq(userPicks.fightId, fightId));

        logger.debug(`[Fight Result] Processing ${picks.length} picks for fight ${fightId}`);
        logger.debug(`[Fight Result] Fight result: winnerId=${fightResult.winnerId}, method=${fightResult.method}, round=${fightResult.round}`);

        for (const pick of picks) {
            logger.debug(`[Fight Result] Pick: userId=${pick.userId}, pickedFighterId=${pick.pickedFighterId}, odds=${pick.lockedOdds}, units=${pick.units}`);

            const netUnitScore = calculateNetUnitScore(
                {
                    pickedFighterId: pick.pickedFighterId,
                    lockedOdds: pick.lockedOdds,
                    units: pick.units,
                },
                {
                    winnerId: fightResult.winnerId,
                }
            );
            const netUnits = netUnitScore / 100;

            logger.debug(`[Fight Result] Calculated net units: ${formatProfit(netUnits)} (${netUnitScore}) for user ${pick.userId}`);

            // Update pick with net-unit score. Legacy column stores hundredths until schema is renamed.
            await tx
                .update(userPicks)
                .set({
                    pointsAwarded: netUnitScore,
                    isLocked: true,
                    updatedAt: new Date(),
                })
                .where(eq(userPicks.id, pick.id));
            pick.pointsAwarded = netUnitScore;

            logger.debug(`[Fight Result] Updated pick ${pick.id} with ${netUnitScore} net-unit score`);
            
            // Send notification to user about their pick result
            if (netUnitScore > 0) {
                try {
                    const [userPick] = await tx.select().from(userPicks).where(eq(userPicks.id, pick.id));
                    const [pickedFighter] = await tx.select().from(fighters).where(eq(fighters.id, userPick.pickedFighterId));
                    
                    await sendNotificationToUser(pick.userId, '✅ Correct Pick!', 
                        `Your pick ${pickedFighter.firstName} ${pickedFighter.lastName} earned ${formatProfit(netUnits)}`, {
                            type: 'fight_result',
                            fightId: fightId,
                            netUnits: formatProfit(netUnits),
                            netUnitScore: netUnitScore.toString(),
                            correct: 'true'
                        });
                } catch (notifError) {
                    logger.warn('Failed to send fight result notification:', notifError);
                }
            }
        }

        // Recalculate total points and streaks for all affected users
        const affectedUserIds = [...new Set(picks.map(p => p.userId))];
        for (const userId of affectedUserIds) {
            // Find the specific pick for this user on this fight to determine streak impact
            const userPickOnThisFight = picks.find(p => p.userId === userId);
            const earnedNetUnitScore = userPickOnThisFight?.pointsAwarded || 0;
            const isCorrect = earnedNetUnitScore > 0;

            // Fetch current user data for streak logic
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            if (!user) continue;

            const currentStreak = user.currentStreak || 0;
            const maxStreak = user.maxStreak || 0;
            
            const newStreak = isCorrect ? currentStreak + 1 : 0;
            const newMaxStreak = Math.max(maxStreak, newStreak);

            const userPicksResult = await tx
                .select({ totalPoints: sql<number>`COALESCE(SUM(${userPicks.pointsAwarded}), 0)` })
                .from(userPicks)
                .innerJoin(eventFights, sql`${userPicks.fightId} = ${eventFights.id}::text`)
                .where(and(
                    eq(userPicks.userId, userId),
                    ...canonicalRankingEligibilityConditions(),
                ));

            const totalPoints = Number(userPicksResult[0]?.totalPoints || 0);

            await tx
                .update(users)
                .set({ 
                    totalPoints, 
                    currentStreak: newStreak,
                    maxStreak: newMaxStreak,
                    updatedAt: new Date() 
                })
                .where(eq(users.id, userId));

            // NEW: Clean Sweep Detection
            await checkEventCleanSweep(tx, eventId, userId);
        }

        // Get event data for fight history
        const [eventData] = await tx.select().from(events).where(eq(events.id, fight.eventId));

        // Get both fighters
        const [fighter1Data] = await tx.select().from(fighters).where(eq(fighters.id, fight.fighter1Id));
        const [fighter2Data] = await tx.select().from(fighters).where(eq(fighters.id, fight.fighter2Id));

        const isDrawOrNC = !fightResult.winnerId || fightResult.winnerId === 'draw' || fightResult.winnerId === 'no_contest';
        const method = normalizeMethod(fightResult.method || '');
        const now = new Date();
        const loserId = !isDrawOrNC ? (fightResult.winnerId === fight.fighter1Id ? fight.fighter2Id : fight.fighter1Id) : null;

        // Determine results for each fighter
        let fighter1Result: string;
        let fighter2Result: string;
        if (isDrawOrNC) {
            fighter1Result = fightResult.winnerId === 'draw' ? 'DRAW' : 'NC';
            fighter2Result = fighter1Result;
        } else {
            fighter1Result = fightResult.winnerId === fight.fighter1Id ? 'WIN' : 'LOSS';
            fighter2Result = fightResult.winnerId === fight.fighter2Id ? 'WIN' : 'LOSS';
        }

        // Update eventFights with result details
        await tx.update(eventFights).set({
            method: fightResult.method,
            roundEnd: fightResult.round,
            timeEnd: fightResult.time,
            referee: fightResult.referee,
            winnerId: isDrawOrNC ? null : fightResult.winnerId,
            fighter1Result,
            fighter2Result,
        }).where(eq(eventFights.id, fightId));

        // Create fight history records for BOTH fighters
        const baseFightData = {
            eventId: fight.eventId,
            eventName: eventData?.name || 'Unknown Event',
            eventDate: eventData?.date || now,
            eventPromotion: eventData?.organization || 'UFC',
            weightClass: fight.weightClass,
            fightType: fight.cardPlacement || 'Main Card',
            billing: fight.cardPlacement,
            boutOrder: fight.boutOrder,
            roundsScheduled: fight.rounds,
            location: { city: eventData?.city || '', country: eventData?.country || '', venue: eventData?.venue || '' },
            method: fightResult.method || '',
            methodDetail: fightResult.methodDetail || '',
            round: fightResult.round || 1,
            time: fightResult.time || '0:00',
            fightDurationSeconds: 0,
            titleFight: fight.isTitleFight || false,
            referee: fightResult.referee || '',
            isLocked: true,
            stats: fightResult.stats?.fighter1Stats || null,
        };

        // Fighter 1 fight history
        // Check by fighterId + eventId to avoid re-insertion (id is DB-generated uuid)
        const existingFH1 = await tx.select({ id: fightHistory.id })
            .from(fightHistory)
            .where(and(eq(fightHistory.fighterId, fight.fighter1Id), eq(fightHistory.eventId, fight.eventId)));
        if (existingFH1.length === 0) {
            await tx.insert(fightHistory).values({
                fighterId: fight.fighter1Id,
                fighterName: fighter1Data ? `${fighter1Data.firstName} ${fighter1Data.lastName}` : '',
                fighterNickname: fighter1Data?.nickname || '',
                opponentId: fight.fighter2Id,
                opponentName: fighter2Data ? `${fighter2Data.firstName} ${fighter2Data.lastName}` : '',
                opponentNickname: fighter2Data?.nickname || '',
                result: fighter1Result,
                ...baseFightData,
                stats: fightResult.stats?.fighter1Stats || null,
            });
        }

        // Fighter 2 fight history
        const existingFH2 = await tx.select({ id: fightHistory.id })
            .from(fightHistory)
            .where(and(eq(fightHistory.fighterId, fight.fighter2Id), eq(fightHistory.eventId, fight.eventId)));
        if (existingFH2.length === 0) {
            await tx.insert(fightHistory).values({
                fighterId: fight.fighter2Id,
                fighterName: fighter2Data ? `${fighter2Data.firstName} ${fighter2Data.lastName}` : '',
                fighterNickname: fighter2Data?.nickname || '',
                opponentId: fight.fighter1Id,
                opponentName: fighter1Data ? `${fighter1Data.firstName} ${fighter1Data.lastName}` : '',
                opponentNickname: fighter1Data?.nickname || '',
                result: fighter2Result,
                ...baseFightData,
                stats: fightResult.stats?.fighter2Stats || null,
            });
        }

        logger.debug(`[Fight Result] Created fight history records for both fighters`);

        // Update fighter records AND performance stats
        if (!isDrawOrNC && fightResult.winnerId) {
            const [winner] = await tx.select().from(fighters).where(eq(fighters.id, fightResult.winnerId));
            const [loser] = loserId ? await tx.select().from(fighters).where(eq(fighters.id, loserId)) : [null];

            logger.debug(`[Fight Result] Updating fighter records: winner=${fightResult.winnerId}, loser=${loserId}`);

            if (winner) {
                const winnerRecord = fighterRecord(winner.record);
                winnerRecord.wins = (winnerRecord.wins || 0) + 1;

                const winnerPerf = fighterPerformance(winner.performance);
                if (method === 'ko/tko') {
                    winnerPerf.ko_wins = (winnerPerf.ko_wins || 0) + 1;
                } else if (method === 'submission') {
                    winnerPerf.submission_wins = (winnerPerf.submission_wins || 0) + 1;
                } else if (method === 'decision') {
                    winnerPerf.decision_wins = (winnerPerf.decision_wins || 0) + 1;
                }
                winnerPerf.win_streak = (winnerPerf.win_streak || 0) + 1;
                winnerPerf.loss_streak = 0;
                if ((winnerPerf.win_streak || 0) > (winnerPerf.longest_win_streak || 0)) {
                    winnerPerf.longest_win_streak = winnerPerf.win_streak;
                }

                await tx.update(fighters).set({
                    record: winnerRecord,
                    performance: winnerPerf,
                    wins: (winner.wins || 0) + 1,
                    lastUpdated: now
                }).where(eq(fighters.id, fightResult.winnerId));
            }

            if (loser && loserId) {
                const loserRecord = fighterRecord(loser.record);
                loserRecord.losses = (loserRecord.losses || 0) + 1;

                const loserPerf = fighterPerformance(loser.performance);
                if (method === 'ko/tko') {
                    loserPerf.losses_by_ko = (loserPerf.losses_by_ko || 0) + 1;
                } else if (method === 'submission') {
                    loserPerf.losses_by_submission = (loserPerf.losses_by_submission || 0) + 1;
                } else if (method === 'decision') {
                    loserPerf.losses_by_decision = (loserPerf.losses_by_decision || 0) + 1;
                }
                loserPerf.loss_streak = (loserPerf.loss_streak || 0) + 1;
                loserPerf.win_streak = 0;

                await tx.update(fighters).set({
                    record: loserRecord,
                    performance: loserPerf,
                    losses: (loser.losses || 0) + 1,
                    lastUpdated: now
                }).where(eq(fighters.id, loserId));
            }
        } else if (fightResult.winnerId === 'draw') {
            logger.debug(`[Fight Result] Draw - updating both fighters with draw record`);

            if (fighter1Data) {
                const record = fighterRecord(fighter1Data.record);
                record.draws = (record.draws || 0) + 1;
                await tx.update(fighters).set({
                    record,
                    draws: (fighter1Data.draws || 0) + 1,
                    lastUpdated: now
                }).where(eq(fighters.id, fight.fighter1Id));
            }

            if (fighter2Data) {
                const record = fighterRecord(fighter2Data.record);
                record.draws = (record.draws || 0) + 1;
                await tx.update(fighters).set({
                    record,
                    draws: (fighter2Data.draws || 0) + 1,
                    lastUpdated: now
                }).where(eq(fighters.id, fight.fighter2Id));
            }
        }

        return fightResult;
    }); // end transaction
}

/**
 * Check if a user has achieved a "Clean Sweep" for an event.
 * Award a Key if 100% accuracy achieved.
 * Unlock "Ultra Badge" if 5 Keys collected.
 */
async function checkEventCleanSweep(tx: DbTransaction, eventId: string, userId: string) {
    logger.debug(`[Clean Sweep] Checking sweep for user ${userId} on event ${eventId}`);

    // 1. Get total non-cancelled fights in event
    const eventFightsData = await tx.select({ count: sql<number>`count(*)` })
        .from(eventFights)
        .where(and(
            eq(eventFights.eventId, eventId),
            ne(eventFights.status, 'Cancelled')
        ));

    const totalFights = Number(eventFightsData[0]?.count || 0);
    if (totalFights === 0) return;

    // 2. Count user's correct no-flag/green picks (score > 0 means fighter guess was right)
    // We only care about picks for this event's fights.
    // NOTE: user_picks.fight_id is varchar; event_fights.id is uuid — cast required.
    const userCorrectPicksData = await tx.select({ count: sql<number>`count(*)` })
        .from(userPicks)
        .innerJoin(eventFights, sql`${userPicks.fightId}::uuid = ${eventFights.id}`)
        .where(and(
            eq(eventFights.eventId, eventId),
            eq(userPicks.userId, userId),
            gt(userPicks.pointsAwarded, 0),
            sql`${userPicks.confidenceFlag} IN ('none', 'green')`
        ));

    const correctPicksCount = Number(userCorrectPicksData[0]?.count || 0);

    logger.debug(`[Clean Sweep] User ${userId}: ${correctPicksCount}/${totalFights} correct`);

    if (correctPicksCount === totalFights) {
        // ACHIEVED CLEAN SWEEP!

        // 3. Award Key (Unique constraint on userId, eventId handles idempotency)
        try {
            await tx.insert(userKeys).values({
                id: uuidv4(),
                userId,
                eventId,
                awardedAt: new Date()
            }).onConflictDoNothing();

            logger.info(`[Clean Sweep] KEY AWARDED to user ${userId} for event ${eventId}`);

            // Send notification to user
            try {
                await sendNotificationToUser(userId, '🔑 CLEAN SWEEP KEY AWARDED!', 
                    `Perfect ${correctPicksCount}/${totalFights} performance! You've earned a Clean Sweep Key.`, {
                        type: 'clean_sweep',
                        eventId: eventId,
                        correctPicks: correctPicksCount.toString(),
                        totalFights: totalFights.toString()
                    });
            } catch (notifError) {
                logger.warn('Failed to send clean sweep notification:', notifError);
            }

            // 4. Check for Ultra Badge milestone (5 Keys)
            const userKeysData = await tx.select({ count: sql<number>`count(*)` })
                .from(userKeys)
                .where(eq(userKeys.userId, userId));

            const totalKeys = Number(userKeysData[0]?.count || 0);

            if (totalKeys === 5) {
                // Milestone reached!
                // Check if already awarded to prevent duplicate logs (though audit is fine)
                const [existingAudit] = await tx.select()
                    .from(badgeAudit)
                    .where(and(
                        eq(badgeAudit.userId, userId),
                        eq(badgeAudit.badgeType, 'ultra_badge')
                    ));

                if (!existingAudit) {
                    await tx.insert(badgeAudit).values({
                        id: uuidv4(),
                        userId,
                        badgeType: 'ultra_badge',
                        triggerEventId: eventId,
                        triggeredAt: new Date()
                    });

                    // Update user progressBadge to 'ultra' or similar if we decide to use it
                    await tx.update(users)
                        .set({ progressBadge: 'ultra', updatedAt: new Date() })
                        .where(eq(users.id, userId));

                    logger.info(`[Milestone] ULTRA BADGE UNLOCKED for user ${userId}`);
                }
            }
        } catch (err) {
            // Handle unique constraint violation gracefully just in case logic fails
            logger.debug(`[Clean Sweep] Key already exists or error: ${err}`);
        }
    }
}
