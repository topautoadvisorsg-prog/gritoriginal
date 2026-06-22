# Ranking System Audit

> **Remediation update, June 21:** the pick payload mismatch, fixed-unit enforcement, matchup/round validation, and flag create/edit/delete accounting are now code verified with the exact browser route contract. Isolated staging DB proof remains. Ranking-source, red-exclusion, tie, snapshot, and event-lifecycle findings remain open.

## Intended model

The current product copy describes a fixed one-unit prediction model ranked by net units. Competitive qualification excludes red-flag picks; snapshots should provide canonical event/month/year results; green/yellow/red confidence affects qualification and analysis rather than stake size.

The code does not enforce one canonical model across submission, scoring, totals, snapshots, leaderboards, progression, and UI.

## Original critical contract failure (remediated in code)

`server/schemas/index.ts#createPickSchema` accepts:

```text
fightId, predictedWinnerId, method, round, confidence, confidenceFlag
```

The browser pick surfaces submit:

```text
fightId, pickedFighterId, pickedMethod, pickedRound, units, confidenceFlag
```

At audit time, validation replaced the body before a second incompatible schema ran. This was remediated with one shared request contract and an exact browser-payload route test.

## Scoring integrity findings

| Severity | Finding | Impact |
|---|---|---|
| Resolved in code | Pick fighter membership | Service rejects IDs outside the matchup |
| Resolved in code | Frontend/server payload mismatch | Shared contract and route test now use the browser fields |
| Resolved in code | API variable stakes | API accepts only the fixed one-unit stake |
| P1 | User `totalPoints` sums all picks, including red flags | Global rankings disagree with snapshot rankings |
| Resolved in code | Flag create/edit/delete accounting | Transaction derives projected usage and synchronizes the user cache |
| P1 | Method/round and fight membership are not validated as a coherent pick | Invalid combinations and corrupted analytics are possible |
| P2 | Stored column remains `pointsAwarded`/`totalPoints` | Semantic ambiguity encourages future logic errors |

## Leaderboard findings

At audit time, `GET /api/leaderboard` ignored its `eventId` query parameter. It now rejects ambiguous event scope and directs callers to the deterministic event route. Total rebuilds and snapshots share active/completed/non-red eligibility, but existing cached totals remain unreconciled and can still return different rankings.

Additional defects:

- sequential rank numbers are assigned without a documented tie policy;
- event leaderboard lookup does not clearly select the latest snapshot deterministically;
- dashboard chooses the newest snapshot of any type rather than the correct event snapshot;
- dashboard recent performance reuses that unrelated rank;
- snapshot type comments, supported types, and UI concepts disagree (`event`, `monthly`, `weekly`, `yearly`);
- group leaderboards sort an `intelligencePoints` field that group data does not supply;
- naming alternates between points, ROI, profit, intelligence points, and net units.

## Qualification and flags

Qualification is calculated in several places. Some paths count all non-red picks; monthly bonus aggregates only non-red picks and uses configured required-card size; user counters attempt to track flag usage incrementally. Multiple implementations mean edits, deletes, voids, and admin changes can disagree.

Recommended invariant:

1. Derive qualification from active picks for a specific event.
2. Count a pick only when its fight belongs to that event and its selected fighter belongs to that fight.
3. Exclude red picks from competitive net units and required-pick count exactly once in a shared domain function.
4. Derive flag consumption from picks or maintain it transactionally with delta-based updates; do not mix both.
5. Freeze an immutable event result snapshot after all fights are resolved and void rules applied.

## Event lifecycle risks

Event status values are not canonical. Code uses variants such as `OPEN`, `Upcoming`, `Live`, `Completed`, `Closed`, `ARCHIVED`, and `CLOSED`. That affects lock checks, upcoming-card selection, close jobs, monthly bonus queries, and history.

At audit time, event close performed snapshot, raffle, progression, and event update without a durable boundary. Close now commits durable state before an idempotent snapshot and supports retry. Raffle is removed; progression is deferred until replay-safe. Staging concurrency proof remains pending.

Voids/cancellations need explicit rules for:

- excluding fights from required-pick thresholds;
- returning a zero net-unit result;
- recalculating existing aggregates and snapshots;
- clean-sweep and near-perfect logic;
- rewards after an event is reopened or corrected.

## Required canonical contract

Use one shared schema imported by browser and server, for example:

```text
fightId
pickedFighterId
pickedMethod? (non-scoring metadata)
pickedRound? (non-scoring metadata)
confidenceFlag: green | yellow | red
```

Remove client-controlled `units` from competitive picks if fixed one-unit scoring is the product rule. Resolve odds server-side from the fight, lock the exact price with a timestamp/source, and reject a fighter not in the matchup.

## Tests required before release

- browser payload -> Express validation -> DB insert contract test;
- favorite, underdog, loss, draw/no-contest, canceled and voided fight scoring;
- red exclusion across user total, event snapshot, monthly/yearly, dashboard, progression, and rewards;
- flag add/change/delete at zero, boundary, and cap;
- edit before lock, edit at lock, admin correction, event reopen/reclose;
- eventId leaderboard isolation and deterministic latest snapshot;
- tie ranking policy;
- duplicate close/webhook/job replay;
- 25-user fixture leaderboard with pinned current user and zero-history users.

## Decision required

Choose and document one authoritative ranking source. Recommended: immutable event snapshots for completed events plus a separately labeled live/provisional calculation for open events. Do not use a mutable lifetime `users.totalPoints` field as both cache and source of truth without reconciliation.
