# Creator Economy Resolution Plan

**Current state:** Audit Complete / Not Implemented. Tables are staged and undeployed; no creator/follow/visibility/Connect APIs exist.

## Dependency gate

Do not implement paid creators until rankings are authoritative and platform payments/ledgers are stable. Creator credibility depends on immutable performance; creator money depends on proven settlement.

## Decisions required

- Creator eligibility, moderation/trust requirements, launch countries, and age.
- Free-follow behavior and public/follower/subscriber visibility.
- Single membership price versus tiers.
- Platform fee, reserves, refund allocation, payout schedule/minimum, and negative balances.
- Connect charge model and merchant/refund/dispute responsibility.
- Historical pick publication/reveal rules.

## Delivery phases

1. Replace staged migration with reviewed migrations for creator profiles, follows, publication versions, and visibility.
2. Build free creator activation, follow/unfollow, public profile, moderation state, and server-side visibility authorization.
3. Publish immutable locked-pick versions and canonical performance from final rankings.
4. Add Stripe Connect hosted/embedded onboarding, capability/account-status webhooks, and creator eligibility checks.
5. Add creator products/Prices and subscriber entitlement lifecycle using the platform payment-event pattern.
6. Add gross earning, platform fee, reserve, refund, dispute, transfer, and payout ledgers.
7. Add subscriber cancellation/refund and creator pause/termination behavior.
8. Add one-time Support/Tip only after subscriptions reconcile correctly.
9. Add statements, payout reconciliation, tax-document operations, admin review, and customer support tools.
10. Add paid private chat last, as its own booking/service/refund pipeline.

## Invariants

- Private picks never rely on frontend hiding.
- Published historical picks cannot be rewritten after lock.
- Creator available balance is derived from settled ledger entries.
- No payout while Connect capabilities, identity, reserve, fraud, or dispute gates fail.
- Every fee/split shown to users matches ledger calculation and Stripe movement.

## Proof

Free follow/visibility matrix; creator onboarding incomplete/restricted/verified; subscribe/renew/cancel/refund/dispute; creator pause/ban; reserve and negative balance; transfer/payout fail/retry; tax threshold/report; privacy/deletion; unauthorized pick access.

## Definition of done

One staging creator can onboard, publish public/subscriber picks, earn, refund, receive a reconciled payout, and produce a statement without manual DB edits. Authorization and ledger invariants pass adversarial tests.

**Complexity:** XL, multi-release. **Production risk:** Very high.
