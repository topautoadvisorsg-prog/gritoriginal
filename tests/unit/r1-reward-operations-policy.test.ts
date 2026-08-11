import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  assertRewardOperationsEnabled,
  requireRewardOperationsEnabled,
  rewardOperationsEnabled,
} from '../../server/services/rewardOperationsPolicy';

describe('R1 reward operations policy', () => {
  it('is fail-closed and cannot be enabled by an environment variable', () => {
    process.env.REWARD_OPERATIONS_ENABLED = 'true';
    expect(rewardOperationsEnabled()).toBe(false);
    expect(() => assertRewardOperationsEnabled()).toThrow('REWARD_OPERATIONS_DISABLED');
    delete process.env.REWARD_OPERATIONS_ENABLED;
  });

  it('returns a stable service-unavailable response without continuing', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const next = vi.fn();

    requireRewardOperationsEnabled(
      {} as never,
      { status } as never,
      next,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      code: 'REWARD_OPERATIONS_DISABLED',
      message: 'Prize-bearing reward operations are disabled',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('guards every administrator reward mutation and the scheduled cash draw', () => {
    const routes = readFileSync(
      resolve(process.cwd(), 'server/admin/routes/adminRaffleRoutes.ts'),
      'utf8',
    );
    const cron = readFileSync(
      resolve(process.cwd(), 'server/services/cronService.ts'),
      'utf8',
    );
    const raffleService = readFileSync(
      resolve(process.cwd(), 'server/services/raffleService.ts'),
      'utf8',
    );
    const monthlyBonusService = readFileSync(
      resolve(process.cwd(), 'server/services/monthlyBonusService.ts'),
      'utf8',
    );
    const monthlyBonusJob = readFileSync(
      resolve(process.cwd(), 'server/services/monthlyBonusDrawJob.ts'),
      'utf8',
    );

    expect(routes.match(/requireRewardOperationsEnabled/g)).toHaveLength(4);
    expect(cron).toContain('if (!rewardOperationsEnabled())');
    expect(cron.indexOf('if (!rewardOperationsEnabled())'))
      .toBeLessThan(cron.indexOf("process.env.MONTHLY_BONUS_DRAW_ENABLED !== 'true'"));
    expect(raffleService.match(/assertRewardOperationsEnabled/g)).toHaveLength(4);
    expect(monthlyBonusService.match(/assertRewardOperationsEnabled/g)).toHaveLength(2);
    expect(monthlyBonusJob.match(/assertRewardOperationsEnabled/g)).toHaveLength(2);
  });
});
