import { describe, expect, it, vi } from 'vitest';
import {
  executeProgressionApplicationWorkflow,
  type ProgressionResult,
} from '../../server/services/progressionService';

const result: ProgressionResult = {
  userId: 'user-1',
  participationPct: 75,
  roi: 10,
  oldStars: 1,
  newStars: 2,
  starsGained: 1,
  oldBadge: 'none',
  newBadge: 'none',
  reason: 'Qualified',
};

describe('progression application idempotency', () => {
  it('returns a completed result without recalculating or persisting', async () => {
    const calculate = vi.fn();
    const complete = vi.fn();
    await expect(executeProgressionApplicationWorkflow(
      { state: 'completed', result: result as unknown as Record<string, unknown> },
      calculate,
      complete,
    )).resolves.toEqual({ applied: false, result });
    expect(calculate).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it('calculates before recording completion', async () => {
    const order: string[] = [];
    const applied = await executeProgressionApplicationWorkflow(
      { state: 'processing', result: null },
      vi.fn(async () => { order.push('calculate'); return result; }),
      vi.fn(async () => { order.push('complete'); }),
    );
    expect(order).toEqual(['calculate', 'complete']);
    expect(applied).toEqual({ applied: true, result });
  });

  it('never records completion when calculation fails', async () => {
    const complete = vi.fn();
    await expect(executeProgressionApplicationWorkflow(
      { state: 'processing', result: null },
      vi.fn(async () => { throw new Error('calculation failed'); }),
      complete,
    )).rejects.toThrow('calculation failed');
    expect(complete).not.toHaveBeenCalled();
  });
});
