import dotenv from 'dotenv';
import { assertSafeStagingTarget } from './stagingGuard';
import { createStagingPool, verifyStagingMarker } from './stagingDatabase';
import {
  applyRankingTotalReconciliation,
  loadRankingTotalDrift,
} from '../../server/services/rankingReconciliation';

dotenv.config({ path: process.env.STAGING_ENV_FILE ?? '.env.staging.local' });
dotenv.config();

const apply = process.argv.includes('--apply');
if (apply && process.env.ALLOW_RANKING_RECONCILIATION !== '1') {
  throw new Error('ALLOW_RANKING_RECONCILIATION must be exactly "1" with --apply.');
}

const target = assertSafeStagingTarget(process.env);
const pool = createStagingPool(target);

try {
  await verifyStagingMarker(pool, target);
  const before = await loadRankingTotalDrift(pool);
  const absoluteDelta = before.reduce((sum, row) => sum + Math.abs(row.delta), 0);
  console.log(`RANKING_DRIFT target=${target.displayTarget} users=${before.length} absolute_delta=${absoluteDelta}`);

  if (!apply) process.exitCode = before.length > 0 ? 2 : 0;
  if (!apply) {
    // Report mode deliberately exposes no user identifiers.
  } else {
    const client = await pool.connect();
    try {
      await client.query('begin isolation level serializable');
      await verifyStagingMarker(client, target);
      const updated = await applyRankingTotalReconciliation(client);
      const after = await loadRankingTotalDrift(client);
      if (after.length !== 0) {
        throw new Error(`Ranking reconciliation left ${after.length} drifted users; rolling back.`);
      }
      await client.query('commit');
      console.log(`RANKING_RECONCILIATION_APPLIED updated=${updated} remaining_drift=0`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
