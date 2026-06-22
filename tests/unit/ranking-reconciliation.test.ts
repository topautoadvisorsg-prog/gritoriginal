import { describe, expect, it, vi } from 'vitest';
import {
  applyRankingTotalReconciliation,
  loadRankingTotalDrift,
} from '../../server/services/rankingReconciliation';

describe('ranking total reconciliation', () => {
  it('maps canonical-versus-cache drift and uses the shared eligibility rules', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ user_id: 'user-1', cached_total: 500, canonical_total: 250, delta: -250 }],
      rowCount: 1,
    });

    await expect(loadRankingTotalDrift({ query } as never)).resolves.toEqual([{
      userId: 'user-1',
      cachedTotal: 500,
      canonicalTotal: 250,
      delta: -250,
    }]);

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain("up.status = 'active'");
    expect(sql).toContain("up.confidence_flag <> 'red'");
    expect(sql).toContain("ef.status = 'Completed'");
  });

  it('reports exactly how many cached totals were updated', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 3 });
    await expect(applyRankingTotalReconciliation({ query } as never)).resolves.toBe(3);

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('update users u');
    expect(sql).toContain('total_points = targets.canonical_total');
    expect(sql).toContain('where u.total_points is distinct from coalesce(ct.total, 0)');
  });
});
