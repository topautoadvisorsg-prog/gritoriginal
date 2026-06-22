import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { leaderboardSnapshots } from '../../shared/models/auth';

export async function getLatestEventLeaderboardSnapshot(eventId: string) {
  const [snapshot] = await db.select()
    .from(leaderboardSnapshots)
    .where(and(
      eq(leaderboardSnapshots.eventId, eventId),
      eq(leaderboardSnapshots.snapshotType, 'event'),
    ))
    .orderBy(
      desc(leaderboardSnapshots.snapshotDate),
      desc(leaderboardSnapshots.createdAt),
      desc(leaderboardSnapshots.id),
    )
    .limit(1);

  return snapshot ?? null;
}
