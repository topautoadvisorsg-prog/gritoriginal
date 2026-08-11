import type { RequestHandler } from 'express';

/**
 * Prize-bearing mutations remain unavailable until their legal, funding,
 * ledger, idempotency, and reconciliation gates are explicitly approved.
 *
 * This is intentionally not environment-configurable. Re-enabling reward
 * execution requires a reviewed code change instead of a variable toggle.
 */
export function rewardOperationsEnabled(): boolean {
  return false;
}

export function assertRewardOperationsEnabled(): void {
  if (!rewardOperationsEnabled()) {
    throw new Error('REWARD_OPERATIONS_DISABLED');
  }
}

export const requireRewardOperationsEnabled: RequestHandler = (_req, res, next) => {
  if (!rewardOperationsEnabled()) {
    return res.status(503).json({
      code: 'REWARD_OPERATIONS_DISABLED',
      message: 'Prize-bearing reward operations are disabled',
    });
  }

  next();
};
