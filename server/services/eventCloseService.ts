import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { eventCloseRuns, events } from '../../shared/schema';
import { createLeaderboardSnapshot } from './leaderboardService';
import { logger } from '../utils/logger';

export class EventCloseError extends Error {
  constructor(
    message: string,
    public readonly code: 'EVENT_NOT_FOUND' | 'INVALID_EVENT_CLOSE_STATE' | 'SNAPSHOT_PENDING',
    public readonly event?: typeof events.$inferSelect,
  ) {
    super(message);
  }
}

export function canStartOrRetryEventClose(status: string): boolean {
  return status === 'Completed' || status === 'Closed';
}

export async function getEventCloseStatus(eventId: string) {
  const [run] = await db.select().from(eventCloseRuns)
    .where(eq(eventCloseRuns.eventId, eventId));
  return run ?? null;
}

type EventRecord = typeof events.$inferSelect;

export type EventCloseWorkflowDependencies = {
  commitClosedState(eventId: string): Promise<EventRecord>;
  createSnapshot(eventId: string): Promise<{ id: string } | null>;
  markSnapshotComplete(eventId: string): Promise<void>;
  markSnapshotFailed(eventId: string, message: string): Promise<void>;
};

async function commitClosedState(eventId: string): Promise<EventRecord> {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(events)
      .where(eq(events.id, eventId))
      .for('update');

    if (!current) throw new EventCloseError('Event not found', 'EVENT_NOT_FOUND');
    if (!canStartOrRetryEventClose(current.status)) {
      throw new EventCloseError(
        `Event close requires Completed or Closed status, received ${current.status}`,
        'INVALID_EVENT_CLOSE_STATE',
        current,
      );
    }

    const closed = current.status === 'Closed'
      ? current
      : (await tx.update(events)
          .set({ status: 'Closed' })
          .where(eq(events.id, eventId))
          .returning())[0];

    await tx.insert(eventCloseRuns)
      .values({
        eventId,
        state: 'processing',
        progressionState: 'deferred',
        attempts: 1,
        lastError: null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: eventCloseRuns.eventId,
        set: {
          state: 'processing',
          attempts: sql`${eventCloseRuns.attempts} + 1`,
          lastError: null,
          updatedAt: new Date(),
        },
      });

    return closed;
  });
}

async function markSnapshotComplete(eventId: string): Promise<void> {
  await db.update(eventCloseRuns)
    .set({
      state: 'snapshot_complete',
      snapshotCompletedAt: new Date(),
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(eventCloseRuns.eventId, eventId));
}

async function markSnapshotFailed(eventId: string, message: string): Promise<void> {
  await db.update(eventCloseRuns)
    .set({ state: 'failed', lastError: message.slice(0, 2000), updatedAt: new Date() })
    .where(and(
      eq(eventCloseRuns.eventId, eventId),
      isNull(eventCloseRuns.snapshotCompletedAt),
    ));
}

export async function executeEventCloseWorkflow(
  eventId: string,
  dependencies: EventCloseWorkflowDependencies,
) {
  const event = await dependencies.commitClosedState(eventId);

  try {
    const snapshot = await dependencies.createSnapshot(eventId);
    await dependencies.markSnapshotComplete(eventId);

    return {
      event,
      snapshot,
      closeState: 'snapshot_complete' as const,
      progressionState: 'deferred' as const,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown snapshot failure';
    try {
      await dependencies.markSnapshotFailed(eventId, message);
    } catch (markError) {
      logger.error(`[Event Close] Failed to persist snapshot failure for ${eventId}:`, markError);
    }
    throw new EventCloseError(
      'Event is closed but its leaderboard snapshot is pending retry.',
      'SNAPSHOT_PENDING',
      event,
    );
  }
}

export async function closeEventWithSnapshot(eventId: string) {
  return executeEventCloseWorkflow(eventId, {
    commitClosedState,
    createSnapshot: (id) => createLeaderboardSnapshot('event', id),
    markSnapshotComplete,
    markSnapshotFailed,
  });
}
