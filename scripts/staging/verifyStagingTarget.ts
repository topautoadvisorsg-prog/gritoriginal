import dotenv from 'dotenv';
import { assertSafeStagingTarget } from './stagingGuard';
import { createStagingPool, verifyStagingMarker } from './stagingDatabase';

dotenv.config({ path: process.env.STAGING_ENV_FILE ?? '.env.staging.local' });
// Fill production identity variables for comparison without overriding staging values.
dotenv.config();

const target = assertSafeStagingTarget(process.env);
const pool = createStagingPool(target);

try {
  await verifyStagingMarker(pool, target);
  console.log(`SAFE_STAGING_TARGET ${target.displayTarget} marker=${target.environmentId}`);
} finally {
  await pool.end();
}
