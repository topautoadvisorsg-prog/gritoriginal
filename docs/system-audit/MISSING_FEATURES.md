# Missing Features List

This list distinguishes absent behavior from broken existing behavior. Priorities are based on user harm, money risk, and whether current UI/legal copy implies availability.

## P0 - promised or required for core operation

- Canonical pick submission contract shared by UI and API.
- Safe recurring subscription purchase with server-owned product catalog.
- Subscription self-service cancellation/billing portal and failure/refund/dispute handling.
- Payment event idempotency and Stripe-to-entitlement reconciliation.
- Versioned legal acceptance during registration and checkout.
- Feature gating that hides unavailable creator, token, tip, paid-chat, and reward claims.

## P1 - monetization and rewards

- Creator follow graph and profile qualification.
- Free/public and paid/subscriber pick visibility rules.
- Creator subscription checkout and entitlement lifecycle.
- Donation/boost purchase flow.
- Paid 1:1 chat booking, escrow, completion, cancellation, refund, and dispute flow.
- Stripe Connect onboarding, capability checks, transfers, reserves, payouts, and reconciliation.
- Creator earnings/statements/admin review and tax workflow.
- Token pack checkout, immutable token ledger, atomic spend, grants, expiry/refund rules.
- Reward treasury/funding ledger, immutable eligibility snapshot, auditable draw, payout provider, failed payout workflow.
- Prize age/geography/identity/tax eligibility controls and official-rules acceptance.

## P1 - competition integrity

- Shared fixed-unit scoring domain contract.
- Fighter-in-fight and method/round coherence validation.
- Deterministic tie policy.
- Event-scoped leaderboard query.
- Provisional versus final ranking distinction.
- Transactional/idempotent event close and correction/reopen policy.
- Reconciliation job for pick totals, flag usage, snapshots, progression, and rewards.
- Explicit canceled/void/no-contest behavior across qualification and prizes.

## P2 - community and retention

- Public group self-join/request-to-join.
- Working group leaderboard metric and current-user identity.
- Member-role management UI and moderation tools.
- Durable group chat failure behavior, pagination, limits, and realtime delivery.
- User notes journal/history route with search/filter by event/fighter/date.
- Real local draft/autosave or corrected notes copy.
- Notification preference enforcement and delivery-status UI.
- Friends/follow activity model if “friends activity” remains a dashboard promise.

## P2 - AI and operations

- Enforced per-user AI quota/budget, not observation-only metering.
- Atomic token debit if token monetization is adopted.
- Provider cost/latency dashboard and alert thresholds.
- Prompt/config version audit trail and response trace correlation.
- Distributed rate-limit store.
- Durable job scheduler with concurrency control, idempotency, retries, and dead-letter review.
- Webhook replay/reconciliation admin tooling.
- Production object storage lifecycle for avatars/slips.
- Staging environment seeded with isolated deterministic QA fixtures.

## Explicitly not verified

The connected database had no event rows, so populated live event, pick, leaderboard, fighter-image, and close/reward behavior was not verified. The audit fixture endpoint is useful for visual QA but intentionally does not prove persistence or production-data workflows.
