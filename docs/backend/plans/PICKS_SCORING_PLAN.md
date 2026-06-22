# Picks, Locking, and Scoring Completion Plan

**Current state:** create/edit/delete is Code Verified / Staging DB Proof Pending. Locking and scoring are implemented but unproven end to end.

## Existing proof

- Shared request contract and fixed one-unit API.
- Matchup/round validation.
- Transactional flag accounting with row serialization.
- Exact browser/API contract tests.
- Odds-based scoring unit tests.

## Remaining work

1. Provision isolated PostgreSQL and execute [`../PICK_STAGING_PROOF.md`](../PICK_STAGING_PROOF.md).
2. Replace free-form event/fight states with the shared lifecycle enum from the rankings plan.
3. Centralize lock policy: event lock, scheduled fight lock, official start, admin correction, and clock source.
4. Define odds-source absence/change policy and whether edits refresh locked odds.
5. Define draw, no-contest, canceled, voided, overturned, and correction behavior.
6. Build idempotent result finalization with an explicit correction/version workflow instead of permanent hard failure.
7. Reconcile pick score, user aggregate, snapshots, progression, and notifications after corrections.
8. Add staging concurrency, boundary-time, result replay, rollback, and reconciliation tests.

## Required invariants

- One user/fight row enforced by DB uniqueness.
- Selected fighter belongs to fight.
- New competitive stake equals one unit.
- Locks are server/database authoritative.
- Scoring is deterministic from pick version, locked odds, and result version.
- Red/void eligibility comes from one shared predicate.
- No notification/cache/socket side effect represents an uncommitted write.

## Definition of done

All staging proof cases pass against isolated PostgreSQL; result replay/correction is deterministic; locks hold under concurrent requests; reconciliation rebuilds identical scores; downstream rankings consume the same eligible scored picks.

**Complexity:** L after staging exists. **Production risk:** High because historical score corrections can change rankings.
