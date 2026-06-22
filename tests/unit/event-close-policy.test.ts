import { describe, expect, it, vi } from 'vitest';
import {
  canStartOrRetryEventClose,
  EventCloseError,
  executeEventCloseWorkflow,
} from '../../server/services/eventCloseService';

describe('event close orchestration policy', () => {
  it.each(['Completed', 'Closed'])('allows close processing from %s', (status) => {
    expect(canStartOrRetryEventClose(status)).toBe(true);
  });

  it.each(['Upcoming', 'Live', 'Archived', 'Cancelled', 'Postponed', 'draft', 'ready'])(
    'rejects close processing from %s',
    (status) => expect(canStartOrRetryEventClose(status)).toBe(false),
  );

  it('commits Closed before creating and recording the snapshot', async () => {
    const order: string[] = [];
    const event = { id: 'event-1', status: 'Closed' } as never;
    const result = await executeEventCloseWorkflow('event-1', {
      commitClosedState: vi.fn(async () => { order.push('commit'); return event; }),
      createSnapshot: vi.fn(async () => { order.push('snapshot'); return { id: 'snapshot-1' }; }),
      markSnapshotComplete: vi.fn(async () => { order.push('complete'); }),
      markSnapshotFailed: vi.fn(async () => { order.push('failed'); }),
    });

    expect(order).toEqual(['commit', 'snapshot', 'complete']);
    expect(result).toMatchObject({ closeState: 'snapshot_complete', progressionState: 'deferred' });
  });

  it('records a retryable failure after the Closed commit', async () => {
    const order: string[] = [];
    const event = { id: 'event-1', status: 'Closed' } as never;
    await expect(executeEventCloseWorkflow('event-1', {
      commitClosedState: vi.fn(async () => { order.push('commit'); return event; }),
      createSnapshot: vi.fn(async () => { order.push('snapshot'); throw new Error('database unavailable'); }),
      markSnapshotComplete: vi.fn(async () => { order.push('complete'); }),
      markSnapshotFailed: vi.fn(async () => { order.push('failed'); }),
    })).rejects.toMatchObject<EventCloseError>({ code: 'SNAPSHOT_PENDING', event });

    expect(order).toEqual(['commit', 'snapshot', 'failed']);
  });
});
