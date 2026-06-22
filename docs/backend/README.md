# GRIT Backend Capability Ledger

**Last verified:** June 21, 2026
**Purpose:** record what is provably complete before work moves to the next backend pipeline. Frontend visual approval remains a founder decision.

## Completion states

| State | Meaning |
|---|---|
| **Verified complete** | Canonical contract, server invariants, durable persistence, failure/replay behavior, route and database integration tests, full suite/build, staging smoke test, and current documentation all pass |
| **Code verified** | Contract/policy/route tests and full suite/build pass, but isolated staging database proof is still pending |
| **Implemented, unproven** | Substantial code exists without enough integration evidence to trust the pipeline |
| **Partial** | Some stages exist; the lifecycle cannot finish correctly |
| **Missing** | No mounted operational implementation |
| **Blocked** | Must not ship because a known defect can corrupt access, money, rankings, or user data |

A pipeline is never marked complete because a UI renders, a table is declared, or a unit test covers only a helper.

All implementation plans are indexed in [`plans/MASTER_IMPLEMENTATION_PLAN.md`](plans/MASTER_IMPLEMENTATION_PLAN.md). A plan documents the path; it does not promote the capability state.

## Current ledger

| Pipeline | State | Proven working | Remaining proof/blocker |
|---|---|---|---|
| Build/type/test | **Verified complete** | TypeScript, 25 Vitest files/166 tests, production Vite build | Bundle/dependency warnings remain operational debt, not build failure |
| Connected DB access | **Verified complete** | Read-only connection and 52-table inventory | Schema parity automation/readiness gate missing |
| Clerk session + local user provisioning | **Implemented, unproven** | Mounted Clerk middleware/guards; real login/onboarding observed | Automated authenticated staging lifecycle and deletion/reconciliation proof |
| Pick create/update/delete | **Code Verified / Staging DB Proof Pending** | Shared browser/API schema, fixed unit, matchup/round validation, serialized flag accounting, delete reconciliation, route contract tests | Execute [`PICK_STAGING_PROOF.md`](PICK_STAGING_PROOF.md) against isolated PostgreSQL |
| Pick locking | **Implemented, unproven** | Event, fight, lock-time, scheduled-time, and `isLocked` checks exist | One canonical status model and DB-backed boundary/race tests |
| Fight scoring | **Implemented, unproven** | Transactional odds-based scoring tests pass | Full void/cancel/correction/event replay integration |
| Rankings pipeline | **Remediation In Progress / Staging Proof Pending** | R0 lifecycle, R1 reconciliation, R3 scopes, R4 idempotency, durable close, R7 dashboard association, and exactly-once progression application ledger implemented | Apply/prove migrations/concurrency, clean legacy data, define version/tie/qualification/legacy policy, and make progression consume canonical performance |
| Dashboard aggregation | **Partial** | Authenticated aggregate endpoint and zero-state UI exist | Status casing and event/snapshot association defects |
| Payments pipeline | **Audit Complete / Production Blocked** | [`PAYMENTS_CREATOR_AUDIT.md`](PAYMENTS_CREATOR_AUDIT.md) traces Billing, webhooks, refunds, ledgers and reconciliation | One-time checkout, client-owned terms, and absent financial ledger block money |
| Creator economy pipeline | **Audit Complete / Not Implemented** | [`PAYMENTS_CREATOR_AUDIT.md`](PAYMENTS_CREATOR_AUDIT.md) traces Connect, subscriptions, tips and payouts | Declared tables are undeployed; no mounted creator/Connect lifecycle |
| AI chat | **Functional / Production Verification Pending** | Premium gate, moderation, cache, streaming, history, usage events | Hard per-user budget/token debit, distributed limits, cost/retry integration tests |
| AI tokens | **Missing** | Staged table design only | Deployed ledger, purchase fulfillment, atomic debit/recredit, refunds |
| Global/event/country chat | **Implemented, unproven** | REST/socket services, moderation and rate limiting exist | Authenticated load, reconnect, multi-instance, persistence-failure proof |
| Groups | **Functional / Production Verification Pending** | Deployed storage, CRUD/membership/chat APIs | Self-join, leaderboard data, identity, truthful persistence errors, moderation |
| Notes | **Partial** | Per-fight post-result note storage/API | Journal/history, backend length policy, draft behavior, retention proof |
| Data Engine ingestion | **Out of scope for this backend pass** | Existing code was inventoried only | Re-enter scope only when it directly affects app behavior under verification |
| Notifications | **Implemented, unproven** | OneSignal service/triggers and preferences exist | Delivery receipts, retry/dead-letter, preference enforcement matrix |
| Uploads | **Partial** | Avatar/slip/image routes and validation exist | Durable object storage, malware/content controls, cleanup and multi-instance proof |
| Event raffle/monthly bonus | **Blocked** | Selection/accounting fragments exist | Remove subscription raffle; no funded payout/compliance/reconciliation lifecycle |
| Deployment/runtime health | **Partial** | Railway build/start/liveness and diagnostic health exist | Readiness/schema gate, durable uploads/jobs/rate limits, dependency remediation |

## Pick pipeline evidence added

- One shared `createPickRequestSchema` is used by browser and API.
- Legacy field names and variable units are rejected.
- Competitive stake is fixed at one unit.
- Selected fighter must belong to the matchup; round must fit the fight.
- Save/update is transactional with a per-user row lock.
- Flag use is projected from event picks, preventing edit double-counts.
- User flag cache is synchronized after create/update/delete.
- Delete updates aggregation and invalidates the event cache.
- Exact browser payload, legacy rejection, matchup, round, and flag policies have tests.
- Full verification passes: TypeScript, 25 test files, 166 tests, production build.

It remains **Code Verified / Staging DB Proof Pending**, not **Verified complete**, because the connected database has no event card and fake records must not enter production. Promotion requires the isolated proof plan above.

## Remediation review evidence

The June 21 review rechecked staging guards, lifecycle transitions, ranking eligibility,
reconciliation SQL, explicit scopes, dashboard association, and snapshot idempotency.
It fixed alternate-role database identity detection, legacy dashboard status filtering,
deterministic snapshot tiebreaking, and mutually exclusive snapshot scope inputs.

A production read-only query found zero event rows, zero duplicate snapshot scopes,
and zero malformed pick fight IDs. This lowers immediate migration cleanup risk but
does not prove migrations, writes, locking, retries, or reconciliation; those remain
isolated-staging gates.

## Promotion checklist

Before changing any row to **Verified complete**, record:

1. Contract/schema name and version.
2. Server and database invariants.
3. Idempotency/concurrency strategy.
4. Failure and retry behavior.
5. Route-level test evidence.
6. Database integration evidence.
7. Staging smoke/load evidence.
8. Observability and reconciliation procedure.
9. Current README link.
10. Verification date and commit.

## Next pipeline

Finish pick staging proof first. Then repair ranking authority and red-pick exclusion because creator performance, progression, rewards, and public credibility depend on it. Payments follow only after competition data is trustworthy.
