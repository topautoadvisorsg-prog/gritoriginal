# Rankings Pipeline Audit

**Audit date:** June 21, 2026
**State:** audit complete; R0 remediation implemented in code, unproven in staging.
**Writes performed:** none.

**Latest read-only production review:** zero event rows, zero duplicate snapshot
scopes, and zero malformed pick fight IDs. This is an empty-state observation, not
database proof of the remediated lifecycle.

## Scope traced

```text
pick persistence
  -> fight result finalization
  -> pointsAwarded (net-unit hundredths)
  -> users.totalPoints cache
  -> global leaderboard
  -> event/month/year snapshots
  -> dashboard, progression, creator-performance dependencies
```

Reviewed runtime paths include scoring, leaderboard/snapshot services and routes, event close, progression, dashboard consumers, schemas, UI adapters, and existing tests.

## Current implementations

| Component | Exists | Current source |
|---|---|---|
| Odds-based fight scoring | Yes | `scoringService.calculateNetUnitScore` |
| Lifetime global ranking | Yes | Mutable `users.totalPoints` cache |
| Event snapshot | Yes | Active, non-red picks on completed fights |
| Monthly/yearly snapshot | Yes | Active, non-red completed-fight picks grouped by event date window |
| Country ranking | Yes | Global cache filtered by exact country string |
| Event leaderboard endpoint | Partial | Reads a stored event snapshot |
| Tie policy | No | Sequential array index |
| Provisional versus final distinction | No | Different sources are presented without an explicit authority contract |
| Rebuild/reconciliation | No canonical operation | Totals and snapshots can drift |

## Blocking findings

### R0: event lifecycle validation contradicts event lifecycle code

`PUT /api/admin/events/:id/status` is guarded by `updateEventStatusSchema`, which accepts only `draft` or `ready`. The handler's transition table expects `Upcoming`, `Live`, `Completed`, `Closed`, `Archived`, `Postponed`, and `Cancelled`. The normal `Closed` path creates the event snapshot and progression before updating the event.

Impact: validated API requests cannot express the states that trigger locking, final snapshots, and progression. This must be unified before ranking tests can prove the real lifecycle.

**Remediation evidence:** the API, admin lifecycle UI, data-engine ingress, schema
default, migration, and transition tests now share the canonical lifecycle. Legacy
`draft/ready` rows remain intentionally accepted by the database until a reviewed
migration classifies them; legacy `ready` cannot enter the side-effecting lifecycle
endpoint. The migration has not run in staging or production, so R0 is not
marked verified complete.

### R0: global totals include records excluded by snapshots

At audit time, fight finalization rebuilt `users.totalPoints` with `SUM(points_awarded)` over every pick for the user, without filtering `status='active'` or excluding `confidence_flag='red'`. Snapshot calculation did both.

Impact: Global All-Time can disagree with event/month/year rankings and can count off-record or voided results.

**Remediation evidence:** `canonicalRankingEligibilityConditions` now defines active,
non-red picks on completed fights and is consumed by snapshot queries and future
`users.totalPoints` rebuilds during fight finalization. A staging-only report/apply
command now runs behind the environment marker and two explicit write gates, verifies
zero post-update drift, and rolls back on mismatch. It has not run against a staging
database; legacy-unit/qualification policy is unresolved, so R1 remains open.

### R1: requested event scope is ignored

`GET /api/leaderboard` reads `eventId` but does not apply it. Callers asking for an event receive global lifetime totals unless they use the separate snapshot endpoint.

**Remediation evidence:** the global route now rejects `eventId` with an explicit
event-route contract. Event IDs and period snapshot types are validated, and event
reads use one deterministic event/type/date read service. HTTP contract tests pass;
staging/browser proof remains pending.

### R1: snapshots are not idempotent or deterministically read

Snapshot creation always inserts a new row and has no unique event/type/version constraint or close-run idempotency key. `GET /api/leaderboard/event/:eventId` has no ordering and returns the first matching row. Repeated close/admin snapshot operations can therefore create ambiguous canonical results and duplicate rank-change notifications.

**Remediation evidence:** new snapshot writes carry a nullable-backward-compatible,
unique scope key. Concurrent/replayed writes reuse the existing row and skip duplicate
notifications; event and prior-snapshot reads have deterministic timestamp ordering.
Admin inputs are schema-validated. Migration execution, legacy duplicate cleanup,
and correction/version policy remain pending, so R4 is only partially remediated.

### R1: event close is not atomic

The close handler creates a snapshot, attempts a raffle draw, runs progression, and only then updates the event to `Closed`. Failure can leave ranking/progression side effects on an event that remains `Completed`; retry can duplicate snapshots.

**Remediation evidence:** close now commits `Closed` and a durable `event_close_runs`
record in one transaction, then creates the idempotent snapshot. Failures persist a
retryable state, and an admin retry endpoint replays the snapshot phase. Raffle was
removed from close. Progression is marked `deferred` and is not executed until its
per-user effects become replay-safe. Migration and concurrency proof remain pending,
so R2 is partially remediated rather than complete.

### R1: ties have no defined product rule

Equal net units receive different sequential ranks. Global gold-badge logic marks every user tied at the maximum while their displayed ranks differ. Competition ranking (`1,2,2,4`) and dense ranking (`1,2,2,3`) have different downstream rewards and UI effects; founder/product must explicitly choose.

## High-risk consistency gaps

- Legacy `pointsAwarded`/`totalPoints` names store net-unit hundredths and invite incorrect reuse.
- Existing historical picks may contain 1-5 units; new picks are fixed at one. A migration/reconciliation policy is required before mixing histories.
- Global leaderboard includes users regardless of qualification; snapshots include anyone with an eligible scored pick. Eligibility policy is not centralized.
- Monthly/yearly periods use event date, not close/result timestamp; boundary policy is undocumented.
- Dashboard selects the newest snapshot without restricting type/event and reuses it for recent rank.
- Progression recalculates ROI independently from snapshot totals, preserving a second ranking-like calculation.
- Country strings are not canonicalized, so equivalent country representations can split rankings.
- Snapshot JSON embeds username/streak at creation; later privacy/name changes do not alter the historical payload policy.
- Event snapshot reads do not validate `snapshotType='event'`.
- Snapshot type schema comments omit `yearly` while runtime supports it.

The dashboard now selects the latest closed event first and consumes only that
event's newest `event` snapshot. Its recent activity also excludes voided/red picks.
Shared runtime snapshot types now cover event/monthly/yearly. These changes remain
unproven against staging data.

Progression now records one unique application per `(event, user)` and commits the
user update plus completion record atomically. Completed applications skip replay;
failed/unprocessed users can be retried explicitly after snapshot completion. Automatic
close activation remains disabled, notifications are post-commit best effort, and the
calculation still needs canonical final performance before R8 can close.

## Decisions required before remediation

No implementation should guess these:

1. Final ranking authority: immutable snapshots are recommended for closed periods.
2. Provisional authority: derived live view/materialized aggregate versus mutable user cache.
3. Tie policy: competition, dense, or deterministic tiebreaker.
4. Qualification requirement for appearing/ranking.
5. Treatment of legacy variable-unit picks.
6. Monthly/yearly boundary timestamp and timezone.
7. Reopen/correction policy and snapshot versioning.
8. Whether historical snapshots preserve then-current public identity or apply current privacy dynamically.

## Recommended architecture pattern

```text
canonical eligible scored picks
  -> shared aggregate function/query
  -> provisional scoped ranking view
  -> idempotent immutable final snapshot(version)
  -> read APIs select explicit scope/type/version
  -> user total is a rebuildable cache, never independent authority
```

All dashboard, progression, creator performance, and reward consumers should call the same ranking domain service or consume a named final snapshot. Derived caches require reconciliation queries and drift alerts.

## Remediation order

1. Canonicalize event statuses and fix the status request schema.
2. Write one eligible-pick predicate: event membership, active, scored, non-red, void policy, fixed/legacy-unit policy.
3. Define scope and tie decisions with the founder.
4. Implement a pure deterministic ranking function with tie tests.
5. Replace global `SUM(all picks)` with the canonical aggregation and a rebuild command.
6. Make snapshot creation idempotent/versioned and event reads deterministic.
7. Make close orchestration transactional or durable/idempotent with explicit step records.
8. Repair dashboard/progression consumers.
9. Run isolated Postgres proof with 25 users, ties, red/void picks, retries, reopen/correction, month/year boundaries, and reconciliation.

## Current production readiness

**Rankings Pipeline: Remediation In Progress / Staging Proof Pending.** R0 lifecycle code is implemented, but no ranking calculation behavior has been promoted as complete. Global/event/month/year results must not determine money, creator credibility, or prizes until the remaining decisions, remediation, reconciliation, and staging proof are complete.
