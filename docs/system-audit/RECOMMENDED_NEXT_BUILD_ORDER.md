# Recommended Next Build Order

> Superseded for execution detail by the dependency-ordered [`../backend/plans/MASTER_IMPLEMENTATION_PLAN.md`](../backend/plans/MASTER_IMPLEMENTATION_PLAN.md). This file remains the original audit recommendation.

The order below minimizes rework. Monetization should not be layered on top of an unreliable pick/ranking model, and creator payments should not precede a safe platform subscription foundation.

## 1. Freeze claims and establish a release baseline

- Disable unavailable creator/token/tip/paid-chat/reward CTAs and revise legal/rules copy.
- Create a staging database and Stripe test-mode catalog.
- Add CI gates for types, the full Vitest suite, build, dependency policy, and migration parity.
- Capture the current API contracts and event-status vocabulary.

**Exit:** production exposes only capabilities that actually work; staging is isolated and reproducible.

## 2. Repair picks and competition integrity

- Run the remediated shared pick contract and transactional flag accounting against an isolated staging card, including concurrent requests.
- Canonicalize event statuses and void/cancel rules.
- Make snapshot creation and event close idempotent; add reconciliation tests.

**Exit:** a full staging card can be picked, edited, locked, scored, corrected, and closed twice safely.

## 3. Unify rankings and dashboard truth

- Select snapshots as the final authority and define provisional rankings.
- Repair red exclusion, event scoping, ties, and deterministic snapshot lookup.
- Rebuild user totals from canonical picks and add drift monitoring.
- Associate dashboard upcoming/recent cards and ranks by exact event/type.

**Exit:** all ranking surfaces return the same result for the same scope and rules.

## 4. Build safe platform subscriptions

- Add server-owned plans and recurring Stripe Checkout.
- Add payment event and entitlement ledgers with webhook idempotency.
- Implement portal/cancel, invoice failure/grace, refund/dispute, and reconciliation.
- Deploy versioned legal acceptance and test the full sandbox lifecycle.

**Exit:** buy, renew, fail, recover, cancel, refund, dispute, and replay all produce correct access.

## 5. Harden production operations

- Resolve runtime dependency highs/criticals.
- Move uploads to durable object storage.
- Add distributed rate limits and durable/idempotent scheduled jobs.
- Tune DB pool, Sentry sampling, bundles, caching, and alerts.
- Run production-like load and failure tests.

**Exit:** capacity, rollback, alerting, and reconciliation runbooks are exercised.

## 6. Finish retention features

- Mount the notes journal and implement honest draft behavior.
- Add group self-join, real leaderboard data, auth identity, role controls, and durable realtime chat.
- Verify notification settings and account deletion across every data store.

**Exit:** community features persist reliably and users can control/retrieve their data.

## 7. Decide reward model with counsel

- Choose one raffle/bonus model and remove the other.
- Add official rules, eligibility, funded ledger, immutable entrants, auditable selection, approval, payout, tax, and reconciliation.
- Keep feature flags off until end-to-end staging payout tests and legal approval.

**Exit:** every advertised prize can be funded, awarded, paid, audited, reversed where allowed, and reported.

## 8. Build creator economy as a separate financial product

- Deploy creator/follow/visibility data model.
- Build trust qualification and free/public subscriber content rules.
- Add Connect onboarding and capability state.
- Implement subscriptions, donations, earnings ledger, fees, reserves, refunds, payouts, statements, and disputes.
- Add paid chat last, after ordinary creator money flows are reconciled.

**Exit:** one test creator completes onboarding, earns, refunds, and receives a reconciled payout without manual database edits.

## 9. Add AI tokens after the payment foundation

- First enforce simple per-plan AI quotas and measure real cost.
- Keep token sales disabled until recurring billing, webhook idempotency, refunds, and reconciliation are stable.
- Build purchase/grant/spend/refund as an immutable atomic ledger with an atomic debit before each AI request.

**Exit:** provider cost is bounded per user, failed AI calls have a defined debit/recredit policy, and every token balance is explainable from ledger entries.

## Launch sequence

1. Internal QA with deterministic fixtures.
2. Closed staging beta with no real money/prizes.
3. Limited public free beta.
4. Platform subscriptions after payment gates pass.
5. Rewards after legal and payout gates pass.
6. Creator monetization after Connect/ledger/reconciliation gates pass.

Skipping directly to creator cards, token packs, or prize promotion would amplify the current contract and accounting defects. The shortest commercial path is reliable picks/rankings, then safe platform subscriptions, then operational hardening.
