# Technical Debt List

## Critical debt

| Debt | Evidence | Risk | Resolution |
|---|---|---|---|
| Payment state conflation | One-time Checkout writes subscription fields on `users` | Revenue/access leakage | Separate payment events, subscriptions, and entitlements |
| Schema versus deployment ambiguity | Creator/token/legal tables exported but absent in DB | Runtime failures and false product claims | Migration manifest plus startup/readiness schema checks |
| Multiple ranking sources | `users.totalPoints` versus snapshot aggregation | Conflicting winners | Canonical calculation and reconciliation |
| Non-atomic event close | Snapshot/draw/progression/status writes | Duplicate or partial rewards/results | Transactional state machine plus idempotent jobs |

## High debt

- Event status strings are untyped and inconsistently cased across database, API, jobs, and UI.
- Flag budget is stored both as mutable user state and derivable pick state without transactional deltas.
- `pointsAwarded` and `totalPoints` now mean net-unit hundredths, preserving misleading legacy names.
- Routes contain business logic and direct database writes despite handoff architecture rules.
- Group APIs use broad `any` types and silent persistence fallbacks.
- `window.currentUser` is an undocumented global identity dependency.
- In-process rate limiting, cron, caches, and job startup are unsafe for horizontal scaling.
- Filesystem uploads conflict with ephemeral/multi-instance hosting.
- Payment/reward flows lack append-only ledgers and reconciliation.
- Legal/creator claims are maintained separately from capability flags.
- Production dependency tree has 2 critical, 6 high, and 28 moderate audit findings.

## Medium debt

- `STATUS.md`, `HANDOFF.md`, and parts of `SPEC.md` are historical but presented as current.
- README previously contained mojibake, stale phase counts, and contradictory remote/auth status.
- Main frontend bundle is 3.43 MB uncompressed; routes are eagerly imported.
- CSS output is 660 KB and flag assets generate a large build manifest.
- Dashboard and other components use `useQuery<any>` instead of response types.
- Dashboard renders nothing on fetch failure.
- Group chat polls every three seconds instead of using the existing realtime layer.
- AI config and event caches live in process memory; multiple instances can diverge.
- OpenMeter tracking is fire-and-forget and does not enforce quotas.
- AI history limit accepts unbounded/invalid query values without a schema.
- Notes advertise autosave without implementing it and lack backend length constraints.
- Snapshot selection queries often omit explicit type/event/version ordering.
- Reward selection uses `Math.random`, unsuitable for externally auditable drawings.
- Sentry traces sample at 100% when configured.
- Database pool defaults to 50 connections per process.

## Low debt and cleanup

- Old Replit auth/storage folders remain after Clerk migration.
- Two lockfiles and multiple seed locations increase tool ambiguity.
- Unused imports such as strict limiters and stale components indicate drift.
- Unicode/mojibake remains in older source comments and UI strings.
- Old ticket raffle APIs coexist with the subscription-pool raffle model.
- `EventHistoryPage` exists but is not routed.
- Product tier vocabulary mixes free/medium/premium with contender/challenger/creator.
- Browserslist data is about 12 months old.

## Testing debt

The 166 tests now cover the pick contract, staging safety, event lifecycle, ranking eligibility/reconciliation, leaderboard scopes, snapshot idempotency, durable close behavior, and progression application replay rules. Remaining coverage clusters:

- DB-backed concurrent pick create/edit/delete and cache/socket reconciliation;
- Stripe signed webhook lifecycle and replay;
- subscription renew/fail/cancel/refund/dispute;
- DB-backed event close twice and after partial failure;
- red flags across every ranking surface;
- live schema migration parity;
- group self-join/leaderboard/chat persistence;
- legal acceptance and account deletion;
- authenticated browser QA with non-empty staging data;
- upload and Socket.IO abuse/load tests.

## Debt policy

Do not combine broad cleanup with P0 behavior changes. First add contract tests around the failing workflow, repair one source of truth, migrate/reconcile data, and remove the obsolete path. Record every money/ranking migration with a rollback and reconciliation query.
