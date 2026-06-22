# GRIT Creator Economy

**Truth date:** June 21, 2026
**Release status:** product/schema design only; no creator-economy capability can ship today.

Dedicated backend audit: [`../backend/PAYMENTS_CREATOR_AUDIT.md`](../backend/PAYMENTS_CREATOR_AUDIT.md).

## Direct answers

| Question | Answer |
|---|---|
| Does creator mode exist? | No mounted creator mode, profile API, or creator dashboard |
| Does follower mode exist? | No follow graph, follow/unfollow API, or follower feed |
| Are creator subscriptions implemented? | No |
| Are they partially implemented? | Schema declarations and legal/marketing copy only; no deployed tables or runtime flow |
| Does Stripe Connect exist? | Environment field only; no onboarding/accounts/capabilities/charges/transfers |
| Can creators receive tips? | No; chat Boosts are fixture/UI presentation only |
| Can creators expose picks publicly? | No creator-level control |
| Can creators expose picks after lock? | No |
| Can creators expose picks only to subscribers? | No |

## Declared but undeployed tables

`shared/schema.ts` declares these in a section marked pending founder review:

- `creator_profiles`
- `creator_subscriptions`
- `creator_donations`
- `chat_sessions`
- token and payout support tables

Read-only connected database inspection confirmed that creator profile/subscription/donation and cash payout tables are absent. No mounted creator routes or services reference those models.

## Existing APIs

There are no creator-specific production APIs. Existing pick endpoints operate only on the authenticated user's own picks. Leaderboard endpoints expose limited public ranking information subject to user privacy fields, but that is not a creator publishing/subscriber system.

The Creator Agreement currently describes public, subscriber-only, reveal timing, RLS enforcement, auto-cancellation, inactivity, revenue, and tax behavior that does not exist. That page must be hidden or clearly marked unavailable until implementation and legal approval.

## Required product model

### Free follow

- Any eligible user may activate a creator profile.
- Other users can follow/unfollow for free.
- Creator profile shows bio, immutable verified performance, public posts, and public/revealed picks.
- Follow does not create a payment entitlement.

### Paid creator membership

- One monthly creator price initially.
- Separate from the GRIT Pro platform subscription.
- Subscriber entitlement has period start/end and Stripe subscription identity.
- Subscriber-only picks are authorized server-side, never only hidden in React.
- Cancellation keeps access through the paid period unless refund/dispute policy says otherwise.

### Tips

- Label as `Tip`, `Support`, or `Boost`, not charitable donation.
- One-time payment with no promised result or service.
- Creator and GRIT fee ledger entries are created only after verified payment.
- Refund/dispute reverses pending creator earnings.

## Pick visibility model still missing

The system needs an immutable publication record separate from the mutable private pick:

```text
pickId
creatorId
visibility: public | followers | subscribers
publishedAt
revealAt or revealCondition
lockedPickVersion/hash
```

Authorization must run in the API using follower/subscriber entitlement state. “Reveal after lock” and “reveal after fight” are different policies and must be named separately. Publication cannot allow a creator to alter the historical selected fighter or locked odds after the event lock.

## Historical performance

Existing picks, fights, events, locked odds, outcomes, and points can eventually produce:

- net units and odds-based performance;
- win percentage;
- event and pick history;
- streaks and qualification counts.

Missing before a creator page can claim trustworthy performance:

- canonical fixed-unit/ROI definition;
- repaired red/void/canceled handling;
- creator performance service/API;
- immutable published-pick snapshots;
- date/event/weight-class filters;
- minimum-sample disclosure;
- reconciliation and anti-edit audit trail.

## Required architecture

1. Repair picks/rankings first.
2. Deploy creator profile and follow tables through reviewed migrations.
3. Build public creator profile and server-authorized visibility.
4. Add Stripe Connect onboarding/capability state.
5. Add creator subscriptions using payment/entitlement/earning/fee ledgers.
6. Add tips after ordinary subscriptions reconcile correctly.
7. Add refunds, disputes, reserves, statements, payouts, and tax operations.
8. Add paid private chat last.

## Production blockers

- No deployed creator/follower/subscription storage.
- No creator APIs or authorization model.
- No Connect accounts or payouts.
- No accounting ledgers or reconciliation.
- No reliable creator performance authority.
- Legal copy promises absent behavior.
- Required moderation, refund, tax, and termination operations are undefined.

Related: [payments](../payments/README.md), [rankings](../rankings/README.md), and [monetization audit](../system-audit/MONETIZATION_AUDIT.md).
