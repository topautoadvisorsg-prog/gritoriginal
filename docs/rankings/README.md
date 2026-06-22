# GRIT Rankings and Picks

**Truth date:** June 21, 2026
**Release status:** the pick contract is code-verified; scoring/snapshot/ranking consistency is not production-safe.

Backend resolution matrix: [`../backend/RANKINGS_RESOLUTION_PLAN.md`](../backend/RANKINGS_RESOLUTION_PLAN.md).

## Current data model

`user_picks` stores user, fight, selected fighter, method/round, units, locked American odds, result fields, `pointsAwarded`, confidence flag, status, and lock timestamps. Despite legacy names, `pointsAwarded` is treated as net-unit hundredths by current scoring. `users.totalPoints` is a mutable lifetime aggregate with the same naming problem.

`leaderboard_snapshots` stores event/monthly/yearly ranking JSON. Snapshot calculation sums non-red picks and converts hundredths to net units.

New snapshots also store a unique idempotency key derived from exact event or period
scope. Retries return the existing row. Legacy snapshots remain nullable until a
reviewed duplicate cleanup and correction/version policy are approved.

## Mounted APIs

| API | Current behavior |
|---|---|
| `GET /api/picks/event/:eventId` | Authenticated user's picks for the event |
| `GET /api/picks/fight/:fightId` | Authenticated user's pick for a fight |
| `GET /api/picks/event/:eventId/qualification` | Computes event qualification and flag availability |
| `POST /api/picks` | Creates/updates a pick; currently has an incompatible request schema |
| `DELETE /api/picks/:fightId` | Deletes an open pick and transactionally reconciles flag use |
| `GET /api/picks` | Authenticated user's picks |
| `GET /api/leaderboard` | Global mutable totals; optional country filter; rejects ambiguous `eventId` |
| `GET /api/leaderboard/rank/:userId` | Rank from mutable global totals |
| `GET /api/leaderboard/event/:eventId` | Newest deterministic `event` snapshot for one validated event ID |
| `GET /api/leaderboard/latest/:type` | Latest validated monthly or yearly snapshot |

Event scope is explicit; the global endpoint no longer silently returns lifetime data for event requests.

## Pick request remediation

The browser and API now share `createPickRequestSchema`: `fightId`, `pickedFighterId`, optional method/round, fixed `units: 1`, and confidence flag. Route tests execute the exact browser payload. The transactional service validates matchup membership/rounds and synchronizes derived flag use. Isolated staging database proof is still required before calling the pipeline complete.

## Scoring behavior

- Correct picks earn odds-based net units; losses lose stake units.
- Odds are locked on pick create/update.
- Scored value is stored in `pointsAwarded` as hundredths.
- Snapshot rankings and future `users.totalPoints` rebuilds share the active, completed-fight, non-red eligibility predicate.
- Existing `users.totalPoints` values still require isolated reconciliation before they are authoritative.
- `npm run rankings:reconcile:staging` reports drift; `-- --apply` additionally requires `ALLOW_RANKING_RECONCILIATION=1`, runs serializably, and verifies zero remaining drift.
- Stored/API units still allow 1-5 even though current product copy describes one fixed unit.

## Integrity gaps

- Method remains prediction metadata and needs a canonical result-normalization map before method analytics are authoritative.
- Historical global totals can still drift until the canonical reconciliation runs.
- Event-scoped leaderboard is not implemented.
- Ties receive sequential ranks without a documented policy.
- Snapshot reads are now event/type/date deterministic; legacy duplicate cleanup and explicit correction versions remain pending.
- Canonical event lifecycle code/migration is authored; staging application and legacy-row classification remain pending.
- Snapshot close is durable/retryable; automatic progression remains deliberately deferred and raffle no longer runs during close.
- Progression has a unique per-user/event application ledger and manual replay-safe retry endpoint; automatic close activation remains deferred pending canonical performance policy.
- Canceled, voided, reopened, and corrected event rules are not one shared domain policy.

## Historical performance available today

The underlying pick data can support:

- odds-based net units;
- wins/losses and win percentage;
- event grouping through `event_fights`;
- pick history with locked odds;
- monthly/yearly snapshot summaries.

But no trustworthy creator-performance API currently assembles these metrics, and global `totalPoints` should not be used as canonical ROI. True ROI also requires a canonical stake denominator and consistent void/red exclusion rules.

## Required canonical model

1. One shared request schema imported by browser and server.
2. Fixed one-unit competitive stake if that remains the approved rule.
3. Server resolution of matchup membership and odds.
4. One scoring/qualification function used by totals, snapshots, dashboard, progression, rewards, and creator stats.
5. Provisional live ranking separated from immutable final event snapshots.
6. Explicit tie, void, cancellation, correction, and reopen policies.
7. Reconciliation that can rebuild totals and flag use from picks.

## What can ship today

Visual fixture QA and code-verified pick contracts. Production competition and public creator performance remain blocked until staging proves the remediated transaction and red exclusion/leaderboard authority are repaired.

See the full [ranking audit](../system-audit/RANKING_SYSTEM_AUDIT.md).
