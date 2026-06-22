import type { PoolClient, QueryResult } from 'pg';

export type RankingDriftRow = {
  userId: string;
  cachedTotal: number;
  canonicalTotal: number;
  delta: number;
};

type Queryable = {
  query<T extends Record<string, unknown>>(text: string): Promise<QueryResult<T>>;
};

const canonicalTotalsCte = `
  with canonical_totals as (
    select up.user_id, coalesce(sum(up.points_awarded), 0)::integer as total
      from user_picks up
      join event_fights ef on up.fight_id = ef.id::text
     where up.status = 'active'
       and up.confidence_flag <> 'red'
       and ef.status = 'Completed'
     group by up.user_id
  )`;

export async function loadRankingTotalDrift(queryable: Queryable): Promise<RankingDriftRow[]> {
  const result = await queryable.query<{
    user_id: string;
    cached_total: number;
    canonical_total: number;
    delta: number;
  }>(`${canonicalTotalsCte}
    select u.id as user_id,
           u.total_points::integer as cached_total,
           coalesce(ct.total, 0)::integer as canonical_total,
           (coalesce(ct.total, 0) - u.total_points)::integer as delta
      from users u
      left join canonical_totals ct on ct.user_id = u.id
     where u.total_points is distinct from coalesce(ct.total, 0)
     order by abs(coalesce(ct.total, 0) - u.total_points) desc, u.id`);

  return result.rows.map((row) => ({
    userId: row.user_id,
    cachedTotal: Number(row.cached_total),
    canonicalTotal: Number(row.canonical_total),
    delta: Number(row.delta),
  }));
}

export async function applyRankingTotalReconciliation(client: PoolClient): Promise<number> {
  const result = await client.query(`${canonicalTotalsCte},
    targets as (
      select u.id, coalesce(ct.total, 0)::integer as canonical_total
        from users u
        left join canonical_totals ct on ct.user_id = u.id
       where u.total_points is distinct from coalesce(ct.total, 0)
    )
    update users u
       set total_points = targets.canonical_total,
           updated_at = now()
      from targets
     where u.id = targets.id`);
  return result.rowCount ?? 0;
}
