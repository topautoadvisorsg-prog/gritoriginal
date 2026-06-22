import pg from 'pg';
import type { SafeStagingTarget } from './stagingGuard';

export function createStagingPool(target: SafeStagingTarget): pg.Pool {
  return new pg.Pool({
    connectionString: target.connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 1_000,
  });
}

export async function verifyStagingMarker(
  queryable: Pick<pg.Pool, 'query'> | Pick<pg.PoolClient, 'query'>,
  target: SafeStagingTarget,
): Promise<void> {
  const markerTable = await queryable.query<{ table_name: string | null }>(
    `select to_regclass('public.grit_environment_metadata')::text as table_name`,
  );
  if (!markerTable.rows[0]?.table_name) {
    throw new Error('Staging marker table public.grit_environment_metadata is missing.');
  }

  const marker = await queryable.query<{ environment_id: string; environment_kind: string }>(
    `select environment_id, environment_kind
       from public.grit_environment_metadata
      where singleton = true
      limit 1`,
  );
  const row = marker.rows[0];
  if (!row || row.environment_kind !== 'staging' || row.environment_id !== target.environmentId) {
    throw new Error('Staging marker does not match STAGING_ENVIRONMENT_ID or environment_kind=staging.');
  }
}
