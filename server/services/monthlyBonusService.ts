import { db } from "../db";
import { cashPayouts } from "../../shared/schema";
import { logger } from "../utils/logger";

export type MonthlyBonusCandidate = {
    userId: string;
    username?: string | null;
    tier?: string | null;
    netUnits: number;
    qualifiedEventCount: number;
    earliestFullCardLockAt?: Date | string | null;
};

export type MonthlyBonusWinner = {
    userId: string;
    username?: string | null;
    prizeCents: number;
    reason: "top_roi_1" | "top_roi_2" | "top_roi_3" | "random_qualified";
    netUnits: number;
    qualifiedEventCount: number;
};

export const MONTHLY_BONUS_TOTAL_CENTS = 55000;
export const MONTHLY_BONUS_TOP_ROI_PRIZES = [30000, 10000, 5000] as const;
export const MONTHLY_BONUS_RANDOM_PRIZES = [5000, 5000] as const;

export function isMonthlyBonusEligibleTier(tier?: string | null): boolean {
    return tier === "challenger" || tier === "premium" || tier === "medium";
}

function lockTimeValue(value?: Date | string | null): number {
    if (!value) return Number.MAX_SAFE_INTEGER;
    return new Date(value).getTime();
}

export function selectMonthlyBonusWinners(
    candidates: MonthlyBonusCandidate[],
    random: () => number = Math.random
): MonthlyBonusWinner[] {
    const eligible = candidates.filter((candidate) => isMonthlyBonusEligibleTier(candidate.tier));

    const topRoiCandidates = eligible
        .filter((candidate) => candidate.qualifiedEventCount >= 2)
        .sort((a, b) => {
            if (b.netUnits !== a.netUnits) return b.netUnits - a.netUnits;
            const lockDiff = lockTimeValue(a.earliestFullCardLockAt) - lockTimeValue(b.earliestFullCardLockAt);
            if (lockDiff !== 0) return lockDiff;
            return a.userId.localeCompare(b.userId);
        });

    const winners: MonthlyBonusWinner[] = topRoiCandidates
        .slice(0, MONTHLY_BONUS_TOP_ROI_PRIZES.length)
        .map((candidate, index) => ({
            userId: candidate.userId,
            username: candidate.username,
            prizeCents: MONTHLY_BONUS_TOP_ROI_PRIZES[index],
            reason: `top_roi_${index + 1}` as MonthlyBonusWinner["reason"],
            netUnits: candidate.netUnits,
            qualifiedEventCount: candidate.qualifiedEventCount,
        }));

    const winnerIds = new Set(winners.map((winner) => winner.userId));
    const randomPool = eligible
        .filter((candidate) => candidate.qualifiedEventCount >= 1 && !winnerIds.has(candidate.userId))
        .sort((a, b) => a.userId.localeCompare(b.userId));

    for (const prizeCents of MONTHLY_BONUS_RANDOM_PRIZES) {
        if (randomPool.length === 0) break;

        const index = Math.min(randomPool.length - 1, Math.floor(random() * randomPool.length));
        const [candidate] = randomPool.splice(index, 1);

        winners.push({
            userId: candidate.userId,
            username: candidate.username,
            prizeCents,
            reason: "random_qualified",
            netUnits: candidate.netUnits,
            qualifiedEventCount: candidate.qualifiedEventCount,
        });
    }

    return winners;
}

export function getMonthlyBonusTotal(winners: MonthlyBonusWinner[]): number {
    return winners.reduce((total, winner) => total + winner.prizeCents, 0);
}

/**
 * Records pending manual payouts for a completed monthly bonus draw.
 *
 * Dormant until the staged Week 2 `cash_payouts` migration is approved/applied.
 * The selection logic is pure and covered now; cron/Inngest wiring should happen
 * only after the table exists in production.
 */
export async function recordMonthlyBonusPayouts(
    winners: MonthlyBonusWinner[],
    periodStart: Date,
    periodEnd: Date
) {
    if (winners.length === 0) {
        logger.info("[MonthlyBonus] No winners to record");
        return [];
    }

    const taxYear = periodEnd.getUTCFullYear();
    const values = winners.map((winner) => ({
        userId: winner.userId,
        kind: "monthly_bonus",
        amountCents: winner.prizeCents,
        payoutMethod: "pending",
        status: "pending",
        taxYear,
        notes: `${winner.reason}; period=${periodStart.toISOString()}..${periodEnd.toISOString()}; netUnits=${winner.netUnits}; qualifiedEvents=${winner.qualifiedEventCount}`,
    }));

    const inserted = await db.insert(cashPayouts).values(values).returning();
    logger.info(`[MonthlyBonus] Recorded ${inserted.length} pending payout(s) for ${periodStart.toISOString()}..${periodEnd.toISOString()}`);
    return inserted;
}
