# Production Readiness Report

## Release decision

**Decision: NO-GO for paid public launch.**
**Allowed:** controlled internal QA using non-production Stripe data and isolated UI fixtures.
**Not allowed:** collecting subscription/creator/token money, advertising operational creator earnings, or running cash/chance rewards.

The core React/Express/PostgreSQL architecture is viable; the no-go is caused by unresolved ranking lifecycle/data integrity, unsafe/incomplete payment behavior, absent creator-money infrastructure, and pending isolated database proof rather than a need to rewrite the entire stack.

## Release gates

### P0 - must close before any public launch

1. Complete isolated staging DB proof for the remediated browser/server pick create/edit/delete transaction.
2. Preserve the now-enforced fighter membership and canonical one-unit model through reconciliation and load tests.
3. Replace one-time checkout with allowlisted recurring subscription checkout.
4. Remove client-controlled Stripe Price and redirect URLs; verify product/amount in fulfillment.
5. Add idempotent payment event processing and entitlement reconciliation.
6. Remove or disable claims/actions for undeployed creator, token, donation, paid-chat, and payout features.

### P1 - must close before money, rankings, or prizes are trusted

1. Make red-flag exclusion and fixed-unit scoring consistent across totals and snapshots.
2. Repair flag-budget update/delete behavior.
3. Canonicalize event statuses and make event close transactional/idempotent.
4. Create raffle eligibility entries before drawing; add actual funding and payout reconciliation or disable rewards.
5. Deploy and write versioned legal acceptance only after counsel-approved documents and jurisdiction rules exist.
6. Add cancellation, billing portal, invoice failure, refund, dispute, and access-revocation flows.
7. Upgrade vulnerable runtime dependencies, especially Multer and the Socket.IO/ws chain.
8. Add shared/distributed rate limits and hard per-user AI budgets before scaling paid AI.

### P2 - required for commercial quality

- mount a real notes/history journal;
- add public group join and repair group ranking/current-user behavior;
- stop group chat from returning mock success on failed persistence;
- fix dashboard event/snapshot association and query-error UX;
- code-split the 3.43 MB main JS bundle and reduce 660 KB CSS;
- replace stale historical status/handoff documents or clearly archive them;
- add operational dashboards for webhook failures, cron/job outcomes, entitlement drift, and payouts.

## Reliability and operations

The Stripe raw-body ordering is correct. Health and heartbeat routes, Sentry initialization, request logging, Socket.IO, and recurring jobs exist. Remaining risks:

- `node-cron` runs inside every app instance without a distributed leader lock;
- event close chains side effects before the status update and outside a transaction;
- several jobs use `Math.random` and lack replay identifiers;
- background startup errors may be logged while the web process stays healthy;
- Sentry tracing is configured at 100%, which may be expensive at scale;
- group chat intentionally masks storage failure;
- rate limiting uses the default process-local store;
- local filesystem uploads are not durable across ephemeral/multi-instance deployments;
- database pool defaults to 50 connections per process, which can exhaust a small Supabase plan when scaled.

## Security and dependency posture

`npm audit --omit=dev` reports 36 advisories: 2 critical, 6 high, 28 moderate. Notable runtime exposure includes Multer denial-of-service issues, WebSocket memory exhaustion through the Socket.IO chain, React Router redirect behavior, OpenTelemetry/Sentry resource issues, and old Google storage dependencies. The critical `concurrently/shell-quote` chain is primarily a development command path but still requires cleanup.

Do not run `npm audit fix --force` blindly. Upgrade direct packages deliberately, remove unused packages, rerun types/tests/build, and perform upload/socket regression tests.

## Data, privacy, and compliance

- Legal pages exist but acceptance is neither captured nor stored.
- Creator agreement promises workflows that do not exist.
- Notes, chat, AI prompts/history, moderation logs, uploads, IP/user-agent plans, and payout identity require a documented retention/deletion policy.
- Account deletion must be verified across Clerk, app DB, uploads, chat/AI logs, payments, and legally retained financial records.
- Rewards and creator payouts need age, geography, identity, tax, sanctions, and official-rules controls based on legal advice.
- The platform must keep “no wagering” behavior and copy consistent with actual betting-tracker and prize features.

## Capacity observations

The production build passes but ships a main JavaScript asset around 3.43 MB (766 KB gzip) and CSS around 660 KB (124 KB gzip). Country flag assets contribute many individual files. AI endpoints can perform moderation plus completion for each uncached chat; prediction fallback may call two providers. Group chat polls every three seconds per open client while sockets already exist elsewhere.

Before acquisition traffic, run authenticated load tests for event cards, pick submission, leaderboards, global/country chat, AI streaming, uploads, and webhook bursts against a staging clone with production-like connection limits.

## Verification summary

| Gate | Current result |
|---|---|
| TypeScript | Pass |
| Unit/integration suite | 113/113 pass |
| Production build | Pass with size warnings |
| Dependency audit | Fail |
| Connected DB migration parity | Fail for staged creator/token/payout/legal tables |
| Payment sandbox end-to-end | Not demonstrated |
| Pick browser/API contract | Code verified; isolated staging database proof pending |
| Prize funding-to-payout flow | Not implemented |
| Visual fixture QA | Fixture system exists; not proof of live DB workflows |

## Definition of launch ready

Launch ready means every P0/P1 gate is closed, Stripe sandbox lifecycle tests pass, staging schema matches code, reward/creator claims match enabled capabilities, dependency highs are resolved or formally accepted, load tests fit platform limits, rollback/reconciliation runbooks exist, and a release candidate passes desktop/mobile authenticated QA without fixture mode.
