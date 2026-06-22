# GRIT System Status Report

**Audit date:** June 21, 2026
**Reviewed branch/commit:** `main` at `d36badf`
**Method:** static code trace, route/schema/UI comparison, read-only connected database inspection, TypeScript, Vitest, production build, and dependency audit.

## Executive status

GRIT has a substantial working application shell: Clerk authentication, event/fighter browsing, admin tooling, chat infrastructure, AI analysis, progression logic, legal pages, responsive UI work, and a 113-test suite. It is suitable for controlled internal QA. It is **not ready for a paid or prize-bearing public launch** because several core contracts and money paths are incomplete or internally inconsistent.

| Area | Status | Evidence-based conclusion |
|---|---|---|
| Authentication | Partial | Clerk is integrated and public auth routes resolve. Profile onboarding is app-owned. Legal acceptance is not recorded. |
| Fight/event data | Partial | CRUD and ingestion paths exist. Connected DB contained no events at audit time, so live data behavior could not be validated. |
| Picks | Code verified | Shared request contract, fixed-unit/matchup checks, transactional flag accounting, and route tests pass; isolated staging DB proof remains. |
| Rankings | Blocked | Global totals include picks that snapshots exclude; event query is ignored; ties and snapshot selection are inconsistent. |
| Dashboard | Partial | Zero-state crash was guarded, but status casing and snapshot association can show the wrong event/rank. |
| Chat | Partial | Global/event/country chat and sockets exist. Group chat silently claims success on persistence failures. |
| Groups | Partial | Creation/membership/chat routes exist; public self-join is absent and the leaderboard lacks its ranking field. |
| Notes/journal | Partial | Post-fight notes exist per fight, but there is no mounted journal/history view, search, or reliable autosave. |
| AI | Partial | Premium gates, moderation, caching, streaming, and metering exist. No enforceable per-user spend quota or token deduction exists. |
| Platform subscriptions | Blocked | Stripe checkout is one-time payment mode, while fulfillment grants recurring premium semantics. |
| Creator economy | Not built | Schema/marketing/legal copy exist; deployed tables and operational routes/services do not. |
| Rewards | Blocked | Pool ledger and selection logic exist, but funding/disbursement do not; event close draws before creating entries. |
| Operations | Partial | Health, logs, Sentry hooks, crons, and job service exist. In-process cron lacks distributed locking/idempotency guarantees. |

## Deployed database truth

The read-only inspection connected successfully and found 52 public tables. Core tables such as `user_picks`, `leaderboard_snapshots`, `raffle_pool`, and `raffle_draws` exist. These staged tables do **not** exist:

- `creator_profiles`
- `creator_subscriptions`
- `creator_donations`
- `token_packs`
- `token_balances`
- `token_transactions`
- `token_feature_costs`
- `cash_payouts`
- `legal_acceptances`

`shared/schema.ts` declaring a table is not evidence that production has it. `migrations/0001_week2_creator_token_rating_antifraud.sql` remains a staged capability boundary.

The events table contained zero rows during inspection. Therefore no claim about a currently populated 12-fight card, live ranking set, or reward pool could be verified against deployed data.

## Core workflow findings

### Registration and onboarding

Clerk owns authentication; GRIT creates/updates its local user record in `server/auth/guards.ts`. `src/App.tsx` latches onboarding until completion, avoiding the prior mid-flow unmount. However, no route writes a versioned ToS/privacy/cookie/AUP acceptance, and the corresponding table is not deployed.

### Picks and event close

The original frontend/backend request mismatch was remediated on June 21. Browser and API now share `createPickRequestSchema`; fixed units, matchup membership, round limits, serialized flag accounting, and delete reconciliation have route/policy tests. The pipeline is code verified but still needs isolated staging DB concurrency/replay proof.

At audit time, event close ran snapshot, raffle, and progression before updating status. It now commits `Closed` plus a durable close record first, creates an idempotent snapshot, and exposes retry state. Raffle is removed from close; progression is deferred until replay-safe. Staging proof remains pending.

### Social groups

Groups can be created and owners can add members. Discovery has no public self-join operation. `GroupDetailPage` and `GroupChat` rely on `window.currentUser`, which is not established by the app. Group leaderboards sort `intelligencePoints`, but `groupService` does not return that property. Chat persistence errors are converted to empty history or mock success, hiding data loss.

### Notes and user history

Notes are restricted to completed fights and a 24-hour window. The UI copy says notes autosave locally, but there is no local persistence. The unmounted `EventHistoryPage` means users cannot browse a journal; they must revisit an individual fight. Backend content length is not constrained to the UI's implied limit.

### AI and cost exposure

AI prediction and chat are premium gated. Fight Q&A caching, moderation, a 1,000-token response cap, OpenMeter events, and IP-oriented rate limits reduce exposure. They do not create a budget ceiling: the rate limiter uses process memory/IP, OpenMeter observes rather than rejects, and the token-economy tables are not deployed or charged. A user behind rotating IPs or multiple instances can exceed intended usage. Prediction fallback can incur both OpenAI and Anthropic cost for one request.

### Dashboard

The dashboard API compares event status using multiple incompatible forms (`ARCHIVED`, `CLOSED`, `Closed`, `Completed`). It may select a closed card as upcoming. It selects the newest snapshot without restricting `snapshotType` or matching the last closed event, then reuses that rank for recent activity. Red-flag picks are included in recent net units. The component also returns nothing on query failure instead of an actionable error state.

## Documentation truth

The previous README, `STATUS.md`, and `HANDOFF.md` contain obsolete claims such as Week 0/Week 1 status, seven or 91 tests, Clerk not yet integrated, no Git remote, and future route counts. This README and the `docs/system-audit` set supersede those claims. `SPEC.md` remains a product plan, not proof of implementation.

## Verification record

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npx vitest run` | Pass: 25 files / 166 tests |
| `npm run build` | Pass with large-bundle and stale Browserslist warnings |
| `npm audit --omit=dev` | Fail: 36 advisories, including 2 critical and 6 high |
| Connected DB read-only schema check | Pass; staged monetization/legal tables absent |

Green compile/tests now exercise the exact browser pick payload through the real validation/route boundary. They do not replace isolated database proof or prove payment/reward correctness.

## Audit map

- [Monetization Audit](MONETIZATION_AUDIT.md)
- [Payment Flow](PAYMENT_FLOW.md)
- [Ranking System Audit](RANKING_SYSTEM_AUDIT.md)
- [Production Readiness](PRODUCTION_READINESS.md)
- [Missing Features](MISSING_FEATURES.md)
- [Technical Debt](TECHNICAL_DEBT.md)
- [Recommended Next Build Order](RECOMMENDED_NEXT_BUILD_ORDER.md)
