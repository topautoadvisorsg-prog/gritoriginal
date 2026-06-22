import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { eventFights, userPicks, users, type CreatePickRequest } from '../../shared/schema';
import { config } from '../config/env';

type EventFight = typeof eventFights.$inferSelect;

export class PickPolicyError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'PickPolicyError';
  }
}

function consumesFlag(flag: string | null | undefined): boolean {
  return flag === 'yellow' || flag === 'red';
}

export function validatePickForFight(pick: CreatePickRequest, fight: EventFight): void {
  if (pick.pickedFighterId !== fight.fighter1Id && pick.pickedFighterId !== fight.fighter2Id) {
    throw new PickPolicyError(400, 'Selected fighter does not belong to this fight.');
  }

  if (pick.pickedRound != null && pick.pickedRound > fight.rounds) {
    throw new PickPolicyError(400, `Round must be between 1 and ${fight.rounds}.`);
  }
}

export function projectedFlagUsage(
  eventPicks: Array<{ fightId: string; confidenceFlag: string | null }>,
  fightId: string,
  nextFlag: CreatePickRequest['confidenceFlag'],
): number {
  const otherFlaggedPicks = eventPicks.filter(
    (pick) => pick.fightId !== fightId && consumesFlag(pick.confidenceFlag),
  ).length;
  return otherFlaggedPicks + (consumesFlag(nextFlag) ? 1 : 0);
}

export async function savePick(args: {
  userId: string;
  pick: CreatePickRequest;
  fight: EventFight;
  bypassRestrictions: boolean;
}) {
  const { userId, pick, fight, bypassRestrictions } = args;
  validatePickForFight(pick, fight);

  return db.transaction(async (tx) => {
    // Serialize a user's pick changes so two simultaneous requests cannot both
    // pass the same flag-budget check.
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);

    const [user] = await tx.select().from(users).where(eq(users.id, userId));
    if (!user) throw new PickPolicyError(404, 'User not found.');

    const fights = await tx
      .select({ id: eventFights.id })
      .from(eventFights)
      .where(eq(eventFights.eventId, fight.eventId));
    const fightIds = fights.map((row) => row.id);

    const eventPicks = fightIds.length === 0
      ? []
      : await tx
          .select({
            id: userPicks.id,
            fightId: userPicks.fightId,
            pickedFighterId: userPicks.pickedFighterId,
            confidenceFlag: userPicks.confidenceFlag,
            isLocked: userPicks.isLocked,
          })
          .from(userPicks)
          .where(and(eq(userPicks.userId, userId), inArray(userPicks.fightId, fightIds)));

    const existingPick = eventPicks.find((row) => row.fightId === pick.fightId);
    if (existingPick?.isLocked && !bypassRestrictions) {
      throw new PickPolicyError(423, 'Pick is locked and cannot be modified.');
    }

    const requiredPicks = config.getRequiredPicks(fightIds.length);
    const flagBudget = Math.max(0, fightIds.length - requiredPicks);
    const flagsUsed = projectedFlagUsage(eventPicks, pick.fightId, pick.confidenceFlag);

    if (!bypassRestrictions && flagsUsed > flagBudget) {
      throw new PickPolicyError(
        400,
        `Flag budget exhausted. You can only use ${flagBudget} yellow/red flags for this event.`,
      );
    }

    const odds = fight.odds as { fighter1Odds?: string; fighter2Odds?: string } | null;
    const lockedOdds = pick.pickedFighterId === fight.fighter1Id
      ? odds?.fighter1Odds ?? null
      : odds?.fighter2Odds ?? null;
    const pickedRound = pick.pickedMethod === 'Decision' || pick.pickedMethod === 'DQ'
      ? null
      : pick.pickedRound;

    const values = {
      userId,
      fightId: pick.fightId,
      pickedFighterId: pick.pickedFighterId,
      pickedMethod: pick.pickedMethod,
      pickedRound,
      units: 1,
      confidenceFlag: pick.confidenceFlag,
      lockedOdds,
      updatedAt: new Date(),
    };

    const [savedPick] = existingPick
      ? await tx.update(userPicks).set(values).where(eq(userPicks.id, existingPick.id)).returning()
      : await tx.insert(userPicks).values(values).returning();

    await tx.update(users).set({
      currentEventId: fight.eventId,
      flagBudget,
      yellowRedFlagsUsed: flagsUsed,
      lastFlagResetAt: user.currentEventId === fight.eventId ? user.lastFlagResetAt : new Date(),
    }).where(eq(users.id, userId));

    return { savedPick, previousFighterId: existingPick?.pickedFighterId ?? null };
  });
}

export async function deletePick(args: { userId: string; fight: EventFight }) {
  const { userId, fight } = args;

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);

    const [pick] = await tx.select().from(userPicks).where(and(
      eq(userPicks.userId, userId),
      eq(userPicks.fightId, fight.id),
    ));
    if (!pick) return { deleted: false };
    if (pick.isLocked) throw new PickPolicyError(423, 'Pick is locked and cannot be deleted.');

    await tx.delete(userPicks).where(eq(userPicks.id, pick.id));

    const fights = await tx.select({ id: eventFights.id }).from(eventFights)
      .where(eq(eventFights.eventId, fight.eventId));
    const fightIds = fights.map((row) => row.id);
    const remaining = fightIds.length === 0 ? [] : await tx
      .select({ confidenceFlag: userPicks.confidenceFlag })
      .from(userPicks)
      .where(and(eq(userPicks.userId, userId), inArray(userPicks.fightId, fightIds)));
    const flagBudget = Math.max(0, fightIds.length - config.getRequiredPicks(fightIds.length));
    const flagsUsed = remaining.filter((row) => consumesFlag(row.confidenceFlag)).length;

    await tx.update(users).set({
      currentEventId: fight.eventId,
      flagBudget,
      yellowRedFlagsUsed: flagsUsed,
    }).where(eq(users.id, userId));

    return { deleted: true, previousFighterId: pick.pickedFighterId };
  });
}
