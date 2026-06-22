import { describe, expect, it } from 'vitest';
import { createSnapshotIdempotencyKey } from '../../server/services/leaderboardService';
import { automaticSnapshotCreationSchema, snapshotCreationSchema } from '../../shared/models/ranking';

describe('leaderboard snapshot idempotency keys', () => {
  it('uses one stable key per event', () => {
    expect(createSnapshotIdempotencyKey('event', 'event-1')).toBe('event:event-1');
  });

  it('uses the exact period boundaries without assuming timezone policy', () => {
    const start = new Date('2026-05-01T07:00:00.000Z');
    const end = new Date('2026-06-01T06:59:59.999Z');
    expect(createSnapshotIdempotencyKey('monthly', undefined, start, end)).toBe(
      'monthly:2026-05-01T07:00:00.000Z:2026-06-01T06:59:59.999Z',
    );
  });

  it('rejects incomplete scope identity', () => {
    expect(() => createSnapshotIdempotencyKey('event')).toThrow(/eventId/);
    expect(() => createSnapshotIdempotencyKey('yearly')).toThrow(/date range/);
  });

  it('rejects invalid admin snapshot scopes and ranges', () => {
    expect(automaticSnapshotCreationSchema.safeParse({ type: 'event' }).success).toBe(false);
    expect(snapshotCreationSchema.safeParse({
      type: 'monthly',
      startDate: '2026-06-01T00:00:00.000Z',
    }).success).toBe(false);
    expect(snapshotCreationSchema.safeParse({
      type: 'yearly',
      startDate: '2026-12-31T00:00:00.000Z',
      endDate: '2026-01-01T00:00:00.000Z',
    }).success).toBe(false);
    expect(snapshotCreationSchema.safeParse({
      type: 'monthly',
      eventId: '11111111-1111-4111-8111-111111111111',
    }).success).toBe(false);
    expect(snapshotCreationSchema.safeParse({
      type: 'event',
      eventId: '11111111-1111-4111-8111-111111111111',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-02-01T00:00:00.000Z',
    }).success).toBe(false);
  });
});
