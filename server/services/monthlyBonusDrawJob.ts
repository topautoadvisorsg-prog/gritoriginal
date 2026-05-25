/**
 * Monthly Bonus Draw Job — wires Cody's pure-logic monthlyBonusService to real DB data.
 *
 * Blueprint §7: $550 pool — $300 / $100 / $50 to top-3 ROI + $50 each to 2 random
 * qualified Challengers.
 *
 * Eligibility (per blueprint):
 *   - ROI race: qualified for 2+ events in the month
 *   - Random draw: qualified for ≥1 event in the month
 *
 * DORMANT BY DEFAULT — guarded in cronService.ts by `MONTHLY_BONUS_DRAW_ENABLED` env
 * because it writes to `cash_payouts`, which only exists after Week 2 migration applies.
 *
 * After founder approves and applies the migration:
 *   1. Add `MONTHLY_BONUS_DRAW_ENABLED=true` to `.env`
 *   2. The cron in cronService.ts step 6 will run on the next 1st-of-month tick
 *   3. Winners get a OneSignal push notification (admin pays manually via PayPal/USDC)
 */
import { db } from '../db';
import { users, userPicks, eventFights, events, leaderboardSnapshots } from '../../shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import {
  selectMonthlyBonusWinners,
  recordMonthlyBonusPayouts,
  getMonthlyBonusTotal,
  type MonthlyBonusCandidate,
} from './monthlyBonusService';
import { config } from '../config/env';

export interface MonthlyBonusDrawResult {
  winners: number;
  totalCents: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Run the monthly bonus draw for the calendar month that just ended.
 * Builds the candidate list from the user/picks/events tables, then delegates
 * winner selection + payout recording to monthlyBonusService (pure functions).
 */
export async function runMonthlyBonusDraw(): Promise<MonthlyBonusDrawResult> {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

  logger.info(`[MonthlyBonus] Draw for ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);

  const candidates = await buildCandidateList(periodStart, periodEnd);
  if (candidates.length === 0) {
    logger.info('[MonthlyBonus] No eligible candidates this month — skipping draw');
    return { winners: 0, totalCents: 0, periodStart, periodEnd };
  }

  const winners = selectMonthlyBonusWinners(candidates);
  if (winners.length === 0) {
    logger.info('[MonthlyBonus] No winners selected (no Challenger-tier candidates)');
    return { winners: 0, totalCents: 0, periodStart, periodEnd };
  }

  const recorded = await recordMonthlyBonusPayouts(winners, periodStart, periodEnd);
  const totalCents = getMonthlyBonusTotal(winners);

  // Fire-and-forget winner notifications (skips gracefully without OneSignal keys).
  notifyWinners(winners).catch(err =>
    logger.warn('[MonthlyBonus] winner notifications failed:', err)
  );

  logger.info(`[MonthlyBonus] Draw complete: ${recorded.length} payout(s) recorded, total $${(totalCents / 100).toFixed(2)}`);

  return {
    winners: recorded.length,
    totalCents,
    periodStart,
    periodEnd,
  };
}

/**
 * Build the candidate list: every user who qualified for at least one event in the period.
 * Each row carries netUnits + qualifiedEventCount + earliestFullCardLockAt (tiebreaker).
 */
async function buildCandidateList(periodStart: Date, periodEnd: Date): Promise<MonthlyBonusCandidate[]> {
  // 1. Find every event closed in the period.
  const closedEvents = await db
    .select({
      id: events.id,
      name: events.name,
      date: events.date,
    })
    .from(events)
    .where(
      and(
        eq(events.status, 'Closed'),
        // Use raw SQL comparison so we match the underlying date column type cleanly.
        sql`${events.date} >= ${periodStart.toISOString().slice(0, 10)}`,
        sql`${events.date} <= ${periodEnd.toISOString().slice(0, 10)}`,
      ),
    );

  if (closedEvents.length === 0) {
    logger.info('[MonthlyBonus] No closed events in period — empty candidate list');
    return [];
  }

  const eventIds = closedEvents.map(e => e.id);

  // 2. Pull all picks across those events with required fields for scoring + qualification.
  const picks = await db
    .select({
      userId: userPicks.userId,
      fightId: userPicks.fightId,
      pickedFighterId: userPicks.pickedFighterId,
      confidenceFlag: userPicks.confidenceFlag,
      pointsAwarded: userPicks.pointsAwarded, // stored as net-unit hundredths
      isLocked: userPicks.isLocked,
      updatedAt: userPicks.updatedAt,
    })
    .from(userPicks)
    .innerJoin(eventFights, eq(userPicks.fightId, eventFights.id))
    .where(inArray(eventFights.eventId, eventIds));

  // 3. Pull fight counts per event for qualification math.
  const fightCounts = await db
    .select({
      eventId: eventFights.eventId,
      total: sql<number>`count(*)::int`,
    })
    .from(eventFights)
    .where(inArray(eventFights.eventId, eventIds))
    .groupBy(eventFights.eventId);

  const totalFightsByEvent = new Map(fightCounts.map(r => [r.eventId, Number(r.total)]));

  // 4. Aggregate per user per event.
  type PerUserEvent = {
    userId: string;
    eventId: string;
    netUnitsHundredths: number;
    competitivePickCount: number;
    earliestLockAt: Date | null;
  };
  const perUserEvent = new Map<string, PerUserEvent>();

  // Map fightId → eventId for quick lookup.
  const fightToEvent = new Map<string, string>();
  const eventFightRows = await db
    .select({ id: eventFights.id, eventId: eventFights.eventId })
    .from(eventFights)
    .where(inArray(eventFights.eventId, eventIds));
  for (const r of eventFightRows) fightToEvent.set(r.id, r.eventId);

  for (const p of picks) {
    const eventId = fightToEvent.get(p.fightId);
    if (!eventId) continue;
    const key = `${p.userId}::${eventId}`;
    let row = perUserEvent.get(key);
    if (!row) {
      row = {
        userId: p.userId,
        eventId,
        netUnitsHundredths: 0,
        competitivePickCount: 0,
        earliestLockAt: null,
      };
      perUserEvent.set(key, row);
    }
    // Red flag picks excluded from net units + qualification per blueprint §5/§7
    if (p.confidenceFlag !== 'red') {
      row.netUnitsHundredths += p.pointsAwarded ?? 0;
      if (p.pickedFighterId) row.competitivePickCount++;
    }
    if (p.isLocked && p.updatedAt) {
      const lockTs = new Date(p.updatedAt);
      if (!row.earliestLockAt || lockTs < row.earliestLockAt) {
        row.earliestLockAt = lockTs;
      }
    }
  }

  // 5. Pull user tier + username for candidate metadata.
  const candidateUserIds = Array.from(new Set(Array.from(perUserEvent.values()).map(r => r.userId)));
  if (candidateUserIds.length === 0) return [];

  const userRows = await db
    .select({ id: users.id, username: users.username, tier: users.tier })
    .from(users)
    .where(inArray(users.id, candidateUserIds));
  const userInfo = new Map(userRows.map(u => [u.id, u]));

  // 6. Collapse per-user-event rows into per-user candidates.
  //    qualifiedEventCount = events where competitivePickCount >= required minimum
  //    netUnits = sum of qualified-event netUnits (red excluded already)
  //    earliestFullCardLockAt = earliest lock across all qualified events for tiebreaker
  const candidatesByUser = new Map<string, MonthlyBonusCandidate>();

  for (const row of perUserEvent.values()) {
    const totalFights = totalFightsByEvent.get(row.eventId) ?? 0;
    const required = config.getRequiredPicks(totalFights);
    const qualified = row.competitivePickCount >= required;
    if (!qualified) continue;

    const u = userInfo.get(row.userId);
    let cand = candidatesByUser.get(row.userId);
    if (!cand) {
      cand = {
        userId: row.userId,
        username: u?.username,
        tier: u?.tier,
        netUnits: 0,
        qualifiedEventCount: 0,
        earliestFullCardLockAt: null,
      };
      candidatesByUser.set(row.userId, cand);
    }
    cand.netUnits += row.netUnitsHundredths / 100; // convert hundredths → units
    cand.qualifiedEventCount++;
    if (row.earliestLockAt) {
      if (
        !cand.earliestFullCardLockAt ||
        new Date(row.earliestLockAt) < new Date(cand.earliestFullCardLockAt as Date)
      ) {
        cand.earliestFullCardLockAt = row.earliestLockAt;
      }
    }
  }

  const result = Array.from(candidatesByUser.values());
  logger.info(`[MonthlyBonus] Built candidate list: ${result.length} qualified user(s)`);
  return result;
}

/**
 * Push a OneSignal notification to each winner.
 * Best-effort: skips gracefully if OneSignal is not configured.
 */
async function notifyWinners(winners: Array<{ userId: string; prizeCents: number }>) {
  const { sendNotificationToUser } = await import('./notificationService');
  for (const w of winners) {
    await sendNotificationToUser(
      w.userId,
      '💰 Monthly Bonus Win',
      `You won this month's bonus ($${(w.prizeCents / 100).toFixed(2)}). Send your PayPal email or crypto wallet (USDC/USDT preferred) to receive payout.`,
      { type: 'monthly_bonus_win', amountCents: w.prizeCents }
    );
  }
}
