# Dashboard and User Statistics Plan

**Current state:** functional zero-state shell with inconsistent event status, snapshot scope, red-pick treatment, and error behavior.

## Dependencies

Do not finalize this pipeline before canonical event statuses and ranking scopes are implemented. Dashboard must consume domain services, not recreate ranking/scoring rules.

## Delivery phases

1. Define typed dashboard response schema and remove `any` from client queries.
2. Select upcoming event using canonical active states and deterministic date/lock order.
3. Select recent event and exact final event snapshot by event ID/type/version.
4. Source net units, rank, qualification, streak, and stats from canonical ranking/performance services.
5. Exclude red/void picks consistently and distinguish provisional from final values.
6. Replace raffle status with an available-feature model; remove disabled reward claims.
7. Add explicit loading, backend-error, empty, stale-data, and partial-service states.
8. Add response caching with user/event keys and invalidation after committed domain events.

## Proof matrix

- New user/no events/no picks.
- Open, live, completed, closed, canceled, and corrected events.
- User absent from ranking, tied ranking, private identity fields.
- Red/void/corrected picks.
- Database/news/ranking partial failure.
- Mobile and desktop response shape compatibility.

## Definition of done

Every displayed number traces to one canonical service/snapshot; event/snapshot IDs match; error states never render blank; contract tests and isolated staging fixtures pass; cache invalidation is demonstrated.

**Complexity:** M. **Production risk:** Medium.
